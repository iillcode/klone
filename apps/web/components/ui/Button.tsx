"use client";

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Shared "3D pressable" button design.
 *
 * A raised face with a solid darker bottom edge plus a soft drop shadow.
 * On press, the face sinks into its edge (translate-y) while the edge
 * collapses. All colors live as literal Tailwind classes so any element
 * (button or anchor) can compose them through `pressClasses()`.
 */

export type PressVariant = "primary" | "dark" | "danger" | "ghost";
export type PressSize = "xs" | "sm" | "md" | "lg";

const pressBase =
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 border-none font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#52525b] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none";

const pressVariant: Record<PressVariant, string> = {
  // Lime face with a darker lime bottom edge.
  primary:
    "bg-[#aef637] text-[#374151] hover:bg-[#9be22e] shadow-[0_4px_0_rgb(101,163,13),0_6px_10px_rgba(0,0,0,0.45)]",
  // Raised charcoal face with a near-black bottom edge.
  dark:
    "bg-[#262628] text-[#ededed] hover:bg-[#313133] shadow-[0_4px_0_#0a0a0b,0_6px_10px_rgba(0,0,0,0.4)]",
  // Raised red face with a dark red bottom edge.
  danger:
    "bg-[#dc2626] text-white hover:bg-[#ef4444] shadow-[0_4px_0_#7f1d1d,0_6px_10px_rgba(0,0,0,0.45)]",
  // Flat — for low-emphasis toolbar affordances (no edge).
  ghost:
    "bg-transparent text-[#a1a1aa] hover:bg-[#2a2a2a] hover:text-[#e4e4e7]",
};

const pressSize: Record<PressSize, string> = {
  xs: "rounded-[8px] px-2 py-1 text-[11px]",
  sm: "rounded-[8px] px-3 py-1.5 text-[12.5px]",
  md: "rounded-[8px] px-4 py-[9px] text-sm",
  lg: "rounded-[8px] px-7 py-[14.5px] text-[15px]",
};

/** Composable class string for the 3D press design (works on <button> and <a>). */
export function pressClasses(
  variant: PressVariant = "primary",
  size: PressSize = "md",
) {
  return cn(pressBase, pressVariant[variant], pressSize[size]);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PressVariant;
  size?: PressSize;
}

/** 3D pressable button — the face sinks into its bottom edge on press. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className, type = "button", ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(pressClasses(variant, size), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: PressVariant;
  size?: PressSize;
}

/** Same 3D press design for CTA links (<a>). */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(pressClasses(variant, size), className)}
      {...props}
    />
  ),
);
ButtonLink.displayName = "ButtonLink";
