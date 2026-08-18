import { NextResponse, type NextRequest } from "next/server";
import {
  isProtectedPath,
  isAuthPath,
  createMiddlewareClient,
} from "@/lib/route-protection";

/** Hard cap for the Supabase auth round-trip. When the machine cannot reach
 *  Supabase (offline / flaky network), a raw `getUser()` hangs for ~10s+ and
 *  stalls EVERY page load. Timing out keeps the middleware snappy; auth is
 *  still enforced downstream by the RLS-scoped server clients. */
const AUTH_CHECK_TIMEOUT_MS = 4000;

/** True when the request carries a Supabase session cookie (cheap, local
 *  check — used as the fallback when the auth round-trip times out). */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.includes("auth-token"));
}

export default async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Public pages that are neither protected nor auth pages need no session
  // check at all — don't call Supabase for them (fast + offline-tolerant).
  const needsAuth = isProtectedPath(pathname) || isAuthPath(pathname);
  if (!needsAuth) return response;

  const supabase = createMiddlewareClient(request, response);

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];
  try {
    ({
      data: { user },
    } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("auth-check-timeout")),
          AUTH_CHECK_TIMEOUT_MS,
        ),
      ),
    ]));
  } catch {
    // Supabase unreachable: fall back to the session cookie instead of
    // blocking or crashing (downstream server code re-verifies via RLS).
    user = hasSessionCookie(request) ? ({} as NonNullable<typeof user>) : null;
  }

  const signedIn = Boolean(user);

  // Redirect unauthenticated users to login
  if (isProtectedPath(pathname) && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (signedIn && isAuthPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files, _next, and api routes that don't need auth
    "/((?!_next/static|_next/image|favicon.ico|sample.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
