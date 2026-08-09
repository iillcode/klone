"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { ReviewWall } from "./ReviewWall";

/** Klone K monogram — sized by CSS (.auth-page .logo svg: 52x36). */
export function KloneLogo() {
  return (
    <div className="logo fx">
      <svg viewBox="0 0 40 28" fill="none" aria-hidden="true">
        <path fill="#fff" d="M2 26V2h9l7 10 7-10h9v24h-8V13l-6 8h-4l-6-8v13z" />
      </svg>
    </div>
  );
}

function ThemeToggleFloating() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="theme-toggle"
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}

interface AuthShellProps {
  title: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({ title, footer, children }: AuthShellProps) {
  return (
    <div className="auth-page">
      <ThemeToggleFloating />
      <ReviewWall />
      <div className="panel">
        <div className="auth">
          <KloneLogo />
          <h1 className="fx">{title}</h1>
          {children}
          <p className="terms fx">
            By continuing, you agree to Klone&apos;s{" "}
            <a href="#" data-doc="Terms of Service">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" data-doc="Privacy Policy">
              Privacy Policy
            </a>
            .
          </p>
          <p className="swap fx">{footer}</p>
        </div>
      </div>
    </div>
  );
}