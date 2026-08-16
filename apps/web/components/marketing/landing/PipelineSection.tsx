import { ArrowRight } from "lucide-react";
import {
  Chip,
  DocPage,
  DottedPath,
  Float,
  Lock,
  Packet,
  Person,
  PulseDot,
  StepBadge,
  TypingDots,
} from "./primitives";
import { LandingContainer } from "./Section";

const SANS = "var(--font-geist-sans), sans-serif";

const STEP_TABS = ["Ask", "Template", "Write", "Edit", "Export"];

/**
 * Friendly "question → finished PDF" diagram. Your AI assistant asks Klone,
 * Klone picks a template, writes the document into your private library,
 * you polish it in the editor, and download it as a PDF. Packets travel
 * each step and numbered badges narrate the flow.
 */
export function PipelineDiagram() {
  return (
    <svg
      viewBox="0 0 1120 420"
      role="img"
      aria-label="How Klone turns a question into a finished PDF: ask your AI assistant, Klone picks a template, writes the document into your private library, you edit it in the editor, then download it as a PDF"
      className="h-auto w-full"
    >
      {/* light gray grid */}
      <g stroke="#202020" strokeWidth="1">
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={`v${i}`} x1={40 + i * 74} y1={20} x2={40 + i * 74} y2={400} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1={20} y1={40 + i * 68} x2={1100} y2={40 + i * 68} />
        ))}
      </g>

      {/* faint concentric rings around the Klone core */}
      <g fill="none" stroke="#2a2a2c" strokeWidth="1">
        <circle cx={500} cy={230} r={150} strokeDasharray="2 6" />
        <circle cx={500} cy={230} r={210} />
      </g>

      {/* flow paths */}
      <DottedPath d="M 214 124 C 300 130 370 170 414 202" animate />
      <DottedPath d="M 500 178 C 505 160 515 138 528 122" animate />
      <DottedPath d="M 500 282 C 495 290 490 296 484 302" animate />
      <DottedPath d="M 580 228 C 650 232 720 228 780 224" animate />
      <DottedPath d="M 948 168 C 970 160 994 152 1006 146" animate />

      {/* travelling packets, staggered through the steps */}
      <Packet path="M 214 124 C 300 130 370 170 414 202" dur="4.5s" />
      <Packet path="M 500 178 C 505 160 515 138 528 122" dur="3s" begin="0.8s" />
      <Packet path="M 500 282 C 495 290 490 296 484 302" dur="3s" begin="1.6s" color="#c7bff4" />
      <Packet path="M 580 228 C 650 232 720 228 780 224" dur="3.8s" begin="2.4s" />
      <Packet path="M 948 168 C 970 160 994 152 1006 146" dur="3.2s" begin="3.2s" color="#c7bff4" />

      {/* ── Step 1 · Ask your AI assistant ── */}
      <Person x={100} y={322} />
      <Float delay={0.2}>
        <g>
          <rect x={64} y={96} width={150} height={56} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
          <rect x={64} y={96} width={150} height={5} fill="#aef637" />
          <text x={76} y={122} fontSize="11" fontWeight="600" fontFamily={SANS} fill="#d4d4d4">
            “Write me a quarterly
          </text>
          <text x={76} y={137} fontSize="11" fontWeight="600" fontFamily={SANS} fill="#d4d4d4">
            business report.”
          </text>
          <TypingDots x={84} y={147} />
        </g>
      </Float>
      <StepBadge cx={64} cy={96} n={1} />
      <text x={100} y={370} textAnchor="middle" fontSize="11" fontWeight="600" fontFamily={SANS} fill="#a1a1a6">
        Your AI assistant
      </text>

      {/* ── Step 2 · Pick a template ── */}
      <Float delay={0.5}>
        <g>
          <rect x={446} y={56} width={172} height={64} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
          {/* mini layout sketch */}
          <rect x={460} y={68} width={40} height={40} fill="#232324" stroke="#3f3f42" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={467} y={75} width={14} height={3} fill="#aef637" />
          <rect x={467} y={83} width={26} height={7} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="2 2" />
          <rect x={467} y={94} width={26} height={7} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="2 2" />
          <text x={510} y={82} fontSize="11" fontWeight="600" fontFamily={SANS} fill="#d4d4d4">
            Pick a template
          </text>
          <text x={510} y={98} fontSize="9" fontFamily={SANS} fill="#8a8a8a">
            Designs you control
          </text>
        </g>
      </Float>
      <StepBadge cx={446} cy={56} n={2} tone="accent" />

      {/* ── Klone core ── */}
      <g>
        <rect x={420} y={182} width={160} height={96} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
        <rect x={420} y={182} width={160} height={5} fill="#aef637" />
        <text x={500} y={228} textAnchor="middle" fontSize="16" fontWeight="700" fontFamily={SANS} fill="#ededed">
          Klone
        </text>
        <text x={500} y={248} textAnchor="middle" fontSize="9.5" fontFamily={SANS} fill="#8a8a8a">
          your document studio
        </text>
      </g>
      <PulseDot cx={420} cy={182} delay={0.3} />

      {/* ── Step 3 · Your documents, safe & private ── */}
      <Float alt delay={0.7}>
        <g>
          <rect x={432} y={312} width={58} height={74} fill="#2c2842" stroke="#4c4668" strokeWidth="1" />
          <DocPage x={444} y={302} width={62} height={82} accent="#aef637" />
        </g>
      </Float>
      <StepBadge cx={432} cy={306} n={3} />
      <Lock x={524} y={330} size={26} />
      <text x={537} y={372} textAnchor="middle" fontSize="10.5" fontWeight="600" fontFamily={SANS} fill="#a1a1a6">
        Your documents
      </text>
      <text x={537} y={386} textAnchor="middle" fontSize="9" fontFamily={SANS} fill="#8a8a8a">
        Safe &amp; private
      </text>

      {/* ── Step 4 · Your editor ── */}
      <g>
        <rect x={780} y={168} width={170} height={112} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
        <rect x={780} y={168} width={170} height={5} fill="#aef637" />
        {/* mini canvas with animated selection */}
        <rect x={796} y={188} width={76} height={72} fill="#232324" stroke="#333336" strokeWidth="1" />
        <rect x={806} y={198} width={48} height={6} fill="#aef637" />
        <rect x={806} y={212} width={56} height={3} fill="#3d3d40" />
        <rect x={806} y={220} width={48} height={3} fill="#3d3d40" />
        <rect x={806} y={228} width={52} height={3} fill="#3d3d40" />
        <g>
          <rect x={806} y={240} width={30} height={10} fill="none" stroke="#aef637" strokeWidth="1.2" />
          <animate attributeName="opacity" values="1;0.5;1" dur="2.4s" repeatCount="indefinite" />
        </g>
        {/* side panel */}
        <rect x={884} y={188} width={52} height={72} fill="#232324" stroke="#333336" strokeWidth="1" />
        <circle cx={894} cy={199} r={3} fill="#aef637" />
        <circle cx={904} cy={199} r={3} fill="#c7bff4" />
        <rect x={890} y={210} width={38} height={3} fill="#3d3d40" />
        <rect x={890} y={218} width={30} height={3} fill="#3d3d40" />
        <rect x={890} y={226} width={34} height={3} fill="#3d3d40" />
      </g>
      <StepBadge cx={780} cy={168} n={4} tone="accent" />
      <text x={865} y={158} textAnchor="middle" fontSize="11" fontWeight="600" fontFamily={SANS} fill="#a1a1a6">
        Your editor
      </text>
      <PulseDot cx={950} cy={168} r={3.5} delay={1.4} />

      {/* ── Download as PDF ── */}
      <g>
        <rect x={1006} y={96} width={60} height={42} fill="#aef637" />
        <text x={1036} y={122} textAnchor="middle" fontSize="14" fontWeight="700" fontFamily="var(--font-geist-mono), ui-monospace, monospace" fill="#0a0a0a">
          PDF
        </text>
      </g>
      <g>
        <path d="M 1036 148 v 12 m 0 0 l -6 -7 m 6 7 l 6 -7" stroke="#aef637" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 -3; 0 5; 0 -3"
          dur="2.2s"
          repeatCount="indefinite"
        />
      </g>
      <text x={1036} y={184} textAnchor="middle" fontSize="10" fontWeight="600" fontFamily={SANS} fill="#a1a1a6">
        Download it
      </text>

      {/* friendly chip */}
      <Chip x={64} y={48} width={148} text="Starts with a question" />

      {/* small dot matrix decoration */}
      <g fill="#3a3a3d">
        {Array.from({ length: 3 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <circle key={`d${r}${c}`} cx={640 + c * 9} cy={352 + r * 9} r={1.6} />
          )),
        )}
      </g>
    </svg>
  );
}

