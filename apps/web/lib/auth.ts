import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  userId: string;
  email: string;
};

/**
 * Idempotently ensure a public.users profile row exists for the signed-in
 * user, sourced from auth metadata (name/avatar set by email signup or
 * Google OAuth). Plan and credits keep their defaults. Safe to call on every
 * auth callback — RLS allows users to insert/update only their own row.
 */
export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  const metadata = user.user_metadata ?? {};
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? metadata.email ?? null,
      full_name: metadata.full_name ?? metadata.name ?? null,
      avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
    },
    { onConflict: "id" },
  );
  if (error) {
    // Non-fatal: a missing profile is logged, never blocks the session.
    console.warn("[auth] Could not ensure user profile:", error.message);
  }
}

/**
 * Verify the current session exists. If not, redirect to login.
 */
export async function verifySession(): Promise<SessionUser> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return {
    userId: user.id,
    email: user.email ?? "",
  };
}

/**
 * Get the current session without redirecting.
 * Returns null if no session exists.
 */
export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
  };
}
