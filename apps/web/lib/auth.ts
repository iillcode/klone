import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  userId: string;
  email: string;
};

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
