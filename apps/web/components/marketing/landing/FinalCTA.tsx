import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { GetStartedButton } from "@/components/marketing/GetStartedButton";
import { GridLines, LandingContainer } from "./Section";

/** Large clean centered final call-to-action. */
export function FinalCTA() {
  return (
    <section aria-label="Get started with Klone" className="relative bg-[#161617]">
      <GridLines />
      <LandingContainer className="relative py-[80px] md:py-[112px]">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8a8a]">
            Get started
          </p>
          <h2 className="text-[46px] font-bold leading-[1.02] tracking-tight text-[#ededed] md:text-[64px]">
            Explore Klone today
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <GetStartedButton size="lg" className="group">
              Start building
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </GetStartedButton>
            <ButtonLink href="#how" variant="dark" size="lg">
              See how it works
            </ButtonLink>
          </div>
          <p className="mt-8 text-[13px] text-[#737373]">
            Works with the AI assistant you already use · Templates included
          </p>
        </div>
      </LandingContainer>
    </section>
  );
}
