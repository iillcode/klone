"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/**
 * Auth-aware primary CTA. When the visitor is signed in, the button points to
 * the app dashboard; otherwise it points to /register. This lets the same
 * "Get started" copy work for both first-time visitors and returning users.
 */
export function GetStartedButton({
  children,
  href = "/register",
  dashboardHref = "/dashboard",
  size = "lg",
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  href?: string;
  dashboardHref?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "primary" | "dark" | "danger" | "ghost";
  className?: string;
}) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.user));
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ButtonLink
      href={signedIn ? dashboardHref : href}
      size={size}
      variant={variant}
      className={className}
    >
      {children}
    </ButtonLink>
  );
}
