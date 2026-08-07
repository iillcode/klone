"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

/**
 * Persist editable profile fields (full name, username, website, bio) for
 * the signed-in user. RLS restricts updates to the user's own row.
 */
export async function updateProfile(input: {
  full_name?: string | null;
  username?: string | null;
  website?: string | null;
  bio?: string | null;
}): Promise<UpdateProfileResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.full_name !== undefined) updates.full_name = input.full_name;
  if (input.username !== undefined) updates.username = input.username;
  if (input.website !== undefined) updates.website = input.website;
  if (input.bio !== undefined) updates.bio = input.bio;

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
