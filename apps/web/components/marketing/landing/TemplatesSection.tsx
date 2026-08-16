import { ArrowRight } from "lucide-react";
import { CheckPop, Chip, DocPage, DottedPath, Float, Packet, PulseDot, StepBadge } from "./primitives";
import { LandingContainer } from "./Section";

const SANS = "var(--font-geist-sans), sans-serif";

/**
 * "Design one template → every document on brand" — one template card fans
 * out into finished documents for different jobs, with staggered pop-in
 * checks and travelling packets.
 */
function BlueprintIllustration() {
  return (
    <svg
      viewBox="0 0 520 400"
      role="img"
      aria-label="One template producing many finished documents: a report, an invoice, and a resume"
      className="h-auto w-full max-w-[500px]"
    >
      <g stroke="#242424" strokeWidth="1">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`v${i}`} x1={40 + i * 64} y1={20} x2={40 + i * 64} y2={380} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1={20} y1={40 + i * 64} x2={500} y2={40 + i * 64} />
        ))}
      </g>

      {/* 1 · One template card (layout sketch) */}
      <Float>
        <g>
          <path
            d="M 220 58 h 82 l 12 12 v 84 h -94 Z"
            fill="#1c1c1d"
            stroke="#3f3f42"
            strokeWidth="1"
          />
          <path d="M 302 58 v 12 h 12" fill="#262628" stroke="#3f3f42" strokeWidth="1" />
          <rect x={232} y={72} width={34} height={4} fill="#aef637" />
          <rect x={232} y={86} width={70} height={16} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={232} y={108} width={32} height={16} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={270} y={108} width={32} height={16} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      </Float>
      <StepBadge cx={220} cy={58} n={1} />
      <PulseDot cx={267} cy={58} />

      {/* fan paths to the three documents */}
      <DottedPath d="M 250 152 C 196 190 148 220 114 244" animate />
      <DottedPath d="M 260 154 C 260 200 258 240 256 266" animate />
      <DottedPath d="M 270 152 C 328 190 378 220 408 244" stroke="#4c4668" animate />

      <Packet path="M 250 152 C 196 190 148 220 114 244" dur="3.4s" />
      <Packet path="M 260 154 C 260 200 258 240 256 266" dur="3.8s" begin="1.1s" />
      <Packet path="M 270 152 C 328 190 378 220 408 244" dur="4.2s" begin="2.2s" color="#c7bff4" />

      {/* 2 · the finished documents */}
      <Float alt delay={0.3}>
        <DocPage x={74} y={248} width={62} height={82} accent="#aef637" />
      </Float>
      <StepBadge cx={74} cy={248} n={2} tone="accent" />
      <DocPage x={226} y={268} width={62} height={82} accent="#aef637" />
      <Float alt delay={0.7}>
        <DocPage x={382} y={248} width={62} height={82} accent="#c7bff4" />
      </Float>

      {/* pop-in done checks */}
      <CheckPop cx={146} cy={248} r={7} />
      <CheckPop cx={356} cy={290} r={7} />

      {/* document titles */}
      <g fontFamily={SANS} fontSize="10.5" fontWeight="600" fill="#a1a1a6" textAnchor="middle">
        <text x={105} y={352}>
          Report
        </text>
        <text x={257} y={372}>
          Invoice
        </text>
        <text x={413} y={352}>
          Resume
        </text>
      </g>

      {/* steps + friendly chips */}
      <Chip x={188} y={198} width={118} text="Always on brand" />
      <Chip x={336} y={44} width={152} text="Design once, reuse forever" dot="#aef637" />
      <Chip x={40} y={16} width={190} text="One style, every page, every time" dot="#c7bff4" />
    </svg>
  );
}

const CARDS = [
  {
    title: "Print-ready PDF export",
    description:
      "One click turns your document into a clean, multi-page PDF — exact page breaks, pagination, and layout included.",
    meta: "A4 · multi-page · one click",
  },
  {
    title: "A guide, not boilerplate",
    description:
      "Templates are outlines — the layout, sections, and rules to follow. The AI writes each document fresh, never copy-pasting.",
    meta: "layout · sections · brand rules",
  },
  {
    title: "Your documents, private",
    description:
      "Every document the AI saves belongs to your account alone. Only you can see, edit, and export your library.",
    meta: "you only · edit · export",
  },
];

/** Feature block: "One template / a thousand finished documents". */
export function TemplatesSection() {
  return (
    <section id="templates" aria-label="Ready-made document templates" className="bg-[#1a1a1b]">
      <LandingContainer className="py-[64px] md:py-[88px]">
        <div className="max-w-[780px]">
          <h2 className="text-[40px] font-bold leading-[1.05] tracking-tight text-[#ededed] md:text-[56px]">
            One template
          </h2>
          <h2 className="mt-1 text-[40px] font-bold leading-[1.05] tracking-tight text-[#ededed] md:text-[56px]">
            <span className="inline-block bg-[#aef637] px-3 py-0.5 text-[#0a0a0a]">
              a thousand finished documents
            </span>
          </h2>
          <p className="mt-7 max-w-[540px] text-[16px] leading-[1.65] text-[#a1a1a6]">
            You define a single template — the layout, sections, and rules that
            matter. Every time, the AI produces a document that fits it
            perfectly.
          </p>
        </div>

        {/* split layout */}
        <div className="mt-14 grid grid-cols-1 items-center gap-y-10 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-5">
            <p className="text-[15px] leading-[1.7] text-[#c9c9cd]">
              Ask your AI assistant for any document — it fetches the right
              template, then writes a complete, self-contained page for you.
              No fragile forms to fill in; just structure the AI can follow and
              a result you can edit yourself.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Clear layouts with sections, fonts, and spacing rules",
                "Self-contained documents — no plugins, nothing to install",
                "Edit every word, font, and color directly in the editor",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-[#a1a1a6]">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 bg-[#aef637]" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#how"
              className="group mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-[#ededed] hover:text-[#a1a1a6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
            >
              See how it works
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </div>
          <div className="flex justify-center lg:col-span-7">
            <BlueprintIllustration />
          </div>
        </div>

        {/* three info cards */}
        <div className="mt-14 grid grid-cols-1 gap-px border border-[#2a2a2c] bg-[#2a2a2c] md:grid-cols-3">
          {CARDS.map((card) => (
            <article
              key={card.title}
              className="group bg-[#1c1c1d] p-7 transition-transform duration-200 hover:-translate-y-1 md:p-9"
            >
              <h3 className="text-[18px] font-bold tracking-tight text-[#ededed]">
                {card.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.6] text-[#a1a1a6]">
                {card.description}
              </p>
              <div className="mt-8 flex items-center justify-between border-t border-[#2a2a2c] pt-5">
                <span className="font-mono text-[11px] text-[#8a8a8a]">
                  {card.meta}
                </span>
                <ArrowRight
                  size={15}
                  className="text-[#8a8a8a] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#ededed]"
                />
              </div>
            </article>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
