import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Klone — AI Document Studio",
  description:
    "Ask your AI assistant, pick a template, and get a finished PDF. Preview, edit, and export print-ready documents yourself.",
};

/**
 * Route layout for the Klone marketing landing page. Dark themed to match
 * the dashboard and editor chrome.
 */
export default function HomeLayout({
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
