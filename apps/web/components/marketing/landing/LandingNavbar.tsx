"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Templates", href: "#templates" },
  { label: "How it works", href: "#how" },
  { label: "Editor", href: "#editor" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "#resources" },
];

/** Klone wordmark used across the landing page. */
export function KloneWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-[17px] font-bold tracking-tight text-[#0a0a0a]",
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
        <rect x="1" y="1" width="16" height="16" fill="#0a0a0a" />
        <path
          d="M6 4v10M6.4 9.4 12.6 4M8.2 8 12.8 14"
          stroke="#aef637"
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
 * Minimal sticky navigation. Gains a translucent white background and
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
          ? "border-b border-[#e5e5e5] bg-white/85 backdrop-blur-md"
          : "border-b border-transparent bg-white",
      )}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between gap-6 px-5 md:px-8 lg:px-10"
      >
        <a
          href="#platform"
          className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0a0a0a]"
        >
          <KloneWordmark />
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-[14px] font-medium text-[#404040] transition-colors duration-150 hover:text-[#0a0a0a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0a0a0a]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-6 lg:flex">
          <a
            href="/login"
            className="text-[14px] font-medium text-[#404040] transition-colors duration-150 hover:text-[#0a0a0a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0a0a0a]"
          >
            Sign in
          </a>
          <a
            href="/register"
            className="group flex items-center gap-1.5 bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[#262626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
          >
            Get started
            <ArrowUpRight
              size={14}
              className="transition-transform duration-150 group-hover:translate-x-px group-hover:-translate-y-px"
            />
          </a>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center text-[#0a0a0a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a] lg:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-[#e5e5e5] bg-white px-5 py-4 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-[15px] font-medium text-[#262626] hover:text-[#0a0a0a]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-3 border-t border-[#e5e5e5] pt-4">
            <a
              href="/login"
              className="flex-1 border border-[#e5e5e5] px-4 py-2.5 text-center text-[14px] font-medium text-[#0a0a0a]"
            >
              Sign in
            </a>
            <a
              href="/register"
              className="flex-1 bg-[#0a0a0a] px-4 py-2.5 text-center text-[14px] font-medium text-white"
            >
              Get started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
