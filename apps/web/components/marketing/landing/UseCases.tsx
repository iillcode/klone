import { ArrowRight } from "lucide-react";
import { LandingContainer } from "./Section";

const USE_CASES_ROW_A = [
  {
    title: "Business reports",
    description:
      "Structured multi-page reports with a cover, sections, and data callouts — always laid out perfectly on A4.",
    meta: "Templates included",
  },
  {
    title: "Invoices & estimates",
    description:
      "Number-ready layouts with line items, totals, and payment terms — filled in from a plain description.",
    meta: "Templates included",
  },
  {
    title: "Proposals & one-pagers",
    description:
      "Persuasive single-page layouts with consistent branding, clear hierarchy, and print-safe margins.",
    meta: "Templates included",
  },
];

const USE_CASES_ROW_B = [
  {
    title: "Resumes & CVs",
    description:
      "ATS-friendly resume templates with sharp typography and predictable page breaks.",
    meta: "Templates included",
  },
  {
    title: "Meeting notes",
    description:
      "Turn a raw transcript into a clean, dated summary document with owners and action items.",
    meta: "Templates included",
  },
  {
    title: "Research briefs",
    description:
      "Cited, sectioned briefs with footnotes and abstracts, built from the research you already have.",
    meta: "Templates included",
  },
  {
    title: "Data summaries",
    description:
      "Tables, key metrics, and commentary blocks laid out clearly from the numbers you provide.",
    meta: "Templates included",
  },
];

/** Soft-gray section of editorial use-case items in 3-column grids. */
export function UseCases() {
  return (
    <section aria-label="Document templates" className="bg-[#fafafa]">
      <LandingContainer className="py-[100px] md:py-[130px]">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="text-[42px] font-bold leading-[1.02] tracking-tight text-[#0a0a0a] md:text-[56px]">
            Engineered for the documents
            <br />
            people actually send
          </h2>
          <p className="mx-auto mt-6 max-w-[480px] text-[16px] leading-[1.65] text-[#525252]">
            Purpose-built templates for the documents that matter — every one
            editable and ready to export in one click.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px border border-[#e5e5e5] bg-[#e5e5e5] md:grid-cols-3">
          {USE_CASES_ROW_A.map((item) => (
            <UseCaseCell key={item.title} item={item} />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-px border border-[#e5e5e5] bg-[#e5e5e5] md:grid-cols-2 lg:grid-cols-4">
          {USE_CASES_ROW_B.map((item) => (
            <UseCaseCell key={item.title} item={item} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#templates"
            className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#0a0a0a] hover:text-[#404040] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
          >
            View all templates
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>
      </LandingContainer>
    </section>
  );
}

function UseCaseCell({
  item,
}: {
  item: { title: string; description: string; meta: string };
}) {
  return (
    <article className="group flex flex-col bg-[#fafafa] p-7 transition-colors duration-200 hover:bg-white">
      <h3 className="text-[17px] font-bold tracking-tight text-[#0a0a0a]">
        {item.title}
      </h3>
      <p className="mt-3 text-[13.5px] leading-[1.6] text-[#525252]">
        {item.description}
      </p>
      <span className="mt-8 border-t border-[#e9e9e9] pt-4 font-mono text-[10.5px] uppercase tracking-wide text-[#8a8a8a]">
        {item.meta}
      </span>
    </article>
  );
}
