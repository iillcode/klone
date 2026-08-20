import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Returns the current user's payment history (RLS-scoped) plus their Dodo
 * customer id and local subscription status. The client uses `dodo_customer_id`
 * to open a dynamic portal session (no email re-entry) via /api/billing-portal;
 * when it's absent it falls back to the static email-based portal login.
 */

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: payments, error } = await supabase
      .from("payment")
      .select(
        "id, created_at, description, amount, currency, status, provider, provider_reference, subscription_id, active",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[payments] query error:", error.message);
      return NextResponse.json(
        { error: "Failed to load payments" },
        { status: 500 },
      );
    }

    // The live subscription payment (if any) — used to flag it in the UI.
    const activePaymentId =
      (payments ?? []).find((p) => p.active && p.subscription_id)?.id ?? null;

    const { data: profile } = await supabase
      .from("users")
      .select("dodo_customer_id, subscription_status, plan")
      .eq("id", user.id)
      .maybeSingle();

    const businessId = process.env.DODO_PAYMENTS_BUSINESS_ID;
    const isLive = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode";
    const portalLoginUrl = businessId
      ? `${isLive ? "https://customer.dodopayments.com/login" : "https://test.customer.dodopayments.com/login"}/${businessId}`
      : null;

    return NextResponse.json({
      payments: payments ?? [],
      activePaymentId,
      dodoCustomerId: profile?.dodo_customer_id ?? null,
      subscriptionStatus: profile?.subscription_status ?? null,
      plan: profile?.plan ?? "free",
      // Static fallback when we don't have a Dodo customer id yet.
      portalLoginUrl,
    });
  } catch (err) {
    console.error("[payments] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
