import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centered content container with the landing page's max width. */
export function LandingContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1200px] px-5 md:px-8 lg:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Visible 12-column guide lines for the technical architectural feeling.
 * Rendered as an inert background layer behind section content.
 */
export function GridLines({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 mx-auto w-full max-w-[1200px]",
        className,
      )}
    >
      <div className="mx-5 grid h-full grid-cols-12 gap-x-4 md:mx-8 md:gap-x-6 lg:mx-10">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-l border-[#ededed]" />
        ))}
      </div>
    </div>
  );
}

/** Small uppercase technical eyebrow label. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.18em] text-[#737373]",
        className,
      )}
    >
      {children}
    </p>
  );
}
