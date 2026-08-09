"use server";

import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/auth";

export type AuthState = { error: string } | undefined;
export type RegisterResult = { error?: string; success?: boolean };
export type GoogleAuthResult = { url: string } | { error: string };
export type ResetPasswordResult = { ok: boolean; error?: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Make sure a profile row exists (e.g. pre-dating this feature).
  if (data.user) {
    await ensureUserProfile(supabase, data.user);
  }

  redirect("/");
}

export async function register(
  _prev: RegisterResult | undefined,
  formData: FormData,
): Promise<RegisterResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // Strong password: min 8 chars, uppercase, lowercase, number and symbol.
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
    return {
      error:
        "Use at least 8 characters with uppercase, lowercase, number and symbol.",
    };
  }

  // Only enforce a confirm-password check when the form actually provides one
  // (the new design has no confirm field, so it's sent as the same value).
  if (confirmPassword && password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase returns no user (and no error) when the email is already taken.
  if (!data.user) {
    return {
      error:
        "An account with this email already exists. Try signing in instead.",
    };
  }

  // Make sure a profile row exists for the new user.
  await ensureUserProfile(supabase, data.user);

  // Email confirmation disabled → signUp already returns a session.
  if (data.session) {
    redirect("/");
  }

  // Email confirmation enabled → sign the user in right away so they land
  // directly on the dashboard (no success screen / no manual re-login).
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.data.session) {
    const user = signIn.data.user;
    if (user) {
      await ensureUserProfile(supabase, user);
    }
    redirect("/");
  }

  // Couldn't establish a session (e.g. email still pending confirmation) —
  // surface the reason instead of the demo success screen.
  return {
    error: signIn.error?.message ?? "Could not sign you in. Please try again.",
  };
}

/**
 * Start Google OAuth. Returns the provider URL for the client to navigate
 * to; the user lands back on /auth/callback (PKCE) and then /.
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${SITE_URL}/auth/callback?next=/`,
    },
  });

  if (error || !data.url) {
    return {
      error: error?.message ?? "Could not start Google sign-in. Try again.",
    };
  }

  return { url: data.url };
}

/**
 * Send a password-reset email. No redirectTo is passed, so Supabase uses
 * its hosted recovery flow (set a new password, then sign in normally).
 */
export async function resetPassword(
  email: string,
): Promise<ResetPasswordResult> {
  const normalized = email.trim();
  if (!normalized) {
    return { ok: false, error: "Enter your email address." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(normalized);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function logout(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
