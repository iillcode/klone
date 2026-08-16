import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Klone — AI Document Studio",
  description:
    "Ask your AI assistant, pick a template, and get a finished PDF. Preview, edit, and export print-ready documents yourself.",
};

/**
 * Route layout for the Klone marketing landing page. The page is light-only,
 * so it pins a white surface regardless of the app-wide dark theme.
 */
export default function HomeLayout({
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
