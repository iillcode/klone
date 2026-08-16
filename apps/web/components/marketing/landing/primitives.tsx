/**
 * Reusable SVG primitives for the Klone landing-page diagrams.
 * Friendly illustration language: A4 doc pages, labels, people, locks,
 * dotted connectors, animated packets and pulse dots.
 */
import type { ReactNode } from "react";

/** Isometric cube. */
export function IsoCube({
  x,
  y,
  size = 36,
  fill = "#ffffff",
  stroke = "#c4c4c4",
  topFill = "#f3f3f3",
}: {
  x: number;
  y: number;
  size?: number;
  fill?: string;
  stroke?: string;
  topFill?: string;
}) {
  const h = size;
  const w = size;
  return (
    <g>
      <path
        d={`M ${x} ${y - h / 2} L ${x + w} ${y} L ${x} ${y + h / 2} L ${x - w} ${y} Z`}
        fill={topFill}
        stroke={stroke}
        strokeWidth="1"
      />
      <path
        d={`M ${x - w} ${y} L ${x} ${y + h / 2} L ${x} ${y + h * 1.25} L ${x - w} ${y + h * 0.75} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
      <path
        d={`M ${x + w} ${y} L ${x} ${y + h / 2} L ${x} ${y + h * 1.25} L ${x + w} ${y + h * 0.75} Z`}
        fill={fill}
        opacity="0.85"
        stroke={stroke}
        strokeWidth="1"
      />
    </g>
  );
}

/** Simple cylinder shape (generic decorative primitive). */
export function Cylinder({
  x,
  y,
  width = 64,
  height = 96,
  fill = "#ffffff",
  stroke = "#b8b8b8",
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
}) {
  const rx = width / 2;
  const ry = width * 0.19;
  return (
    <g>
      <path
        d={`M ${x - rx} ${y} v ${height} a ${rx} ${ry} 0 0 0 ${width} 0 v ${-height}`}
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
      <ellipse
        cx={x}
        cy={y}
        rx={rx}
        ry={ry}
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </g>
  );
}

/** A4-style document page with text lines. */
export function DocPage({
  x,
  y,
  width = 66,
  height = 88,
  lines = 4,
  accent = "#aef637",
  stroke = "#b8b8b8",
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  lines?: number;
  accent?: string | null;
  stroke?: string;
}) {
  const fold = 12;
  const inset = 10;
  const lineY0 = y + (accent ? 30 : 18);
  const lineGap = 9;
  return (
    <g>
      <path
        d={`M ${x} ${y} h ${width - fold} l ${fold} ${fold} v ${height - fold} h ${-width} Z`}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth="1"
      />
      <path
        d={`M ${x + width - fold} ${y} v ${fold} h ${fold}`}
        fill="#f4f4f4"
        stroke={stroke}
        strokeWidth="1"
      />
      {accent && <rect x={x + inset} y={y + 14} width={width * 0.42} height={5} fill={accent} />}
      {Array.from({ length: lines }).map((_, i) => (
        <rect
          key={i}
          x={x + inset}
          y={lineY0 + i * lineGap}
          width={width - inset * 2 - (i % 2 === 1 ? 10 : 0)}
          height={2.5}
          fill="#e2e2e2"
        />
      ))}
    </g>
  );
}

/** Small floating UI label chip. */
export function Label({
  x,
  y,
  width = 84,
  text,
  dot = "#aef637",
}: {
  x: number;
  y: number;
  width?: number;
  text: string;
  dot?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={20}
        fill="#ffffff"
        stroke="#dcdcdc"
        strokeWidth="1"
      />
      <circle cx={x + 11} cy={y + 10} r={3} fill={dot} />
      <text
        x={x + 19}
        y={y + 13.5}
        fontSize="8.5"
        fontFamily="var(--font-geist-mono), monospace"
        fill="#525252"
      >
        {text}
      </text>
    </g>
  );
}

/** Dotted connector path. Add className="animate-dash-flow" to animate. */
export function DottedPath({
  d,
  stroke = "#c9c9c9",
  animate = false,
}: {
  d: string;
  stroke?: string;
  animate?: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth="1"
      strokeDasharray="3 4"
      className={animate ? "animate-dash-flow" : undefined}
    />
  );
}

/** Dot that travels along an SVG path in a loop (SMIL, no JS needed). */
export function Packet({
  path,
  dur = "4s",
  color = "#aef637",
  r = 3.5,
  begin = "0s",
}: {
  path: string;
  dur?: string;
  color?: string;
  r?: number;
  begin?: string;
}) {
  return (
    <circle r={r} fill={color}>
      <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
    </circle>
  );
}

/** Pulsing neon or lavender dot for "live" components. */
export function PulseDot({
  cx,
  cy,
  r = 4,
  color = "#aef637",
  halo = true,
  delay = 0,
}: {
  cx: number;
  cy: number;
  r?: number;
  color?: string;
  halo?: boolean;
  delay?: number;
}) {
  return (
    <g>
      {halo && (
        <circle cx={cx} cy={cy} r={r * 2.4} fill={color} opacity="0.22" className="animate-pulse-dot" style={{ animationDelay: `${delay}s` }} />
      )}
      <circle cx={cx} cy={cy} r={r} fill={color} className="animate-pulse-dot" style={{ animationDelay: `${delay}s` }} />
    </g>
  );
}

/** Wrapper that gently floats grouped SVG content. */
export function Float({
  children,
  alt = false,
  delay = 0,
}: {
  children: ReactNode;
  alt?: boolean;
  delay?: number;
}) {
  return (
    <g
      className={alt ? "animate-float-alt" : "animate-float"}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </g>
  );
}

/** Friendly person figure (head + shoulders), anchored at the body. */
export function Person({
  x,
  y,
  scale = 1,
  stroke = "#9a9a9a",
  fill = "#ffffff",
}: {
  x: number;
  y: number;
  scale?: number;
  stroke?: string;
  fill?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx={0} cy={-14} r={9} fill={fill} stroke={stroke} strokeWidth="1" />
      <path d="M -14 10 a 14 14 0 0 1 28 0 Z" fill={fill} stroke={stroke} strokeWidth="1" />
    </g>
  );
}

/** Padlock for privacy and "safe" flows. */
export function Lock({
  x,
  y,
  size = 26,
  stroke = "#9a9a9a",
  fill = "#ffffff",
}: {
  x: number;
  y: number;
  size?: number;
  stroke?: string;
  fill?: string;
}) {
  const bw = size;
  const bh = size * 0.8;
  const half = size / 2;
  return (
    <g>
      <path
        d={`M ${x + half - size * 0.28} ${y} v ${-size * 0.3} a ${size * 0.28} ${size * 0.28} 0 0 1 ${size * 0.56} 0 v ${size * 0.3}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      />
      <rect x={x} y={y} width={bw} height={bh} fill={fill} stroke={stroke} strokeWidth="1" />
      <circle cx={x + half} cy={y + bh * 0.42} r={2} fill="#0a0a0a" />
      <rect x={x + half - 1} y={y + bh * 0.42} width={2} height={bh * 0.3} fill="#0a0a0a" />
    </g>
  );
}

/** Larger, human-readable label chip. */
export function Chip({
  x,
  y,
  width = 110,
  text,
  dot = "#aef637",
}: {
  x: number;
  y: number;
  width?: number;
  text: string;
  dot?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={24}
        fill="#ffffff"
        stroke="#d4d4d4"
        strokeWidth="1"
      />
      <circle cx={x + 13} cy={y + 12} r={3.5} fill={dot} />
      <text
        x={x + 23}
        y={y + 15.5}
        fontSize="10"
        fontWeight="600"
        fontFamily="var(--font-geist-sans), sans-serif"
        fill="#404040"
      >
        {text}
      </text>
    </g>
  );
}

/** Numbered step badge used to narrate a flow (1, 2, 3, 4 …). */
export function StepBadge({
  cx,
  cy,
  n,
  tone = "dark",
}: {
  cx: number;
  cy: number;
  n: number;
  tone?: "dark" | "accent";
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={11}
        fill={tone === "accent" ? "#aef637" : "#0a0a0a"}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fontFamily="var(--font-geist-sans), sans-serif"
        fill={tone === "accent" ? "#0a0a0a" : "#ffffff"}
      >
        {n}
      </text>
    </g>
  );
}

/** Three looping "typing" dots for prompt/request cards. */
export function TypingDots({
  x,
  y,
  gap = 9,
  color = "#aef637",
}: {
  x: number;
  y: number;
  gap?: number;
  color?: string;
}) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + i * gap} cy={y} r={2.6} fill={color}>
          <animate
            attributeName="opacity"
            values="0.2;1;0.2"
            dur="1.5s"
            begin={`${i * 0.25}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  );
}

/** Green check circle that pops in, then rests (loops every cycle). */
export function CheckPop({ cx, cy, r = 8 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 2.2} fill="#aef637" opacity="0.2" className="animate-pulse-dot" />
      <circle cx={cx} cy={cy} r={r} fill="#aef637" />
      <path
        d={`M ${cx - r * 0.45} ${cy} l ${r * 0.35} ${r * 0.38} l ${r * 0.6} ${-r * 0.72}`}
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <animate
        attributeName="opacity"
        values="0;0;1;1"
        keyTimes="0;0.2;0.35;1"
        dur="5s"
        repeatCount="indefinite"
      />
    </g>
  );
}
