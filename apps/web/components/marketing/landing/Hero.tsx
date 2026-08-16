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
      className="relative overflow-hidden bg-white"
    >
      <GridLines />
      <LandingContainer className="relative pt-[72px] pb-[96px] md:pt-[100px] md:pb-[120px]">
        <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-12 lg:gap-x-12">
          {/* Left column */}
          <div className="lg:col-span-6 xl:col-span-6">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[#737373]">
              AI Document Generation Platform
            </p>
            <h1 className="text-[52px] font-bold leading-[0.98] tracking-tight text-[#0a0a0a] md:text-[72px] xl:text-[84px]">
              Documents are
              <br />
              everything.
            </h1>
            <p className="mt-7 max-w-[430px] text-[17px] leading-[1.6] text-[#525252]">
              Turn a simple question into a finished document. Your AI
              assistant writes it; you preview, edit, and download it as a
              print-ready PDF.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="/register"
                className="group flex items-center gap-2 bg-[#0a0a0a] px-6 py-3.5 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-[#262626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
              >
                Get started
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </a>
              <a
                href="#templates"
                className="group flex items-center gap-2 px-2 py-2 text-[15px] font-medium text-[#0a0a0a] transition-colors duration-200 hover:text-[#404040] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
              >
                Browse templates
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>

            {/* tiny stats metadata */}
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#e5e5e5] pt-6">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-[20px] font-bold tracking-tight text-[#0a0a0a]">
                    {stat.value}
                  </span>
                  <span className="text-[12px] text-[#737373]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — illustration */}
          <div className="flex justify-center lg:col-span-6">
            <HeroIllustration />
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
