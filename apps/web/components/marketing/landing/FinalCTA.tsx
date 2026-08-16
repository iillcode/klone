import { ArrowRight } from "lucide-react";
import { GridLines, LandingContainer } from "./Section";

/** Large clean centered final call-to-action. */
export function FinalCTA() {
  return (
    <section aria-label="Get started with Klone" className="relative bg-white">
      <GridLines />
      <LandingContainer className="relative py-[110px] md:py-[150px]">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[#737373]">
            Get started
          </p>
          <h2 className="text-[46px] font-bold leading-[1.02] tracking-tight text-[#0a0a0a] md:text-[64px]">
            Explore Klone today
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/register"
              className="group flex items-center gap-2 bg-[#0a0a0a] px-7 py-4 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#262626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
            >
              Start building
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <a
              href="#how"
              className="group flex items-center gap-2 border border-[#e0e0e0] px-7 py-4 text-[15px] font-medium text-[#0a0a0a] transition-colors duration-200 hover:border-[#0a0a0a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
            >
              See how it works
            </a>
          </div>
          <p className="mt-8 text-[13px] text-[#8a8a8a]">
            Works with the AI assistant you already use · Templates included
          </p>
        </div>
      </LandingContainer>
    </section>
  );
}
