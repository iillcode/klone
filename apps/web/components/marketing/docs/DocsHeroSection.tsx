import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { DottedPath, Float, Packet, PulseDot } from "../landing/primitives";
import { GridLines, LandingContainer } from "../landing/Section";

const SANS = "var(--font-geist-sans), sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

/** Simple square tile with a monogram, used for the client tools. */
function ClientTile({
  x,
  y,
  size = 74,
  label,
  tag,
  accent = "#aef637",
}: {
  x: number;
  y: number;
  size?: number;
  label: string;
  tag: string;
  accent?: string;
}) {
  const cx = x + size / 2;
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
      <rect x={x} y={y} width={size} height={4} fill={accent} />
      <text
        x={cx}
        y={y + size * 0.48}
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fontFamily={MONO}
        fill="#ededed"
      >
        {label}
      </text>
      <text
        x={cx}
        y={y + size * 0.72}
        textAnchor="middle"
        fontSize="7.5"
        fontFamily={SANS}
        fill="#8a8a8a"
      >
        {tag}
      </text>
    </g>
  );
}

/** Arrow with a travelling packet + label. */
function Flow({
  d,
  label,
  labelX,
  labelY,
  color = "#aef637",
  begin = "0s",
}: {
  d: string;
  label: string;
  labelX: number;
  labelY: number;
  color?: string;
  begin?: string;
}) {
  return (
    <g>
      <DottedPath d={d} animate />
      <Packet path={d} dur="3.4s" begin={begin} color={color} />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        fontSize="7.5"
        fontFamily={MONO}
        fill="#737373"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Docs hero diagram. A ring of client tools (Claude, the IDEs, automation)
 * each open an authenticated session to the central Klone MCP server, which
 * writes finished documents into the user's private library.
 */
export function DocsHeroDiagram() {
  return (
    <svg
      viewBox="0 0 1120 460"
      role="img"
      aria-label="Claude, VS Code, Cursor, n8n, and other tools all connect to the Klone MCP server with a token, and Klone writes the finished documents into your library"
      className="h-auto w-full"
    >
      {/* backdrop grid */}
      <g stroke="#202020" strokeWidth="1">
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={`v${i}`} x1={40 + i * 74} y1={20} x2={40 + i * 74} y2={440} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1={20} y1={30 + i * 66} x2={1100} y2={30 + i * 66} />
        ))}
      </g>

      {/* faint rings around the server */}
      <g fill="none" stroke="#2a2a2c" strokeWidth="1">
        <circle cx={580} cy={228} r={148} strokeDasharray="2 6" />
        <circle cx={580} cy={228} r={208} />
      </g>

      {/* left column of clients */}
      <ClientTile x={64} y={72} label="C" tag="Claude" accent="#c7bff4" />
      <ClientTile x={64} y={190} label="V" tag="VS Code" />
      <ClientTile x={64} y={308} label="Cu" tag="Cursor" accent="#c7bff4" />

      {/* flows from the left clients into the server */}
      <Flow
        d="M 148 110 C 280 130 420 180 512 212"
        label="claude_desktop_config"
        labelX={300}
        labelY={140}
        color="#c7bff4"
        begin="0s"
      />
      <Flow
        d="M 148 228 C 300 228 420 228 510 228"
        label="mcp.json"
        labelX={330}
        labelY={214}
        begin="0.7s"
      />
      <Flow
        d="M 148 346 C 280 326 420 278 512 246"
        label=".cursor/mcp.json"
        labelX={300}
        labelY={318}
        color="#c7bff4"
        begin="1.4s"
      />

      {/* right column of clients */}
      <ClientTile x={980} y={72} label="n8n" tag="Automation" />
      <ClientTile x={980} y={190} label="Oc" tag="OpenCode" accent="#c7bff4" />
      <ClientTile x={980} y={308} label="W" tag="Windsurf" />

      {/* flows from the right clients into the server */}
      <Flow
        d="M 970 110 C 840 130 700 180 648 212"
        label="workflow node"
        labelX={860}
        labelY={140}
        begin="0.4s"
      />
      <Flow
        d="M 970 228 C 820 228 700 228 650 228"
        label="opencode.json"
        labelX={830}
        labelY={214}
        color="#c7bff4"
        begin="1.1s"
      />
      <Flow
        d="M 970 346 C 840 326 700 278 648 246"
        label="mcp config"
        labelX={860}
        labelY={318}
        begin="1.8s"
      />

      {/* central Klone MCP server block */}
      <g>
        <rect x={512} y={176} width={136} height={104} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
        <rect x={512} y={176} width={136} height={5} fill="#aef637" />
        <text x={580} y={216} textAnchor="middle" fontSize="15" fontWeight="700" fontFamily={SANS} fill="#ededed">
          Klone MCP
        </text>
        <text x={580} y={236} textAnchor="middle" fontSize="8.5" fontFamily={MONO} fill="#8a8a8a">
          server / 7 tools
        </text>
        <g>
          <rect x={536} y={250} width={88} height={18} fill="#262628" stroke="#3f3f42" strokeWidth="1" />
          <circle cx={546} cy={259} r={3} fill="#aef637" />
          <text x={554} y={262.5} fontSize="8" fontFamily={MONO} fill="#a1a1a6">Bearer token</text>
        </g>
      </g>
      <PulseDot cx={512} cy={176} delay={0.3} />

      {/* server → your documents */}
      <DottedPath d="M 580 280 C 578 300 574 316 570 328" animate />
      <Packet path="M 580 280 C 578 300 574 316 570 328" dur="3s" begin="2.4s" color="#aef637" />
      <Float alt delay={0.7}>
        <g>
          <rect x={512} y={330} width={58} height={72} fill="#2c2842" stroke="#4c4668" strokeWidth="1" />
          <rect x={522} y={322} width={42} height={54} fill="#1e1e1f" stroke="#3f3f42" strokeWidth="1" />
          <rect x={528} y={332} width={20} height={4} fill="#aef637" />
          <rect x={528} y={342} width={30} height={2.5} fill="#3d3d40" />
          <rect x={528} y={349} width={26} height={2.5} fill="#3d3d40" />
          <rect x={528} y={356} width={28} height={2.5} fill="#3d3d40" />
          <rect x={528} y={363} width={24} height={2.5} fill="#3d3d40" />
        </g>
      </Float>
      <text x={541} y={422} textAnchor="middle" fontSize="10.5" fontWeight="600" fontFamily={SANS} fill="#a1a1a6">
        Your documents
      </text>
      <text x={541} y={436} textAnchor="middle" fontSize="9" fontFamily={SANS} fill="#8a8a8a">
        Safe &amp; private
      </text>

      {/* friendly chip */}
      <g>
        <rect x={64} y={26} width={230} height={24} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
        <circle cx={77} cy={38} r={3.5} fill="#aef637" />
        <text x={87} y={41.5} fontSize="10" fontWeight="600" fontFamily={SANS} fill="#d4d4d4">
          One server, many AI tools
        </text>
      </g>

      {/* dot matrix decoration */}
      <g fill="#3a3a3d">
        {Array.from({ length: 3 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <circle key={`d${r}${c}`} cx={240 + c * 9} cy={400 + r * 9} r={1.6} />
          )),
        )}
      </g>
    </svg>
  );
}

