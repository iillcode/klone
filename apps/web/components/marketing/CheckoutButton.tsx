"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { pressClasses } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/**
 * Resolve the current signed-in user's email client-side so the checkout
 * session is created under the logged-in account. This guarantees the Dodo
 * webhook (which matches by email) attributes the payment to the right user.
 */
async function getSessionEmail(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}

interface CheckoutButtonProps {
  productId?: string;
  email?: string;
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
  variant?: "primary" | "dark" | "danger" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
}

/**
 * Client CTA that calls our server /api/checkout route to create a Dodo
 * Payments hosted checkout session, then redirects the browser to the
 * returned checkout_url (Dodo's own page). While the request is in flight the
 * button is disabled and shows a spinner to prevent double-submits.
 */
export function CheckoutButton({
  productId,
  email,
  quantity = 1,
  className,
  children,
  variant = "primary",
  size = "lg",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const router = useRouter();

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      // Prefer the explicit prop; otherwise fall back to the live session
      // email so the payment is always attributed to the logged-in user.
      const sessionEmail = email ?? (await getSessionEmail());
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(productId ? { productId } : {}),
          ...(sessionEmail ? { email: sessionEmail } : {}),
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkout_url) {
        // Active subscribers shouldn't start a new subscription — show a
        // dialog pointing them to the dashboard instead of an error.
        if (data?.code === "already_subscribed") {
          setAlreadySubscribed(true);
          setLoading(false);
          return;
        }
        // Anonymous visitors must sign in before they can check out.
        if (data?.code === "auth_required") {
          router.push("/login?redirect=/pricing");
          return;
        }
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={cn(pressClasses(variant, size), "group", className)}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <ArrowRight
            size={15}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        )}
        {children ?? (loading ? "Redirecting…" : "Proceed to Checkout")}
      </button>
      {error && (
        <p className="text-center text-[12px] text-red-400" role="alert">
          {error}
        </p>
      )}

      {alreadySubscribed && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-[380px] max-w-[calc(100vw-48px)] overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#161617] shadow-2xl">
            <div className="px-6 pt-6">
              <h2 className="text-[16px] font-bold text-[#f5f5f5]">
                You already have a subscription
              </h2>
              <p className="mt-2 text-[13px] text-[#a3a3a3]">
                You&rsquo;re currently on Klone Pro. You can manage or cancel
                it anytime from Settings → Payments.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2.5 border-t border-[#1f1f1f] bg-[#181818] px-6 py-[13px]">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className={cn(pressClasses("primary", "sm"))}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
