import { cn } from "@/lib/utils";
import { LandingContainer } from "./Section";

interface Testimonial {
  quote: string;
  author: string;
  title: string;
  company: string;
  initials: string;
  avatarTint: string;
  span: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We stopped describing deliverables and started shipping them. Our AI assistant picks the template, writes the report, and saves it to our account — we just export.",
    author: "Mara Chen",
    title: "VP of Operations",
    company: "OpenVector",
    initials: "MC",
    avatarTint: "#e9f9d4",
    span: "md:col-span-7 md:row-span-2",
  },
  {
    quote:
      "The template approach is what sold us. Consistent documents, every time, from any AI assistant.",
    author: "Diego Ramos",
    title: "Head of Platform",
    company: "Docsmith",
    initials: "DR",
    avatarTint: "#eceafd",
    span: "md:col-span-5",
  },
  {
    quote:
      "Our clients edit proposals inline before export. No round-trips through Word, no broken layouts.",
    author: "Priya Nair",
    title: "Founder",
    company: "Ledgerly",
    initials: "PN",
    avatarTint: "#f3f3f3",
    span: "md:col-span-5",
  },
  {
    quote:
      "Connected it to our tools in an afternoon. Ask, get a document, hit download. Zero surprises.",
    author: "Tom Okafor",
    title: "Founding Engineer",
    company: "Inkwell",
    initials: "TO",
    avatarTint: "#e9f9d4",
    span: "md:col-span-4",
  },
  {
    quote:
      "Every account only sees its own documents, so we could open it to clients without a second thought.",
    author: "Lena Fischer",
    title: "Director of Engineering",
    company: "Kestrel.ai",
    initials: "LF",
    avatarTint: "#eceafd",
    span: "md:col-span-4",
  },
  {
    quote:
      "Meeting transcripts in, dated summaries out. The format never drifts.",
    author: "Jonas Weil",
    title: "Principal Engineer",
    company: "Quillbase",
    initials: "JW",
    avatarTint: "#f3f3f3",
    span: "md:col-span-4",
  },
];

/** Asymmetric editorial testimonial grid. */
export function Testimonials() {
  return (
    <section aria-label="Customer testimonials" className="bg-white">
      <LandingContainer className="py-[100px] md:py-[130px]">
        <div className="max-w-[560px]">
          <h2 className="text-[42px] font-bold leading-[1.02] tracking-tight text-[#0a0a0a] md:text-[56px]">
            What our customers
            <br />
            are saying
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-12">
          {TESTIMONIALS.map((item) => (
            <figure
              key={item.company}
              className={cn(
                "group flex flex-col justify-between border border-[#e5e5e5] p-8 transition-transform duration-200 hover:-translate-y-1 hover:border-[#d0d0d0] md:p-9",
                item.span,
              )}
            >
              <blockquote className="text-[19px] font-medium leading-[1.45] tracking-tight text-[#171717] md:text-[21px]">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-9 border-t border-[#f0f0f0] pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center text-[11px] font-bold text-[#404040]"
                      style={{ backgroundColor: item.avatarTint }}
                    >
                      {item.initials}
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#0a0a0a]">
                        {item.author}
                      </p>
                      <p className="text-[12px] text-[#737373]">{item.title}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[12px] font-semibold tracking-tight text-[#8a8a8a] transition-colors duration-150 group-hover:text-[#0a0a0a]">
                    {item.company}
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