/** Docs hero: headline on the left, connection diagram on the right. */
export function DocsHeroSection() {
  return (
    <section
      id="docs-top"
      aria-label="Connect your AI tools to Klone"
      className="relative overflow-hidden bg-[#161617]"
    >
      <GridLines />
      <LandingContainer className="relative pt-[56px] pb-[64px] md:pt-[72px] md:pb-[88px]">
        <div className="grid grid-cols-1 items-center gap-y-10 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-6">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8a8a]">
              Documentation · MCP
            </p>
            <h1 className="text-[44px] font-bold leading-[1.0] tracking-tight text-[#ededed] md:text-[60px] xl:text-[68px]">
              Connect any
              <br />
              AI assistant
            </h1>
            <p className="mt-6 max-w-[460px] text-[17px] leading-[1.6] text-[#a1a1a6]">
              Point the tools you already use at the Klone MCP server and
              they can browse templates and write finished documents straight
              into your library. Same account, same documents, same editor.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="#setup" size="lg" className="group">
                Start setup
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </ButtonLink>
              <a
                href="#tools"
                className="group flex items-center gap-2 px-2 py-2 text-[15px] font-medium text-[#ededed] transition-colors duration-200 hover:text-[#a1a1a6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
              >
                Browse the 7 tools
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#2a2a2c] pt-6">
              {[
                { value: "7", label: "tools exposed" },
                { value: "HTTP", label: "single endpoint" },
                { value: "JWT", label: "your account only" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-[20px] font-bold tracking-tight text-[#ededed]">
                    {stat.value}
                  </span>
                  <span className="text-[12px] text-[#8a8a8a]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <DocsHeroDiagram />
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
