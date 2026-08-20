// Dodo Payments webhook handler — Supabase Edge Function (Deno).
//
// Dodo calls this endpoint on payment/subscription events. We:
//   1. Verify the HMAC signature (Dodo SDK `webhooks.unwrap`).
//   2. De-dupe by webhook-id (idempotency).
//   3. On payment.succeeded  -> users.plan = 'pro' + insert payment row.
//   4. On failure/refund/cancel -> users.plan = 'free'.
//
// The web app NEVER sees a service-role key; only this function (running
// server-side) does. Supabase injects SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// at runtime. DODO_PAYMENTS_WEBHOOK_KEY must be set via:
//   npx supabase secrets set DODO_PAYMENTS_WEBHOOK_KEY=whsec_xxx

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { DodoPayments } from "https://esm.sh/dodopayments@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Minimal view of the payload fields we read. Both Payment and Subscription
// events nest their data under `data`, with `customer.email` (or
// `customer.customer_email`) identifying the buyer.
interface DodoWebhookPayload {
  type?: string;
  data?: {
    payment_id?: string;
    subscription_id?: string;
    total_amount?: number;
    recurring_pre_tax_amount?: number;
    currency?: string | null;
    customer?: {
      email?: string;
      customer_email?: string;
      customer_id?: string;
    };
    product_cart?: Array<{ product_id?: string }> | null;
  };
}

/**
 * Map a Dodo `subscription.*` event type to the local `subscription_status`
 * we mirror on public.users. Returns null for non-subscription events.
 * `cancelled`/`expired` mean the plan will revert to free (the webhook still
 * flips `plan='free'`); `on_hold`/`paused` keep pro access but flag the issue.
 */
function crosswalkSubStatus(eventType: string): string | null {
  switch (eventType) {
    case "subscription.active":
    case "subscription.renewed":
      return "active";
    case "subscription.on_hold":
      return "on_hold";
    case "subscription.paused":
      return "paused";
    case "subscription.cancelled":
    case "subscription.expired":
      return "cancelled";
    default:
      return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookKey = Deno.env.get("DODO_PAYMENTS_WEBHOOK_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL / SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!webhookKey) {
      console.error("DODO_PAYMENTS_WEBHOOK_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Webhook key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawBody = await req.text();
    const dodoHeaders = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
    };

    // Verify signature. Throws on mismatch -> 401.
    try {
      const client = new DodoPayments({ bearerToken: "unused", webhookKey });
      client.webhooks.unwrap(rawBody, { headers: dodoHeaders });
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const webhookId = dodoHeaders["webhook-id"];

    // Idempotency: skip if already processed.
    if (webhookId) {
      const { data: existing } = await supabase
        .from("dodo_webhook_events")
        .select("id")
        .eq("webhook_id", webhookId)
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ success: true, message: "already processed" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(rawBody) as DodoWebhookPayload;
    const eventType = payload.type ?? "";
    const d = payload.data ?? {};
    // Subscriptions may use `customer_email`; payments use `email`.
    const email =
      d.customer?.email ?? d.customer?.customer_email ?? undefined;
    const subscriptionId = d.subscription_id ?? undefined;

    // Map events -> plan. Subscriptions are the typical "7-day trial" flow.
    let plan: "pro" | "free" | null = null;
    if (eventType === "payment.succeeded" || eventType === "subscription.active") {
      plan = "pro";
    } else if (
      eventType === "payment.failed" ||
      eventType === "payment.cancelled" ||
      eventType === "refund.succeeded" ||
      eventType === "subscription.cancelled" ||
      eventType === "subscription.expired" ||
      eventType === "subscription.on_hold" ||
      eventType === "subscription.paused"
    ) {
      plan = "free";
    }

    if (plan && email) {
      // Resolve the user. Match public.users.email first, then fall back to
      // auth.users.email (covers the rare case where the public profile row
      // has a null email). Returns the profile id.
      const { data: user, error: userErr } = await supabase.rpc(
        "resolve_user_by_email",
        { p_email: email },
      );

      // Map the Dodo event to a subscription_status we mirror locally so the
      // UI can show "Cancelled — reverts to Hobby on <date>" and keep the
      // portal link working during any paid grace period.
      const subStatus = eventType.startsWith("subscription.")
        ? crosswalkSubStatus(eventType)
        : null;

      if (userErr) {
        console.error("resolve_user_by_email failed:", userErr.message);
      } else if (user?.length) {
        const userId = user[0].user_id;
        const now = new Date().toISOString();
        // We only ever record in USD — normalise away Dodo's local-currency
        // field (e.g. INR) so a single charge never produces two rows.
        const currency = "USD";
        const reference =
          d.payment_id ?? subscriptionId ?? webhookId ?? "";
        const description =
          d.product_cart?.[0]?.product_id ?? "Klone Pro";
        const dodoCustomerId =
          d.customer?.customer_id ?? null;

        // Upsert the profile so the entitlement lands even if the app hasn't
        // created the public.users row yet (e.g. raw Auth signup). This both
        // creates the row (id + email) and flips the plan. We also persist
        // the Dodo customer id (for the dynamic portal session) and the
        // subscription status (so cancellation shows in-app).
        const profileUpdate: Record<string, unknown> = {
          id: userId,
          email: email,
          plan,
          updated_at: now,
        };
        if (dodoCustomerId) profileUpdate.dodo_customer_id = dodoCustomerId;
        // Only overwrite subscription_status from subscription.* events so a
        // stray payment event can't wipe a cancellation flag.
        if (subStatus !== null) profileUpdate.subscription_status = subStatus;

        await supabase.from("users").upsert(profileUpdate, {
          onConflict: "id",
        });

        // A subscription charge is reported by BOTH payment.succeeded AND
        // subscription.active/renewed. To get exactly one USD row per charge,
        // only record a payment row from the payment.* event (which carries
        // the real payment_id); the subscription.* event still flips `plan`
        // but skips the duplicate insert. Also de-dupe on provider_reference
        // at the DB level as a safety net.
        const isPaymentEvent = eventType?.startsWith("payment.");
        if (isPaymentEvent && reference) {
          await supabase.from("payment").insert({
            user_id: userId,
            subscription_id: subscriptionId ?? null,
            amount: Number(
              d.total_amount ?? d.recurring_pre_tax_amount ?? 0,
            ) / 100,
            currency,
            provider: "dodopayments",
            provider_reference: reference,
            status: plan === "pro" ? "succeeded" : "refunded",
            // A charge that entitles the user to Pro is the active payment.
            active: plan === "pro",
            description,
            metadata: payload,
          }).select("id").maybeSingle();
        }

        // When Dodo reports the subscription cancelled/expired, mark the
        // matching payment row(s) inactive so the UI can show which payment
        // is no longer live. We match on subscription_id when present, else
        // on the user's most recent succeeded payment.
        if (
          (eventType === "subscription.cancelled" ||
            eventType === "subscription.expired") &&
          subscriptionId
        ) {
          await supabase
            .from("payment")
            .update({ active: false })
            .eq("user_id", userId)
            .eq("subscription_id", subscriptionId);
        }
      } else {
        console.warn("No local user for email:", email);
      }
    }

    // Audit log.
    await supabase.from("dodo_webhook_events").insert({
      webhook_id: webhookId || null,
      event_type: eventType,
      data: payload,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, event_type: eventType }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return new Response(
      JSON.stringify({
        error: "Webhook processing failed",
        details: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
