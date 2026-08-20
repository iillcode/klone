import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

/** A row from `public.users` — the current user's profile. */
export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  website: string | null;
  bio: string | null;
  plan: string;
  credits_balance: number;
  dodo_customer_id: string | null;
  subscription_status: string | null;
  created_at: string;
}

const PROFILE_FIELDS =
  "id, email, full_name, avatar_url, username, website, bio, plan, credits_balance, dodo_customer_id, subscription_status, created_at";

/** Fetch the current user's profile row, or null when signed out/missing. */
export async function getProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_FIELDS)
    .eq("id", session.userId)
    .maybeSingle();

  if (error) {
    console.error("[users] getProfile:", error.message);
    return null;
  }

  return (data as UserProfile | null) ?? null;
}
