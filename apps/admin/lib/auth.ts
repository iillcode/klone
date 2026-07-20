import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export type SessionUser = { userId: string; email: string };

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