/** From a question to a finished PDF: the Klone journey overview. */
export function PipelineSection() {
  return (
    <section id="how" aria-label="How Klone works" className="bg-[#161617]">
      <LandingContainer className="py-[64px] md:py-[88px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[42px] font-bold leading-[1.02] tracking-tight text-[#ededed] md:text-[56px]">
            From a question
            <br />
            to a finished PDF
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Steps">
            {STEP_TABS.map((tab, i) => (
              <li key={tab}>
                <span
                  className={
                    "text-[13px] font-medium " +
                    (i === 0
                      ? "text-[#ededed]"
                      : "cursor-pointer text-[#8a8a8a] transition-colors duration-150 hover:text-[#ededed]")
                  }
                >
                  {tab}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 border border-[#2a2a2c] bg-[#1a1a1b] p-4 md:p-6">
          <PipelineDiagram />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-y-8 border-t border-[#2a2a2c] pt-10 md:grid-cols-2 md:gap-x-16">
          <div className="max-w-[460px]">
            <h3 className="text-[22px] font-bold tracking-tight text-[#ededed]">
              Works with the AI you use
            </h3>
            <p className="mt-3 text-[14px] leading-[1.65] text-[#a1a1a6]">
              Connect any AI assistant. It asks Klone for the right template,
              writes the document for you, and drops it straight into your
              private library — ready to read, edit, and export.
            </p>
            <a
              href="/register"
              className="group mt-5 inline-flex items-center gap-2 text-[14px] font-medium text-[#ededed] hover:text-[#a1a1a6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
            >
              Connect your AI assistant
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </div>
          <div className="max-w-[460px]">
            <h3 className="text-[22px] font-bold tracking-tight text-[#ededed]">
              Designed by you, tweaked by hand
            </h3>
            <p className="mt-3 text-[14px] leading-[1.65] text-[#a1a1a6]">
              Create the templates yourself, and fine-tune every generated
              document on a real canvas — fonts, colors, and layout included.
              The style stays yours; the AI does the writing.
            </p>
            <a
              href="#templates"
              className="group mt-5 inline-flex items-center gap-2 text-[14px] font-medium text-[#ededed] hover:text-[#a1a1a6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
            >
              Explore templates
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
