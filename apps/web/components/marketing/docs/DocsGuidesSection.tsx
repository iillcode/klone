"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CodeBlock, InlineCode } from "./CodeBlock";
import { Eyebrow, GridLines, LandingContainer } from "../landing/Section";
import { TOOL_GUIDES, type ToolGuide } from "./tool-guides";

const CATEGORIES = ["Chat", "IDE", "Terminal", "Automation"] as const;

/** Tab button: monogram tile + name + tagline. */
function GuideTab({
  guide,
  active,
  onSelect,
}: {
  guide: ToolGuide;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`docs-tab-${guide.id}`}
      aria-selected={active}
      aria-controls={`docs-panel-${guide.id}`}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]",
        active
          ? "border-[#aef637] bg-[#1c1c1d] text-[#ededed]"
          : "border-[#2a2a2c] bg-[#1c1c1d] text-[#d4d4d4] hover:border-[#3f3f42]",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center border font-mono text-[12px] font-bold",
          active
            ? "border-[#aef637] bg-[#aef637] text-[#0a0a0a]"
            : "border-[#3f3f42] bg-[#262628] text-[#d4d4d4]",
        )}
      >
        {guide.monogram}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold leading-tight">
          {guide.name}
        </span>
        <span className="block truncate text-[11.5px] leading-tight text-[#8a8a8a]">
          {guide.tagline}
        </span>
      </span>
    </button>
  );
}

/** Step list + config snippet for the selected guide. */
function GuidePanel({ guide }: { guide: ToolGuide }) {
  return (
    <div
      role="tabpanel"
      id={`docs-panel-${guide.id}`}
      aria-labelledby={`docs-tab-${guide.id}`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="border border-[#3f3f42] bg-[#262628] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8a8a8a]">
          {guide.category}
        </span>
        <span className="border border-[#3f3f42] bg-[#262628] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8a8a8a]">
          {guide.name}
        </span>
      </div>

      <ol className="space-y-3">
        {guide.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-[#aef637] font-mono text-[11px] font-bold text-[#0a0a0a]">
              {index + 1}
            </span>
            <span className="text-[14.5px] leading-[1.6] text-[#d4d4d4]">
              {step}
            </span>
          </li>
        ))}
      </ol>

      {guide.configSnippet && (
        <div className="mt-6">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
            {guide.configLabel}
          </p>
          <CodeBlock code={guide.configSnippet} label={guide.configLabel ?? "config"} />
        </div>
      )}

      {guide.notes && (
        <ul className="mt-5 space-y-2 border-l-2 border-[#aef637] pl-4">
          {guide.notes.map((note) => (
            <li key={note} className="text-[13px] leading-[1.6] text-[#8a8a8a]">
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * "Connect a tool" — grouped tabs (Chat, IDE, Terminal, Automation) with a
 * step-by-step guide and copyable config snippet per tool.
 */
export function DocsGuidesSection() {
  const [activeId, setActiveId] = useState(TOOL_GUIDES[0]!.id);
  const activeGuide =
    TOOL_GUIDES.find((guide) => guide.id === activeId) ?? TOOL_GUIDES[0]!;

  return (
    <section
      id="guides"
      aria-labelledby="guides-heading"
      className="relative border-t border-[#2a2a2c] bg-[#161617] scroll-mt-16"
    >
      <GridLines />
      <LandingContainer className="relative py-[64px] md:py-[88px]">
        <div className="mb-12 max-w-[640px]">
          <Eyebrow className="mb-5">Connect a tool</Eyebrow>
          <h2
            id="guides-heading"
            className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#ededed] md:text-[44px]"
          >
            Pick your assistant,
            <br />
            copy the config
          </h2>
          <p className="mt-5 text-[16px] leading-[1.65] text-[#a1a1a6]">
            Every guide below gets Klone working in under two minutes. Replace{" "}
            <InlineCode>&lt;KLONE_ACCESS_TOKEN&gt;</InlineCode> with the token
            from step one, paste, restart, done.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-10">
          {/* tab list, grouped by category */}
          <div
            role="tablist"
            aria-label="AI tools"
            aria-orientation="vertical"
            className="space-y-5 lg:col-span-5"
          >
            {CATEGORIES.map((category) => {
              const guides = TOOL_GUIDES.filter((g) => g.category === category);
              if (guides.length === 0) return null;
              return (
                <div key={category}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                    {category}
                  </p>
                  <div className="grid grid-cols-1 gap-px border border-[#2a2a2c] bg-[#2a2a2c] sm:grid-cols-2 lg:grid-cols-1">
                    {guides.map((guide) => (
                      <GuideTab
                        key={guide.id}
                        guide={guide}
                        active={guide.id === activeGuide.id}
                        onSelect={() => setActiveId(guide.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* active guide panel */}
          <div className="border border-[#2a2a2c] bg-[#1c1c1d] p-6 md:p-8 lg:col-span-7">
            <GuidePanel guide={activeGuide} />
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
