import Link from "next/link";
import { Check } from "lucide-react";
import { LandingNavbar } from "@/components/marketing/landing/LandingNavbar";
import { LandingFooter } from "@/components/marketing/landing/LandingFooter";
import { LandingContainer } from "@/components/marketing/landing/Section";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Post-checkout landing. Dodo Payments redirects here (return_url) after a
 * successful payment. Entitlement is granted asynchronously via the webhook,
 * so this page just reassures the user and points them to the app.
 */
export default function CheckoutSuccessPage() {
  return (
    <>
      <LandingNavbar />
      <main className="bg-[#161617]">
        <LandingContainer className="flex min-h-[70vh] flex-col items-center justify-center py-[72px] text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#aef637]">
            <Check size={32} strokeWidth={3} className="text-[#0a0a0a]" />
          </span>
          <h1 className="mt-6 text-[40px] font-bold leading-[1.02] tracking-tight text-[#ededed] md:text-[52px]">
            You&apos;re all set.
          </h1>
          <p className="mx-auto mt-4 max-w-[460px] text-[16px] leading-[1.65] text-[#a1a1a6]">
            Thanks for subscribing to Klone Pro. Your plan is being activated and
            your full feature set will be available in your account within a few
            moments.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/dashboard" size="lg">
              Go to your dashboard
            </ButtonLink>
            <ButtonLink
              href="/pricing"
              variant="dark"
              size="lg"
              className="px-7 py-[14.5px]"
            >
              Back to pricing
            </ButtonLink>
          </div>
          <p className="mt-6 text-[13px] text-[#8a8a8a]">
            Need a hand?{" "}
            <Link href="/support" className="text-[#ededed] underline">
              Contact support
            </Link>
            .
          </p>
        </LandingContainer>
      </main>
      <LandingFooter />
    </>
  );
}
