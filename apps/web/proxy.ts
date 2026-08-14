import { NextResponse, type NextRequest } from "next/server";
import {
  isProtectedPath,
  isAuthPath,
  createMiddlewareClient,
} from "@/lib/route-protection";

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createMiddlewareClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users to login
  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPath(pathname)) {
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
