import { ArrowUpRight } from "lucide-react";
import {
  CheckPop,
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
import { GridLines, LandingContainer } from "./Section";

const SANS = "var(--font-geist-sans), sans-serif";

/** Guided generation: you ask → a template guides → a finished document. */
function GuidedIllustration() {
  return (
    <svg viewBox="0 0 300 160" role="img" aria-label="A template guiding the AI as it writes a finished document" className="h-auto w-full">
      {/* person asking */}
      <Person x={38} y={116} />
      <StepBadge cx={56} cy={102} n={1} />
      {/* prompt bubble */}
      <g>
        <rect x={20} y={30} width={92} height={40} fill="#ffffff" stroke="#d4d4d4" strokeWidth="1" />
        <rect x={20} y={30} width={92} height={4} fill="#aef637" />
        <text x={30} y={48} fontSize="8" fontWeight="600" fontFamily={SANS} fill="#404040">
          “A report about
        </text>
        <text x={30} y={59} fontSize="8" fontWeight="600" fontFamily={SANS} fill="#404040">
          sales in Q2”
        </text>
        <TypingDots x={44} y={90} gap={7} />
      </g>
      {/* template sketch */}
      <Float delay={0.3}>
        <g>
          <rect x={132} y={38} width={54} height={48} fill="#ffffff" stroke="#b0b0b0" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={140} y={46} width={20} height={3} fill="#aef637" />
          <rect x={140} y={56} width={38} height={9} fill="none" stroke="#c9c9c9" strokeWidth="1" />
          <rect x={140} y={70} width={38} height={4} fill="none" stroke="#c9c9c9" strokeWidth="1" />
        </g>
      </Float>
      <StepBadge cx={132} cy={38} n={2} tone="accent" />
      {/* finished page */}
      <DocPage x={236} y={38} width={44} height={58} accent="#aef637" lines={3} />
      <CheckPop cx={284} cy={38} r={6} />
      {/* flow */}
      <DottedPath d="M 114 50 C 122 50 126 52 130 55" animate />
      <DottedPath d="M 188 62 C 204 62 218 62 232 62" animate />
      <Packet path="M 114 50 C 122 50 126 52 130 55" dur="2.6s" r={2.5} />
      <Packet path="M 188 62 C 204 62 218 62 232 62" dur="3s" begin="1.2s" r={2.5} />
      <Chip x={26} y={130} width={150} text="Template keeps it on brand" />
    </svg>
  );
}

/** Canvas editing: click, restyle, and move anything yourself. */
function CanvasIllustration() {
  return (
    <svg viewBox="0 0 300 160" role="img" aria-label="Editing any line of the document directly on the canvas" className="h-auto w-full">
      <DocPage x={108} y={28} width={82} height={102} accent="#aef637" />
      {/* animated selection box that hops between lines */}
      <g>
        <g>
          <rect x={120} y={64} width={58} height={16} fill="none" stroke="#aef637" strokeWidth="1.5" />
          <rect x={118} y={62} width={4} height={4} fill="#aef637" />
          <rect x={178} y={62} width={4} height={4} fill="#aef637" />
          <rect x={118} y={78} width={4} height={4} fill="#aef637" />
          <rect x={178} y={78} width={4} height={4} fill="#aef637" />
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 18; 0 0" dur="4.5s" repeatCount="indefinite" />
        </g>
      </g>
      {/* cursor pointer riding the selection */}
      <g>
        <path d="M 184 70 l 11 4.5 l -4.5 2.5 l -2.5 4.5 Z" fill="#0a0a0a" />
        <animateMotion dur="4.5s" repeatCount="indefinite" path="m 0 0 h 14 m -14 18 h 14" />
      </g>
      {/* floating style toolbar */}
      <Float delay={0.4}>
        <g>
          <rect x={216} y={40} width={56} height={16} fill="#ffffff" stroke="#dcdcdc" strokeWidth="1" />
          <circle cx={228} cy={48} r={3.2} fill="#aef637" />
          <circle cx={238} cy={48} r={3.2} fill="#c7bff4" />
          <rect x={247} y={45.5} width={18} height={2.5} fill="#e2e2e2" />
          <rect x={247} y={50.5} width={12} height={2.5} fill="#e2e2e2" />
        </g>
      </Float>
      <Chip x={30} y={128} width={118} text="Click any line" dot="#c7bff4" />
      <Chip x={178} y={128} width={96} text="Restyle in place" />
    </svg>
  );
}

/** AI assistant: ask it to make a document, it lands in your library. */
function AssistantIllustration() {
  return (
    <svg viewBox="0 0 300 160" role="img" aria-label="An AI assistant creating a document that appears in your library" className="h-auto w-full">
      {/* chat bubble */}
      <Float delay={0.2}>
        <g>
          <rect x={22} y={42} width={88} height={40} fill="#ffffff" stroke="#d4d4d4" strokeWidth="1" />
          <text x={32} y={60} fontSize="8" fontWeight="600" fontFamily={SANS} fill="#404040">
            “Add an invoice
          </text>
          <text x={32} y={71} fontSize="8" fontWeight="600" fontFamily={SANS} fill="#404040">
            for June”
          </text>
          <TypingDots x={52} y={98} gap={7} />
        </g>
      </Float>
      {/* Klone doing its thing */}
      <g>
        <rect x={140} y={46} width={64} height={40} fill="#ffffff" stroke="#9a9a9a" strokeWidth="1" />
        <rect x={140} y={46} width={64} height={4} fill="#aef637" />
        <text x={172} y={66} textAnchor="middle" fontSize="8.5" fontWeight="700" fontFamily={SANS} fill="#0a0a0a">
          Klone writes it
        </text>
        <PulseDot cx={204} cy={46} r={3} delay={0.6} />
      </g>
      {/* result document fading in */}
      <DocPage x={238} y={44} width={44} height={58} accent="#aef637" lines={3} />
      <CheckPop cx={286} cy={44} r={6} />
      {/* flow */}
      <DottedPath d="M 112 62 C 122 62 128 62 138 64" animate />
      <DottedPath d="M 206 66 C 218 66 228 66 236 68" animate />
      <Packet path="M 112 62 C 122 62 128 62 138 64" dur="2.4s" r={2.5} />
      <Packet path="M 206 66 C 218 66 228 66 236 68" dur="2.8s" begin="1.1s" r={2.5} color="#c7bff4" />
      <Chip x={82} y={122} width={140} text="Any AI assistant works" />
    </svg>
  );
}

/** Privacy: your documents, locked to your account. */
function PrivateIllustration() {
  return (
    <svg viewBox="0 0 300 160" role="img" aria-label="Your document library private and locked to your account" className="h-auto w-full">
      {/* you */}
      <Person x={52} y={92} />
      <text x={52} y={122} textAnchor="middle" fontSize="8.5" fontWeight="600" fontFamily={SANS} fill="#525252">
        You
      </text>
      {/* lock gate */}
      <Float delay={0.3}>
        <Lock x={126} y={66} size={30} />
      </Float>
      <PulseDot cx={141} cy={60} r={3} delay={0.5} color="#c7bff4" />
      {/* your library */}
      <g>
        <rect x={204} y={48} width={58} height={70} fill="#fafafa" stroke="#e2e2e2" strokeWidth="1" />
        <DocPage x={212} y={56} width={42} height={54} accent="#aef637" lines={3} />
        <g>
          <rect x={254} y={58} width={6} height={52} fill="#eceafd" stroke="#dcd6f6" strokeWidth="1" />
          <rect x={262} y={64} width={5} height={46} fill="#e9f9d4" stroke="#d5eeb0" strokeWidth="1" />
        </g>
      </g>
      {/* single private path */}
      <DottedPath d="M 78 78 C 96 72 108 68 122 66" animate />
      <DottedPath d="M 160 70 C 176 70 188 72 202 76" animate />
      <Packet path="M 78 78 C 96 72 108 68 122 66" dur="2.6s" r={2.5} />
      <Packet path="M 160 70 C 176 70 188 72 202 76" dur="3s" begin="1.3s" r={2.5} color="#c7bff4" />
      <Chip x={46} y={132} width={132} text="Only you can open it" />
      <Chip x={192} y={128} width={92} text="Private library" dot="#e9f9d4" />
    </svg>
  );
}

const FEATURES = [
  {
    category: "Templates",
    title: "Templates that guide the AI",
    description:
      "Every document starts from a template — the layout, sections, and rules to follow. The AI writes each one fresh, so results are always structured and always on brand.",
    meta: "Layouts · brand rules",
    Illustration: GuidedIllustration,
  },
  {
    category: "Editing",
    title: "A real canvas, not a form",
    description:
      "Click any line, heading, or image and restyle its font, color, and spacing right there. The AI drafts it, then you tweak anything you like — no code required.",
    meta: "Click · restyle · move",
    Illustration: CanvasIllustration,
  },
  {
    category: "AI assistants",
    title: "Brings your AI assistant along",
    description:
      "Any AI assistant can create documents for you in Klone. Ask it in chat — the finished document appears in your library, ready to edit and export.",
    meta: "Chat · create · done",
    Illustration: AssistantIllustration,
  },
  {
    category: "Privacy",
    title: "Your documents, private",
    description:
      "Sign in and everything stays in your account. Only you can see, edit, and export your documents — by default, not as an add-on.",
    meta: "Your account · by default",
    Illustration: PrivateIllustration,
  },
];

/** Capability section introducing Klone's 2x2 editorial feature grid. */
export function FeatureGridSection() {
  return (
    <section id="editor" aria-label="Klone capabilities" className="relative bg-white">
      <GridLines />
      <LandingContainer className="relative py-[100px] md:py-[130px]">
        <div className="mx-auto max-w-[860px] text-center">
          <h2 className="text-[42px] font-bold leading-[1.02] tracking-tight text-[#0a0a0a] md:text-[60px]">
            Great documents take
            <br />
            more than a chat.
          </h2>
          <p className="mx-auto mt-6 max-w-[560px] text-[16px] leading-[1.65] text-[#525252]">
            Consistent results come from templates you control, an editor you
            can feel, and AI that keeps your documents private.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <article
              key={feature.title}
              className={
                "group flex flex-col border-[#e5e5e5] p-7 transition-colors duration-200 hover:bg-[#fafafa] md:p-10 " +
                (i % 2 === 0 ? "md:border-r " : "") +
                (i < FEATURES.length - 2 ? "border-b " : "")
              }
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#737373]">
                {feature.category}
              </p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <h3 className="text-[24px] font-bold leading-[1.15] tracking-tight text-[#0a0a0a]">
                  {feature.title}
                </h3>
                <span className="mt-1 flex w-40 shrink-0 items-center justify-end gap-1.5 text-right font-mono text-[11px] text-[#8a8a8a]">
                  {feature.meta}
                  <ArrowUpRight
                    size={12}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0a0a0a]"
                  />
                </span>
              </div>
              <p className="mt-4 max-w-[420px] text-[14px] leading-[1.65] text-[#525252]">
                {feature.description}
              </p>
              <div className="mt-auto pt-8">
                <feature.Illustration />
              </div>
            </article>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
