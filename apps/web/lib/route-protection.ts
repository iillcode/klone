import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protected paths that require authentication.
 */
export function isProtectedPath(pathname: string): boolean {
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
