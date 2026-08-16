import { ArrowRight } from "lucide-react";

/** Narrow neon-green announcement strip at the very top of the page. */
export function AnnouncementBar() {
  return (
    <a
      href="/pricing"
      className="block bg-[#aef637] text-[#0a0a0a] transition-opacity duration-150 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
    >
      <div className="flex h-[28px] items-center justify-center gap-1.5 px-4 text-[11px] font-medium">
        <span className="truncate">
          Turn a question into a finished PDF — try Klone with your AI
          assistant.
        </span>
        <ArrowRight size={11} className="shrink-0" />
      </div>
    </a>
  );
}
