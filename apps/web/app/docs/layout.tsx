import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — Connect your AI assistant to Klone",
  description:
    "Connect Claude, n8n, VS Code, Cursor, and other AI tools to the Klone MCP server so your assistant can write documents straight into your Klone library.",
};

/**
 * Route layout for the Klone docs page. Dark themed to match the dashboard
 * and editor chrome.
 */
export default function DocsLayout({
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
