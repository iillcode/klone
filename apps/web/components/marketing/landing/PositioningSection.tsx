import { GridLines, LandingContainer } from "./Section";

/** Large centered positioning statement for Klone. */
export function PositioningSection() {
  return (
    <section aria-label="Klone positioning" className="relative bg-[#161617]">
      <GridLines />
      <LandingContainer className="relative py-[64px] md:py-[88px]">
        <div className="mx-auto max-w-[780px] text-center">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8a8a]">
            Platform
          </p>
          <h2 className="text-[44px] font-bold leading-[1.02] tracking-tight text-[#ededed] md:text-[64px]">
            The easiest way to
            <br className="hidden md:block" />{" "}
            <span className="mt-1 block leading-[1.05]">
              make documents with AI
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-[560px] text-[16px] leading-[1.65] text-[#a1a1a6]">
            Ask your AI assistant for any document and it appears in your
            editor — ready to read, tweak, and download as a pixel-perfect
            PDF. No forms, no copy-paste, no lost formatting.
          </p>
        </div>
      </LandingContainer>
    </section>
  );
}
