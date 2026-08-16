import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Klone",
  description:
    "One plan, everything included. Unlimited AI-written documents, every template, the full editor, and one-click A4 PDF export.",
};

/**
 * Route layout for the Klone pricing page. Like the landing page it is
 * light-only, so it pins a white surface regardless of the app-wide dark
 * theme.
 */
export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-white font-sans text-[#0a0a0a]"
      style={{ colorScheme: "light" }}
    >
      {children}
    </div>
  );
}
