import { KeySquare, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { Eyebrow, GridLines, LandingContainer } from "../landing/Section";

const SECURITY_POINTS = [
  {
    icon: KeySquare,
    title: "Your token is your identity",
    body: "The server accepts only a Bearer token signed by your account's Supabase project. Requests without a valid token get a 401 before any tool logic runs.",
  },
  {
    icon: UserCheck,
    title: "Scoped to your documents",
    body: "Your user id is extracted from the token's claims and every document query filters on it (row-level security). An agent can never touch another user's work.",
  },
  {
    icon: ShieldCheck,
    title: "Signed and verified",
    body: "Tokens are verified against the Supabase JWKS with full exp/alg/kid checks. Expired or forged tokens are rejected outright.",
  },
  {
    icon: Lock,
    title: "Templates stay shared, docs stay private",
    body: "Template blueprints are catalog data anyone can read. Only document reads and writes go through your scoped client — with your token attached to every call.",
  },
];

/** How authentication and data isolation work on the MCP server. */
export function DocsSecuritySection() {
  return (
    <section
      id="security"
      aria-labelledby="security-heading"
      className="relative border-t border-[#2a2a2c] bg-[#1a1a1b] scroll-mt-16"
    >
      <GridLines />
      <LandingContainer className="relative py-[64px] md:py-[88px]">
        <div className="mb-14 max-w-[640px]">
          <Eyebrow className="mb-5">Security</Eyebrow>
          <h2
            id="security-heading"
            className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#ededed] md:text-[44px]"
          >
            Your account,
            <br />
            your documents, your rules
          </h2>
          <p className="mt-5 text-[16px] leading-[1.65] text-[#a1a1a6]">
            The MCP server is stateless and user-scoped. It never sees a
            shared password and never stores your token — every request is
            validated fresh.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px border border-[#2a2a2c] bg-[#2a2a2c] md:grid-cols-2">
          {SECURITY_POINTS.map((point) => (
            <div key={point.title} className="bg-[#1c1c1d] p-7">
              <span className="flex h-10 w-10 items-center justify-center border border-[#3f3f42] bg-[#262628]">
                <point.icon size={17} className="text-[#ededed]" />
              </span>
              <h3 className="mt-4 text-[17px] font-bold tracking-tight text-[#ededed]">
                {point.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-[#a1a1a6]">
                {point.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[12.5px] leading-[1.6] text-[#8a8a8a]">
          Practical tip: rotate your token whenever you rotate your Klone
          password, and revoke access by deleting the token from your client —
          it stops working immediately.
        </p>
      </LandingContainer>
    </section>
  );
}

/** Common questions about the MCP integration. */
export function DocsFAQSection() {
  const faqs = [
    {
      q: "My token expired — what do I do?",
      a: "Supabase access tokens last about an hour. Re-run the token exchange command from the setup section and replace the Authorization header in your tool's config. n8n and API-first clients can do this automatically with a pre-request step.",
    },
    {
      q: "Which transport does the server use?",
      a: "Streamable HTTP (single POST endpoint, plain JSON responses — no SSE). Any MCP client that supports remote HTTP servers with custom headers can connect.",
    },
    {
      q: "Can my assistant delete my documents?",
      a: "Yes — delete_document is a real tool. Most assistants will ask for confirmation first. For fully unattended workflows, use a restricted token or wrap the workflow so it only ever calls the read/create tools.",
    },
    {
      q: "Where do saved documents appear?",
      a: "Straight in your Klone dashboard under your account, alongside anything you created in the editor. Open the document, refine it on the canvas, and export a PDF.",
    },
    {
      q: "Does this work with local development?",
      a: "Yes. Run pnpm dev inside apps/mcp (Cloudflare Worker via wrangler, port 8789) and point your client at http://127.0.0.1:8789/mcp with the same auth header.",
    },
    {
      q: "Can I build my own client?",
      a: "Absolutely — the server speaks standard JSON-RPC MCP. POST initialize, then tools/list and tools/call with your Authorization header. There is a Postman collection of every tool in docs/postman for reference.",
    },
  ];

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative border-t border-[#2a2a2c] bg-[#161617] scroll-mt-16"
    >
      <GridLines />
      <LandingContainer className="relative py-[64px] md:py-[88px]">
        <div className="mb-12 max-w-[640px]">
          <Eyebrow className="mb-5">FAQ</Eyebrow>
          <h2
            id="faq-heading"
            className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#ededed] md:text-[44px]"
          >
            Answers before
            <br />
            you ask
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-t-2 border-[#aef637] pt-4">
              <h3 className="text-[15px] font-bold leading-snug text-[#ededed]">
                {faq.q}
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-[#a1a1a6]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
