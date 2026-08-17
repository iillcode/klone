import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { GridLines, LandingContainer } from "./Section";

const PLAN_FEATURES = [
  "Unlimited AI-written documents",
  "Every template included",
  "Design and save your own templates",
  "Full canvas editor — click and restyle anything",
  "One-click A4 PDF export",
  "Private document library",
  "Works with any AI assistant",
  "Priority email support",
];

const ASSURANCES = ["Cancel anytime", "No setup fees", "7-day free trial"];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes — every new account starts with 7 days of the full plan, free. No card required until the trial ends.",
  },
  {
    q: "What do I get with this plan?",
    a: "Everything. All templates, unlimited documents, the full editor, one-click A4 PDF export, and integration with any AI assistant you already use.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel in your account settings with one click — no calls, no emails. Your exported PDFs stay yours, and your documents are waiting if you come back.",
  },
  {
    q: "Do I need my own AI assistant?",
    a: "You're welcome to bring the AI assistant you already use. Klone adds the templates, the editor, and the print-ready export on top of it.",
  },
  {
    q: "Are my documents private?",
    a: "Completely. Every document lives in your own account and nobody else can see, edit, or export it — by default, not as an add-on.",
  },
  {
    q: "How do I pay?",
    a: "Pay monthly by card, or choose annual billing and save 2 months every year. You can switch or cancel at any time.",
  },
];

/** Hero + the single Klone Pro plan card. One plan, so the layout is a wide centered card. */
export function PricingSection() {
  return (
    <section id="pricing" aria-label="Pricing" className="relative bg-[#161617]">
      <GridLines />
      <LandingContainer className="relative pt-[24px] pb-[56px] md:pt-[32px] md:pb-[72px]">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8a8a]">
            Pricing
          </p>
          <h1 className="text-[44px] font-bold leading-[0.98] tracking-tight text-[#ededed] md:text-[64px]">
            One plan.
            <br />
            <span className="inline-block bg-[#aef637] px-3 py-0.5 text-[#0a0a0a]">
              Everything included.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-[480px] text-[16px] leading-[1.65] text-[#a1a1a6]">
            No tiers to compare, no seats to count. One plan with every
            template, every editor tool, and unlimited documents.
          </p>
        </div>

        {/* single plan card */}
        <div className="mx-auto mt-8 w-full max-w-[880px] border border-[#2a2a2c] bg-[#1c1c1d]">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr]">
            {/* plan summary */}
            <div className="border-b border-[#2a2a2c] p-6 md:p-7 lg:border-r lg:border-b-0">
              <span className="inline-block bg-[#aef637] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
                Klone Pro
              </span>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-[56px] font-bold leading-none tracking-tight text-[#ededed]">
                  $19
                </span>
                <span className="text-[14px] text-[#8a8a8a]">/ month</span>
              </div>
              <p className="mt-3 text-[13px] leading-[1.6] text-[#8a8a8a]">
                Or $190/year — two months free.
              </p>

              <ButtonLink href="/register" size="lg" className="group mt-6 w-full">
                Start 7-day free trial
                <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
              </ButtonLink>
              <p className="mt-3 text-center text-[12px] text-[#8a8a8a]">
                No card required to start.
              </p>
            </div>

            {/* everything you get */}
            <div className="p-6 md:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a8a8a]">
                Everything you get
              </p>
              <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                {PLAN_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[14px] leading-[1.5] text-[#d4d4d4]">
                    <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center bg-[#aef637]">
                      <Check size={11} strokeWidth={3} className="text-[#0a0a0a]" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* assurances */}
              <div className="mt-8 flex flex-wrap gap-2 border-t border-[#2a2a2c] pt-6">
                {ASSURANCES.map((item) => (
                  <span
                    key={item}
                    className="border border-[#2a2a2c] bg-[#262628] px-3 py-1.5 text-[12px] font-medium text-[#a1a1a6]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* wider-needs strip */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#2a2a2c] bg-[#1a1a1b] px-8 py-5 text-center md:flex-row md:text-left">
            <p className="text-[13.5px] text-[#a1a1a6]">
              Need it for a whole team? We&apos;re building it — tell us what
              you&apos;d want.
            </p>
            <a
              href="#"
              data-doc="Contact"
              className="group inline-flex shrink-0 items-center gap-1.5 text-[13.5px] font-medium text-[#ededed] transition-colors duration-150 hover:text-[#a1a1a6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
            >
              Talk to us
              <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}

/** Editorial FAQ grid for the pricing page. */
export function PricingFaq() {
  return (
    <section aria-label="Pricing questions and answers" className="bg-[#1a1a1b]">
      <LandingContainer className="py-[64px] md:py-[88px]">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-4">
            <h2 className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#ededed] md:text-[44px]">
              Questions,
              <br />
              answered.
            </h2>
            <p className="mt-5 max-w-[360px] text-[15px] leading-[1.65] text-[#a1a1a6]">
              One plan keeps billing simple — but if anything is unclear, here
              is what people ask before they start.
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-px border border-[#2a2a2c] bg-[#2a2a2c] md:grid-cols-2">
              {FAQS.map((faq) => (
                <article key={faq.q} className="bg-[#1a1a1b] p-7 transition-colors duration-200 hover:bg-[#1e1e1f] md:p-8">
                  <h3 className="text-[15px] font-bold tracking-tight text-[#ededed]">
                    {faq.q}
                  </h3>
                  <p className="mt-3 text-[13.5px] leading-[1.65] text-[#a1a1a6]">
                    {faq.a}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
