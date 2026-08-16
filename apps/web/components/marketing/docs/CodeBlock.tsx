"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Dark terminal-style code panel with a copy button. Fits the landing's
 * black + neon accent language (same as the PDF chip and footer).
 */
export function CodeBlock({
  code,
  label = "snippet",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (permissions / older browsers) — no-op.
    }
  };

  return (
    <div className="overflow-hidden border border-[#1f1f1f] bg-[#0a0a0a] text-left">
      <div className="flex items-center justify-between gap-3 border-b border-[#1f1f1f] px-3.5 py-2">
        <span className="truncate font-mono text-[10.5px] tracking-wide text-[#8a8a8a]">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label} to clipboard`}
          className="flex shrink-0 items-center gap-1.5 text-[10.5px] font-medium text-[#8a8a8a] transition-colors duration-150 hover:text-[#aef637] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3.5 font-mono text-[12px] leading-[1.75] text-[#e6e6e6]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Inline code chip for prose on the dark theme. */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="border border-[#3f3f42] bg-[#262628] px-1.5 py-0.5 font-mono text-[0.86em] text-[#ededed]">
      {children}
    </code>
  );
}
