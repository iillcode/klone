import { CheckPop, Chip, DottedPath, Float, Packet, StepBadge, TypingDots } from "./primitives";

const SANS = "var(--font-geist-sans), sans-serif";

/**
 * Hero story diagram — four human-friendly steps arranged around the Klone
 * core, with packets flowing clockwise through each step:
 * 1. Describe your document → 2. Pick a template → 3. AI writes it →
 * 4. Download the PDF.
 */
export function HeroIllustration() {
  return (
    <svg
      viewBox="0 -26 560 510"
      role="img"
      aria-label="How Klone works: describe your document, pick a template, the AI writes it, then download it as a PDF"
      className="h-auto w-full"
    >
      {/* Background grid — only horizontal guides are drawn inside the
          diagram. The verticals come from the hero section's GridLines,
          which sit directly behind this SVG and run continuously through
          it, so they stay exactly aligned with the header logo, headline,
          and CTAs at every viewport width. */}
      <g stroke="#242424" strokeWidth="1">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={40 + i * 64} x2={560} y2={40 + i * 64} />
        ))}
      </g>

      {/* node-graph frames: dashed workspace canvas, solid flow region,
          dashed hub selection box around the core (React Flow feel) */}
      <g fill="none" stroke="#2a2a2c" strokeWidth="1">
        <rect x={44} y={60} width={478} height={424} strokeDasharray="2 6" />
        <rect x={88} y={88} width={370} height={336} />
        <rect x={204} y={194} width={144} height={118} strokeDasharray="2 6" />
      </g>

      {/* flow: 1 → 2 → 3 → 4 — square orthogonal wiring (thicker + brighter so the
          flow reads clearly) */}
      <DottedPath d="M 161 104 V 90 H 356 V 112" animate stroke="#71717a" strokeWidth={1.5} />
      <DottedPath d="M 450 156 H 512 V 250 H 391 V 306" animate stroke="#71717a" strokeWidth={1.5} />
      <DottedPath d="M 434 340 H 466 V 452 H 192 V 384" animate stroke="#71717a" strokeWidth={1.5} />
      <DottedPath d="M 124 360 H 112 V 172 H 130 V 156" stroke="#8b80bf" animate strokeWidth={1.5} />

      {/* square elbow joints on the wiring */}
      <g fill="#2f2f31" stroke="#5a5a5e" strokeWidth="1">
        <rect x={157.5} y={86.5} width={7} height={7} />
        <rect x={352.5} y={86.5} width={7} height={7} />
        <rect x={508.5} y={152.5} width={7} height={7} />
        <rect x={508.5} y={246.5} width={7} height={7} />
        <rect x={387.5} y={246.5} width={7} height={7} />
        <rect x={462.5} y={336.5} width={7} height={7} />
        <rect x={462.5} y={448.5} width={7} height={7} />
        <rect x={188.5} y={448.5} width={7} height={7} />
        <rect x={108.5} y={356.5} width={7} height={7} />
        <rect x={108.5} y={168.5} width={7} height={7} />
        <rect x={126.5} y={168.5} width={7} height={7} />
      </g>

      {/* node port handles where wires meet cards */}
      <g fill="#1c1c1d" stroke="#71717a" strokeWidth="1">
        <rect x={158} y={101} width={6} height={6} />
        <rect x={447} y={153} width={6} height={6} />
        <rect x={388} y={303} width={6} height={6} />
        <rect x={431} y={337} width={6} height={6} />
        <rect x={189} y={381} width={6} height={6} />
        <rect x={121} y={357} width={6} height={6} />
        <rect x={127} y={153} width={6} height={6} />
      </g>

      {/* travelling packets, staggered through the steps */}
      <Packet path="M 161 104 V 90 H 356 V 112" dur="3s" r={4.5} />
      <Packet path="M 450 156 H 512 V 250 H 391 V 306" dur="3s" begin="0.75s" r={4.5} />
      <Packet path="M 434 340 H 466 V 452 H 192 V 384" dur="3s" begin="1.5s" r={4.5} />
      <Packet path="M 124 360 H 112 V 172 H 130 V 156" dur="3s" begin="2.25s" color="#c7bff4" r={4.5} />

      {/* ── Step 1 · Describe your document ── */}
      <Float delay={0.2}>
        {/* person */}
        <g>
          <circle cx={66} cy={120} r={11} fill="#1c1c1d" stroke="#5a5a5e" strokeWidth="1" />
          <path d="M 48 158 a 18 18 0 0 1 36 0 Z" fill="#1c1c1d" stroke="#5a5a5e" strokeWidth="1" />
        </g>
        {/* prompt card */}
        <g>
          <rect x={96} y={104} width={130} height={52} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
          <rect x={96} y={104} width={130} height={5} fill="#aef637" />
          <text x={108} y={128} fontSize="10" fontWeight="600" fontFamily={SANS} fill="#d4d4d4">
            “Write me a quarterly
          </text>
          <text x={108} y={142} fontSize="10" fontWeight="600" fontFamily={SANS} fill="#d4d4d4">
            business report.”
          </text>
          <TypingDots x={112} y={150} />
        </g>
      </Float>
      <StepBadge cx={96} cy={104} n={1} shape="square" />

      {/* ── Step 2 · Pick a template ── */}
      <Float alt delay={0.5}>
        {/* back sheet */}
        <rect x={364} y={96} width={78} height={72} fill="#1a1a1b" stroke="#333336" strokeWidth="1" />
        {/* front sheet: a layout sketch */}
        <g>
          <path d="M 356 112 h 82 l 12 12 v 76 h -94 Z" fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
          <path d="M 438 112 v 12 h 12" fill="#262628" stroke="#3f3f42" strokeWidth="1" />
          <rect x={368} y={126} width={34} height={5} fill="#aef637" />
          <rect x={368} y={139} width={70} height={18} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={368} y={163} width={33} height={18} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={405} y={163} width={33} height={18} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      </Float>
      <StepBadge cx={356} cy={112} n={2} tone="accent" shape="square" />

      {/* ── Step 3 · AI writes your document ── */}
      <Float delay={0.9}>
        <g>
          <path d="M 348 306 h 74 l 12 12 v 98 h -86 Z" fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
          <path d="M 422 306 v 12 h 12" fill="#262628" stroke="#3f3f42" strokeWidth="1" />
          <rect x={360} y={320} width={36} height={5} fill="#aef637" />
          {/* text lines being written: staggered fade-in loop */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={360} y={336 + i * 12} width={64 - (i % 2) * 16} height={3} fill="#3d3d40">
              <animate
                attributeName="opacity"
                values="0;0;1;1"
                keyTimes="0;0.1;0.3;1"
                dur="4s"
                begin={`${i * 0.35}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </g>
        {/* writing cursor */}
        <g>
          <path d="M 420 376 l 14 5 l -6 3 l -3 6 Z" fill="#aef637" />
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path="M 360 336 h 56 M 416 348 h -56 M 360 360 h 56 M 416 372 h -56"
          />
        </g>
      </Float>
      <StepBadge cx={348} cy={306} n={3} shape="square" />
      <CheckPop cx={446} cy={306} />

      {/* ── Step 4 · Download as PDF ── */}
      <Float alt delay={0.3}>
        <g>
          <rect x={124} y={336} width={74} height={48} fill="#aef637" />
          <text x={161} y={365} textAnchor="middle" fontSize="14" fontWeight="700" fontFamily="var(--font-geist-mono), ui-monospace, monospace" fill="#0a0a0a">
            PDF
          </text>
        </g>
        {/* download arrow bouncing into a tray */}
        <g stroke="#5a5a5e" strokeWidth="1" fill="#1c1c1d">
          <rect x={136} y={404} width={50} height={10} />
        </g>
        <g>
          <path d="M 161 388 v 12 m 0 0 l -6 -7 m 6 7 l 6 -7" stroke="#aef637" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 -3; 0 5; 0 -3"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </g>
      </Float>
      <StepBadge cx={124} cy={336} n={4} tone="accent" shape="square" />

      {/* ── Central Klone core ── */}
      <g>
        <rect x={232} y={222} width={96} height={62} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
        <rect x={232} y={222} width={96} height={5} fill="#aef637" />
        <text x={280} y={250} textAnchor="middle" fontSize="13" fontWeight="700" fontFamily={SANS} fill="#ededed">
          Klone
        </text>
        <text x={280} y={266} textAnchor="middle" fontSize="9" fontFamily={SANS} fill="#8a8a8a">
          your document studio
        </text>
      </g>
      {/* square source handle on the core's top edge (node-graph style) */}
      <rect x={275} y={217} width={10} height={10} fill="#161617" stroke="#aef637" strokeWidth="1.4" />

      {/* square connection stubs from each step toward the core */}
      <g stroke="#4b4b4f" strokeWidth="1" strokeDasharray="2 4">
        <path d="M 190 156 V 189 H 256 V 222" fill="none" />
        <path d="M 356 200 V 244 H 328" fill="none" />
        <path d="M 348 330 H 310 V 284" fill="none" />
        <path d="M 198 350 H 215 V 260 H 232" fill="none" />
      </g>

      {/* ports where the stubs dock on the core */}
      <g fill="#1c1c1d" stroke="#71717a" strokeWidth="1">
        <rect x={253} y={219} width={6} height={6} />
        <rect x={325} y={241} width={6} height={6} />
        <rect x={307} y={281} width={6} height={6} />
        <rect x={229} y={257} width={6} height={6} />
      </g>

      {/* small dot matrix decoration */}
      <g fill="#3d3d40">
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <circle key={`d${r}${c}`} cx={44 + c * 9} cy={452 + r * 9} r={1.6} />
          )),
        )}
      </g>

      {/* friendly chips */}
      <Chip x={30} y={30} width={126} text="Any AI assistant" />
      <Chip x={368} y={216} width={126} text="Designs that fit" dot="#c7bff4" />
      <Chip x={356} y={458} width={132} text="Editable every line" />
      <Chip x={62} y={484} width={156} text="Print-ready in one click" />
    </svg>
  );
}
