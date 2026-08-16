import { FinalCTA } from "@/components/marketing/landing/FinalCTA";
import { LandingFooter } from "@/components/marketing/landing/LandingFooter";
import { LandingNavbar } from "@/components/marketing/landing/LandingNavbar";
import {
  PricingFaq,
  PricingSection,
} from "@/components/marketing/landing/PricingSection";

/**
 * Klone pricing page — one plan only, so the layout uses a single wide
 * plan card instead of a tier comparison.
 */
export default function PricingPage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <PricingSection />
        <PricingFaq />
        <FinalCTA />
      </main>
      <LandingFooter />
    </>
  );
}
