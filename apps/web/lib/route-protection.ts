import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * API routes that must be reachable WITHOUT a session (webhooks, public
 * checkout, etc). These are called by external services or anonymous visitors,
 * so the middleware must not require auth for them.
 */
const PUBLIC_API_PATHS = [
  "/api/checkout",
];

/**
 * Protected paths that require authentication.
 */
export function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return false;
  }
  return (
    pathname === "/" ||
    pathname.startsWith("/preview/") ||
    pathname.startsWith("/api/")
  );
}

/**
 * Auth paths (login/register) — redirect to home if already signed in.
 */
export function isAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

/**
 * Create a Supabase server client for use in middleware.
 * Mutates the response ref so cookie headers are forwarded.
 */
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
}
