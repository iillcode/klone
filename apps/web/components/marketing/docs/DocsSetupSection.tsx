import { KeyRound, PlugZap, Search } from "lucide-react";
import { CodeBlock, InlineCode } from "./CodeBlock";
import { LOCAL_MCP_URL, MCP_URL, TOKEN_CURL } from "./constants";
import { Eyebrow, GridLines, LandingContainer } from "../landing/Section";

const SETUP_STEPS = [
  {
    icon: KeyRound,
    title: "Get your access token",
    body: "Every MCP call is authenticated with your Klone account token (a Supabase JWT). Exchange your login credentials for one:",
    extra: (
      <p className="text-[12.5px] leading-[1.6] text-[#8a8a8a]">
        Copy <InlineCode>access_token</InlineCode> from the response. It is
        valid for about an hour — long-lived sessions are refreshed below
        per tool.
      </p>
    ),
    snippet: { code: TOKEN_CURL, label: "terminal — exchange credentials for a token" },
  },
  {
    icon: PlugZap,
    title: "Point your tool at the server",
    body: "One hosted endpoint speaks Streamable HTTP MCP. Add it to any client that supports remote MCP servers with custom headers:",
    extra: (
      <p className="text-[12.5px] leading-[1.6] text-[#8a8a8a]">
        Developing locally? Run{" "}
        <InlineCode>pnpm dev</InlineCode> inside{" "}
        <InlineCode>apps/mcp</InlineCode> and use{" "}
        <InlineCode>{LOCAL_MCP_URL}</InlineCode> instead.
      </p>
    ),
    snippet: {
      code: `server url: ${MCP_URL}

headers:
  Authorization: Bearer <KLONE_ACCESS_TOKEN>
  Content-Type: application/json
  Accept: application/json, text/event-stream`,
      label: "connection details — HTTP transport",
    },
  },
  {
    icon: Search,
    title: "Ask for a document",
    body: "Your assistant now sees the 7 Klone tools. Ask for a document in your own words — it picks a template, composes the HTML, and saves it to your library:",
    extra: (
      <p className="text-[12.5px] leading-[1.6] text-[#8a8a8a]">
        Open <a href="/dashboard" className="text-[#ededed] underline underline-offset-2 hover:text-[#a1a1a6]">your dashboard</a>{" "}
        to see it appear — edit on the canvas, then export the PDF.
      </p>
    ),
    snippet: {
      code: `"Create a Q2 business report for Acme Labs using the
business-report template. Revenue grew 12% to $4.2M.
Churn dropped to 2.1%."`,
      label: "example prompt — after connecting",
    },
  },
];

/** Three-step setup: token → server config → first prompt. */
export function DocsSetupSection() {
  return (
    <section id="setup" aria-labelledby="setup-heading" className="relative bg-[#161617] scroll-mt-16">
      <GridLines />
      <LandingContainer className="relative py-[64px] md:py-[88px]">
        <div className="mb-14 max-w-[640px]">
          <Eyebrow className="mb-5">Setup · 3 steps</Eyebrow>
          <h2
            id="setup-heading"
            className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#ededed] md:text-[44px]"
          >
            Go from token to
            <br />
            a saved document
          </h2>
          <p className="mt-5 text-[16px] leading-[1.65] text-[#a1a1a6]">
            The Klone MCP server is a single hosted HTTP endpoint guarded by
            your account token. Once connected, your assistant browses
            templates and saves documents under your account.
          </p>
        </div>

        <ol className="space-y-10">
          {SETUP_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-x-10"
            >
              <div className="lg:col-span-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#2a2a2c] bg-[#1c1c1d]">
                    <step.icon size={18} className="text-[#ededed]" />
                  </span>
                  <div>
                    <p className="font-mono text-[11px] tracking-wide text-[#737373]">
                      0{index + 1}
                    </p>
                    <h3 className="text-[20px] font-bold tracking-tight text-[#ededed]">
                      {step.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-4 text-[14.5px] leading-[1.65] text-[#a1a1a6]">
                  {step.body}
                </p>
                <div className="mt-3">{step.extra}</div>
              </div>
              <div className="lg:col-span-7">
                <CodeBlock code={step.snippet.code} label={step.snippet.label} />
              </div>
            </li>
          ))}
        </ol>
      </LandingContainer>
    </section>
  );
}
