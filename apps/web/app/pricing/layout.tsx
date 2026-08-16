import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Klone",
  description:
    "One plan, everything included. Unlimited AI-written documents, every template, the full editor, and one-click A4 PDF export.",
};

/**
 * Route layout for the Klone pricing page. Dark themed to match the
 * dashboard and editor chrome.
 */
export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-[#161617] font-sans text-[#ededed]"
      style={{ colorScheme: "dark" }}
    >
      {children}
    </div>
  );
}
