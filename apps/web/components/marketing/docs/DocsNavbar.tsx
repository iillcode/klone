"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KloneWordmark } from "../landing/LandingNavbar";

const DOCS_NAV_LINKS = [
  { label: "Setup", href: "#setup" },
  { label: "Tools", href: "#tools" },
  { label: "Connect a tool", href: "#guides" },
  { label: "Security", href: "#security" },
  { label: "FAQ", href: "#faq" },
];

/**
 * Sticky docs navigation. Same chrome as the landing navbar but scoped to
 * docs anchors, with a link back to the marketing site.
 */
export function DocsNavbar() {
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
        aria-label="Docs navigation"
        className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between gap-6 px-5 md:px-8 lg:px-10"
      >
        <div className="flex items-center gap-4">
          <a
            href="/home"
            className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#aef637]"
          >
            <KloneWordmark />
          </a>
          <span className="hidden select-none text-[#3f3f42] sm:inline">/</span>
          <span className="hidden text-[13px] font-medium text-[#8a8a8a] sm:inline">
            Docs · MCP
          </span>
        </div>

        <ul className="hidden items-center gap-8 lg:flex">
          {DOCS_NAV_LINKS.map((link) => (
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
            href="/dashboard"
            className="group flex items-center gap-1.5 bg-[#aef637] px-4 py-2.5 text-[14px] font-medium text-[#0a0a0a] transition-colors duration-150 hover:bg-[#9be22e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
          >
            Open dashboard
            <ArrowUpRight
              size={14}
              className="transition-transform duration-150 group-hover:translate-x-px group-hover:-translate-y-px"
            />
          </a>
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
            {DOCS_NAV_LINKS.map((link) => (
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
          <div className="mt-4 border-t border-[#2a2a2c] pt-4">
            <a
              href="/dashboard"
              className="block bg-[#aef637] px-4 py-2.5 text-center text-[14px] font-medium text-[#0a0a0a]"
            >
              Open dashboard
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
