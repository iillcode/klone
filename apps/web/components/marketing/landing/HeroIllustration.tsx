import { CheckPop, Chip, DottedPath, Float, Packet, PulseDot, StepBadge, TypingDots } from "./primitives";

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
      viewBox="0 0 560 520"
      role="img"
      aria-label="How Klone works: describe your document, pick a template, the AI writes it, then download it as a PDF"
      className="h-auto w-full max-w-[540px]"
    >
      {/* background grid lines */}
      <g stroke="#f0f0f0" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={40 + i * 60} y1={20} x2={40 + i * 60} y2={500} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1={20} y1={40 + i * 64} x2={540} y2={40 + i * 64} />
        ))}
      </g>

      {/* faint concentric rings */}
      <g fill="none" stroke="#e2e2e2" strokeWidth="1">
        <circle cx={280} cy={254} r={130} />
        <circle cx={280} cy={254} r={180} strokeDasharray="2 6" />
      </g>

      {/* flow paths: 1 → 2 → 3 → 4 */}
      <DottedPath d="M 226 138 C 268 130 306 128 344 134" animate />
      <DottedPath d="M 412 196 C 420 236 416 278 404 320" animate />
      <DottedPath d="M 336 380 C 292 392 250 392 212 380" animate />
      <DottedPath d="M 138 320 C 128 278 130 232 142 196" stroke="#dcd6f6" animate />

      {/* travelling packets, staggered through the steps */}
      <Packet path="M 226 138 C 268 130 306 128 344 134" dur="3s" />
      <Packet path="M 412 196 C 420 236 416 278 404 320" dur="3s" begin="0.75s" />
      <Packet path="M 336 380 C 292 392 250 392 212 380" dur="3s" begin="1.5s" />
      <Packet path="M 138 320 C 128 278 130 232 142 196" dur="3s" begin="2.25s" color="#c7bff4" />

      {/* ── Step 1 · Describe your document ── */}
      <Float delay={0.2}>
        {/* person */}
        <g>
          <circle cx={66} cy={120} r={11} fill="#ffffff" stroke="#9a9a9a" strokeWidth="1" />
          <path d="M 48 158 a 18 18 0 0 1 36 0 Z" fill="#ffffff" stroke="#9a9a9a" strokeWidth="1" />
        </g>
        {/* prompt card */}
        <g>
          <rect x={96} y={104} width={130} height={52} fill="#ffffff" stroke="#9a9a9a" strokeWidth="1" />
          <rect x={96} y={104} width={130} height={5} fill="#aef637" />
          <text x={108} y={128} fontSize="10" fontWeight="600" fontFamily={SANS} fill="#404040">
            “Write me a quarterly
          </text>
          <text x={108} y={142} fontSize="10" fontWeight="600" fontFamily={SANS} fill="#404040">
            business report.”
          </text>
          <TypingDots x={112} y={150} />
        </g>
      </Float>
      <StepBadge cx={96} cy={104} n={1} />

      {/* ── Step 2 · Pick a template ── */}
      <Float alt delay={0.5}>
        {/* back sheet */}
        <rect x={364} y={96} width={78} height={72} fill="#fafafa" stroke="#d0d0d0" strokeWidth="1" />
        {/* front sheet: a layout sketch */}
        <g>
          <path d="M 356 112 h 82 l 12 12 v 76 h -94 Z" fill="#ffffff" stroke="#9a9a9a" strokeWidth="1" />
          <path d="M 438 112 v 12 h 12" fill="#f4f4f4" stroke="#9a9a9a" strokeWidth="1" />
          <rect x={368} y={126} width={34} height={5} fill="#aef637" />
          <rect x={368} y={139} width={70} height={18} fill="none" stroke="#b8b8b8" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={368} y={163} width={33} height={18} fill="none" stroke="#b8b8b8" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={405} y={163} width={33} height={18} fill="none" stroke="#b8b8b8" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      </Float>
      <StepBadge cx={356} cy={112} n={2} tone="accent" />

      {/* ── Step 3 · AI writes your document ── */}
      <Float delay={0.9}>
        <g>
          <path d="M 348 306 h 74 l 12 12 v 98 h -86 Z" fill="#ffffff" stroke="#9a9a9a" strokeWidth="1" />
          <path d="M 422 306 v 12 h 12" fill="#f4f4f4" stroke="#9a9a9a" strokeWidth="1" />
          <rect x={360} y={320} width={36} height={5} fill="#aef637" />
          {/* text lines being written: staggered fade-in loop */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={360} y={336 + i * 12} width={64 - (i % 2) * 16} height={3} fill="#e2e2e2">
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
          <path d="M 420 376 l 14 5 l -6 3 l -3 6 Z" fill="#0a0a0a" />
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path="M 360 336 h 56 M 416 348 h -56 M 360 360 h 56 M 416 372 h -56"
          />
        </g>
      </Float>
      <StepBadge cx={348} cy={306} n={3} />
      <CheckPop cx={446} cy={306} />

      {/* ── Step 4 · Download as PDF ── */}
      <Float alt delay={0.3}>
        <g>
          <rect x={124} y={336} width={74} height={48} fill="#0a0a0a" />
          <text x={161} y={365} textAnchor="middle" fontSize="14" fontWeight="700" fontFamily="var(--font-geist-mono), ui-monospace, monospace" fill="#aef637">
            PDF
          </text>
        </g>
        {/* download arrow bouncing into a tray */}
        <g stroke="#9a9a9a" strokeWidth="1" fill="#ffffff">
          <rect x={136} y={404} width={50} height={10} />
        </g>
        <g>
          <path d="M 161 388 v 12 m 0 0 l -6 -7 m 6 7 l 6 -7" stroke="#0a0a0a" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 -3; 0 5; 0 -3"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </g>
      </Float>
      <StepBadge cx={124} cy={336} n={4} tone="accent" />

      {/* ── Central Klone core ── */}
      <g>
        <rect x={232} y={222} width={96} height={62} fill="#ffffff" stroke="#9a9a9a" strokeWidth="1" />
        <rect x={232} y={222} width={96} height={5} fill="#aef637" />
        <text x={280} y={250} textAnchor="middle" fontSize="13" fontWeight="700" fontFamily={SANS} fill="#0a0a0a">
          Klone
        </text>
        <text x={280} y={266} textAnchor="middle" fontSize="9" fontFamily={SANS} fill="#8a8a8a">
          your document studio
        </text>
      </g>
      <PulseDot cx={280} cy={222} delay={0.6} />

      {/* connection stubs from each step toward the core */}
      <g stroke="#dcdcdc" strokeWidth="1" strokeDasharray="2 4">
        <path d="M 210 172 C 232 192 248 206 262 218" fill="none" />
        <path d="M 368 214 C 346 220 328 228 314 236" fill="none" />
        <path d="M 330 340 C 320 314 310 296 298 286" fill="none" />
        <path d="M 226 350 C 240 326 252 306 266 290" fill="none" />
      </g>

      {/* small dot matrix decoration */}
      <g fill="#d4d4d4">
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <circle key={`d${r}${c}`} cx={44 + c * 9} cy={452 + r * 9} r={1.6} />
          )),
        )}
      </g>

      {/* friendly chips */}
      <Chip x={70} y={186} width={128} text="Any AI assistant" />
      <Chip x={368} y={216} width={126} text="Designs that fit" dot="#c7bff4" />
      <Chip x={356} y={430} width={132} text="Editable every line" />
      <Chip x={62} y={430} width={156} text="Print-ready in one click" />
    </svg>
  );
}
