import { FeatureGridSection } from "@/components/marketing/landing/FeatureGridSection";
import { FinalCTA } from "@/components/marketing/landing/FinalCTA";
import { HeroSection } from "@/components/marketing/landing/Hero";
import { LandingFooter } from "@/components/marketing/landing/LandingFooter";
import { LandingNavbar } from "@/components/marketing/landing/LandingNavbar";
import { PipelineSection } from "@/components/marketing/landing/PipelineSection";
import { PositioningSection } from "@/components/marketing/landing/PositioningSection";
import { TemplatesSection } from "@/components/marketing/landing/TemplatesSection";
import { Testimonials } from "@/components/marketing/landing/Testimonials";
import { UseCases } from "@/components/marketing/landing/UseCases";

/**
 * Klone — AI document generation platform landing page.
 */
export default function KloneLandingPage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <HeroSection />
        <PositioningSection />
        <TemplatesSection />
        <FeatureGridSection />
        <PipelineSection />
        <UseCases />
        <Testimonials />
        <FinalCTA />
      </main>
      <LandingFooter />
    </>
  );
}
