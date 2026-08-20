import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Opens a Dodo Payments customer-portal SESSION for the logged-in user.
 *
 * Unlike the static email-based login link, a session drops the user straight
 * into their portal (manage subscription, payment methods, invoices) without
 * re-entering their email — but it requires Dodo's customer id, which the
 * dodo-webhook Edge Function stores on public.users.dodo_customer_id.
 *
 * Auth: the user must be signed in (RLS via Supabase). We read the customer id
 * from their own profile row — never trust a client-supplied id.
 */

export const runtime = "nodejs";

function getClient() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY is not configured");
  }
  const environment =
    process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
      ? "live_mode"
      : "test_mode";
  return new DodoPayments({ bearerToken: apiKey, environment });
}

export async function POST() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("dodo_customer_id, plan")
      .eq("id", user.id)
      .maybeSingle();

    const customerId = profile?.dodo_customer_id ?? null;
    if (!customerId) {
      // No Dodo customer recorded yet (e.g. webhook hasn't captured one, or
      // the user never paid). The client falls back to the static login URL.
      return NextResponse.json(
        { error: "no_customer", message: "No Dodo customer linked." },
        { status: 404 },
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";

    const session = await getClient().customers.customerPortal.create(
      customerId,
      { return_url: `${siteUrl}/dashboard` },
    );

    if (!session?.link) {
      return NextResponse.json(
        { error: "Failed to create portal session." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.link });
  } catch (err) {
    console.error("[billing-portal] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
