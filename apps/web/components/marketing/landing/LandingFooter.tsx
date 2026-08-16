import type { ReactNode } from "react";
import { LandingContainer } from "./Section";

/** Minimal social icons — recent lucide releases dropped brand icons. */
const SOCIAL_ICONS: { label: string; path: ReactNode }[] = [
  {
    label: "GitHub",
    path: (
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.67.42.36.78 1.06.78 2.14 0 1.55-.02 2.79-.02 3.17 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    ),
  },
  {
    label: "X",
    path: (
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    ),
  },
  {
    label: "LinkedIn",
    path: (
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45Z" />
    ),
  },
  {
    label: "YouTube",
    path: (
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    ),
  },
];

const FOOTER_COLUMNS: { heading: string; links: string[] }[] = [
  {
    heading: "Platform",
    links: [
      "Templates",
      "Document editor",
      "PDF export",
      "User accounts",
      "Pricing",
    ],
  },
  {
    heading: "Solutions",
    links: [
      "Business reports",
      "Invoices & estimates",
      "Proposals",
      "Resumes & CVs",
      "Meeting notes",
      "Research briefs",
    ],
  },
  {
    heading: "Integrations",
    links: [
      "AI assistants",
      "Templates",
      "Document editor",
      "PDF export",
      "Changelog",
      "Status",
    ],
  },
  {
    heading: "Resources",
    links: [
      "Guides",
      "Template library",
      "Editor tutorial",
      "Community",
      "Support",
    ],
  },
  {
    heading: "Company",
    links: [
      "About",
      "Customers",
      "Careers",
      "Press",
      "Contact",
    ],
  },
];

const LEGAL_LINKS = ["Privacy", "Terms", "Security", "Status"];

/** Large black footer with wordmark, nav columns, and legal row. */
export function LandingFooter() {
  return (
    <footer id="resources" className="bg-[#0a0a0a] text-white">
      <LandingContainer className="py-10 md:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
          {/* Wordmark + statement */}
          <div className="max-w-[260px]">
            <span className="flex items-center gap-2 text-[16px] font-bold tracking-tight">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="16" height="16" fill="#aef637" />
                <path
                  d="M6 4v10M6.4 9.4 12.6 4M8.2 8 12.8 14"
                  stroke="#0a0a0a"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Klone
            </span>
            <p className="mt-3 text-[12px] leading-[1.7] text-[#a3a3a3]">
              The AI document studio. Ask your AI assistant, edit the result
              yourself, and download a finished PDF.
            </p>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                  {column.heading}
                </h3>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-[12.5px] text-[#d4d4d4] transition-colors duration-150 hover:text-white focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Legal area */}
        <div className="mt-8 border-t border-[#262626] pt-5 md:mt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <p className="text-[12px] text-[#a3a3a3]">
                © 2026 Klone. All rights reserved.
              </p>
              <ul className="flex items-center gap-5">
                {LEGAL_LINKS.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[12px] text-[#a3a3a3] transition-colors duration-150 hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-4">
              {/* system status indicator */}
              <span className="flex items-center gap-2 text-[11px] text-[#a3a3a3]">
                <span aria-hidden="true" className="h-[7px] w-[7px] animate-pulse-dot bg-[#aef637]" />
                All systems operational
              </span>
              <ul className="flex items-center gap-3">
                {SOCIAL_ICONS.map(({ label, path }) => (
                  <li key={label}>
                    <a
                      href="#"
                      aria-label={label}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#a3a3a3] transition-colors duration-150 hover:bg-[#262626] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                        {path}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </LandingContainer>
    </footer>
  );
}
