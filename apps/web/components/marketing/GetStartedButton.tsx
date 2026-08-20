"use client";

import { ButtonLink } from "@/components/ui/Button";

/**
 * Primary CTA. Points to `href` (defaults to /register) so the same "Get
 * started" copy works for both first-time visitors and returning users.
 * Auth-gated destinations are handled server-side after sign-in, so this no
 * longer performs a client-side session lookup.
 */
export function GetStartedButton({
  children,
  href = "/register",
  size = "lg",
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  href?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "primary" | "dark" | "danger" | "ghost";
  className?: string;
}) {
  return (
    <ButtonLink
      href={href}
      size={size}
      variant={variant}
      className={className}
    >
      {children}
    </ButtonLink>
  );
}
