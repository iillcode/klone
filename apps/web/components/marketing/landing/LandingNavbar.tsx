"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "Templates", href: "#templates" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

/**
 * Klone wordmark used across the landing page.
 * `variant="black"` renders the inverted mark (black tile, lime K).
 */
export function KloneWordmark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "black";
}) {
  const black = variant === "black";
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-[17px] font-bold tracking-tight text-[#ededed]",
        className,
      )}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="16" height="16" fill={black ? "#0a0a0a" : "#aef637"} />
        <path
          d="M6 4v10M6.4 9.4 12.6 4M8.2 8 12.8 14"
          stroke={black ? "#aef637" : "#0a0a0a"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Klone
    </span>
  );
}

/**
 * Minimal sticky navigation. Gains a translucent dark background and
 * backdrop blur once the page is scrolled past the announcement bar.
 */
export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-200",
        scrolled
          ? "border-b border-[#2a2a2c] bg-[#161617]/85 backdrop-blur-md"
          : "border-b border-transparent bg-[#161617]",
      )}
    >
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between gap-6 px-5 md:px-8 lg:px-10"
      >
        <a
          href="/home"
          className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#aef637]"
        >
          <KloneWordmark />
        </a>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-[14px] font-medium text-[#a1a1a6] transition-colors duration-150 hover:text-[#ededed] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#aef637]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-6 lg:flex">
          <a
            href="/login"
            className="text-[14px] font-medium text-[#a1a1a6] transition-colors duration-150 hover:text-[#ededed] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#aef637]"
          >
            Sign in
          </a>
          <ButtonLink href="/register" className="group">
            Get started
            <ArrowUpRight
              size={14}
              className="transition-transform duration-150 group-hover:translate-x-px group-hover:-translate-y-px"
            />
          </ButtonLink>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center text-[#ededed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637] lg:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-[#2a2a2c] bg-[#161617] px-5 py-4 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-[15px] font-medium text-[#d4d4d4] hover:text-[#ededed]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-3 border-t border-[#2a2a2c] pt-4">
            <ButtonLink href="/login" variant="dark" className="flex-1">
              Sign in
            </ButtonLink>
            <ButtonLink href="/register" className="flex-1">
              Get started
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
