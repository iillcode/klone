import { ArrowRight } from "lucide-react";
import { HeroIllustration } from "./HeroIllustration";
import { GridLines, LandingContainer } from "./Section";

/**
 * Tall two-column hero. Left ~55% with eyebrow, oversized headline and CTAs;
 * right ~45% with the animated Klone pipeline illustration.
 */
export function HeroSection() {
  return (
    <section
      id="platform"
      aria-label="Klone platform introduction"
      className="relative overflow-hidden bg-[#161617]"
    >
      <GridLines />
      <LandingContainer className="relative pt-[56px] pb-[72px] md:pt-[80px] md:pb-[96px]">
        <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-12 lg:gap-x-12">
          {/* Left column */}
          <div className="lg:col-span-5 xl:col-span-5">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8a8a]">
              AI Document Generation Platform
            </p>
            <h1 className="text-[52px] font-bold leading-[0.98] tracking-tight text-[#ededed] md:text-[72px] xl:text-[84px]">
              Documents are
              <br />
              everything.
            </h1>
            <p className="mt-7 max-w-[430px] text-[17px] leading-[1.6] text-[#a1a1a6]">
              Turn a simple question into a finished document. Your AI
              assistant writes it; you preview, edit, and download it as a
              print-ready PDF.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="/register"
                className="group flex items-center gap-2 bg-[#aef637] px-6 py-3.5 text-[15px] font-medium text-[#0a0a0a] transition-colors duration-200 hover:bg-[#9be22e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
              >
                Get started
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </a>
              <a
                href="#templates"
                className="group flex items-center gap-2 px-2 py-2 text-[15px] font-medium text-[#ededed] transition-colors duration-200 hover:text-[#a1a1a6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
              >
                Browse templates
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>

            {/* tiny stats metadata */}
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#2a2a2c] pt-6">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-[20px] font-bold tracking-tight text-[#ededed]">
                    {stat.value}
                  </span>
                  <span className="text-[12px] text-[#8a8a8a]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — illustration, vertically centered */}
          <div className="flex justify-center lg:col-span-7 lg:items-center">
            <div className="w-full max-w-[640px] min-w-0">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}

const HERO_STATS = [
  { value: "20+", label: "ready-made templates" },
  { value: "A4", label: "print-ready pages" },
  { value: "1 click", label: "to download your PDF" },
];
