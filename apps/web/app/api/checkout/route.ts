import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Checkout session route.
 *
 * Expects a JSON body:
 *   {
 *     "productId": "pdt_xxx",   // Dodo Payments product id (optional; falls back to env)
 *     "quantity": 1,            // optional, defaults to 1
 *     "email": "x@y.z"          // optional; ignored unless it matches the session user
 *   }
 *
 * Creates a hosted checkout session via the Dodo Payments API and returns the
 * `checkout_url`. Dodo then serves its OWN dedicated checkout page at that URL
 * (email, card, billing address, tax, etc.) — we never touch card data.
 * The API key stays server-side and is never exposed to the browser.
 *
 * The customer email is taken from the AUTHENTICATED session (source of
 * truth) so the Dodo webhook — which matches payments by email — always
 * attributes the purchase to the logged-in account. A client-supplied email
 * is only used as a fallback for anonymous visitors (who can't be entitled
 * anyway). The webhook still resolves the user defensively by email.
 *
 * NOTE: entitlement/plan updates happen in a Supabase Edge Function
 * (apps/admin/supabase/functions/dodo-webhook), NOT here, so this app never
 * holds a service-role key.
 */

export const runtime = "nodejs";

// The Dodo Payments product id lives in env so it's easy to swap per environment.
const PRODUCT_ID = process.env.DODO_PAYMENTS_PRODUCT_ID;

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

export async function POST(req: NextRequest) {
  try {
    if (!PRODUCT_ID) {
      return NextResponse.json(
        { error: "Checkout is not configured (missing product)." },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const productId: string = body.productId ?? PRODUCT_ID;
    const quantity: number =
      typeof body.quantity === "number" && body.quantity > 0
        ? body.quantity
        : 1;

    // Resolve the authenticated user. Checkout REQUIRES a signed-in account —
    // we never start a subscription for an anonymous visitor (the webhook
    // attributes payment to the logged-in user by email, so a guest checkout
    // would create an orphaned entitlement). The client redirects to /login
    // when this returns auth_required.
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to continue.", code: "auth_required" },
        { status: 401 },
      );
    }
    const sessionEmail = user?.email ?? null;
    const customerEmail = sessionEmail ?? (body.email as string | undefined) ?? null;

    // Prevent starting a NEW subscription while one is already active. We
    // trust the server-side entitlement state (subscription_status / plan),
    // not anything the client sends. `active` = currently paying; a
    // `cancelled`/`expired` status means they're free again and may resubscribe.
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("plan, subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      const hasActiveSub =
        profile?.subscription_status === "active" ||
        profile?.subscription_status === "on_hold" ||
        profile?.subscription_status === "paused" ||
        profile?.plan === "pro";
      if (hasActiveSub) {
        return NextResponse.json(
          {
            error:
              "You already have an active Klone Pro subscription. Manage or cancel it from Settings → Payments.",
            code: "already_subscribed",
          },
          { status: 409 },
        );
      }
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";
    const returnUrl = `${siteUrl}/pricing/success`;
    const cancelUrl = `${siteUrl}/pricing`;

    const client = getClient();

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity }],
      return_url: returnUrl,
      cancel_url: cancelUrl,
      ...(customerEmail ? { customer: { email: customerEmail } } : {}),
    });

    if (!session.checkout_url) {
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 },
      );
    }

    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (err) {
    console.error("[checkout] error creating session:", err);
    const message =
      err instanceof Error ? err.message : "Unknown checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
