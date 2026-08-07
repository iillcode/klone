"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

function KloneLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-lg bg-[#22c55e] flex items-center justify-center shadow-lg shadow-green-500/25">
        <span className="text-black font-bold text-base">K</span>
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Klone
      </span>
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
      className="absolute top-5 right-5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <ThemeToggleFloating />

      <div className="relative flex min-h-screen">
        {/* Left Section - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16">
          <div>
            <KloneLogo />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Turn prompts into{" "}
              <span className="text-[#22c55e]">polished PDFs</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Create professional documents in seconds with AI. From business reports to invoices, Klone helps you generate beautiful PDFs effortlessly.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-muted to-muted-foreground/50 border-2 border-background"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">2,000+</span> teams already creating
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            © 2026 Klone. All rights reserved.
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 sm:px-12">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <KloneLogo />
          </div>

          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>

            <div className="space-y-6">
              {children}
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { KloneLogo };
