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
 * Visible guide lines for the technical architectural feeling.
 * Rendered as an inert background layer behind section content. Thirteen
 * lines are distributed evenly across the content width (12 equal tracks
 * between 13 lines), so the gaps stay perfectly equal at every viewport
 * size; the first line aligns with the container's content edge and the
 * last one closes the grid on the right edge.
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
      <div className="relative mx-5 h-full md:mx-8 lg:mx-10">
        {Array.from({ length: 13 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-y-0 border-l border-[#242424]"
            style={{ left: `calc((100% / 12) * ${i})` }}
          />
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
        "text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a8a8a]",
        className,
      )}
    >
      {children}
    </p>
  );
}
