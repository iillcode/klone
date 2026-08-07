import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/auth";

/**
 * Auth callback — the landing point for:
 *   - Google OAuth (PKCE flow, `?code=...&next=...`)
 *   - Email confirmation links (`?code=...`)
 *
 * Exchanges the code for a session, ensures the user's public profile row
 * exists (first login via OAuth or confirmed email), then sends the user on
 * their way. Never returns a page — it only redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await ensureUserProfile(supabase, user);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] code exchange failed:", error.message);
  }

  // Missing code or a failed exchange — back to login with a hint.
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
