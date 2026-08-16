import { ArrowLeft } from "lucide-react";
import { KloneWordmark } from "@/components/marketing/landing/LandingNavbar";
import {
  Chip,
  DocPage,
  DottedPath,
  Float,
  Lock,
  Packet,
  Person,
  PulseDot,
  StepBadge,
  TypingDots,
} from "@/components/marketing/landing/primitives";

const SANS = "var(--font-geist-sans), sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

/** Shared light grid backdrop for the auth story diagrams. */
function DiagramGrid() {
  return (
    <g stroke="#f0f0f0" strokeWidth="1">
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`v${i}`} x1={40 + i * 58} y1={14} x2={40 + i * 58} y2={236} />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={`h${i}`} x1={16} y1={34 + i * 60} x2={464} y2={34 + i * 60} />
      ))}
    </g>
  );
}

/** Register story: 1 → create a free account, 2 → pick a template, 3 → get it written. */
function SignupDiagram() {
  return (
    <svg
      viewBox="0 0 480 250"
      role="img"
      aria-label="Create an account, pick a template, and your AI assistant writes a finished document"
      className="h-auto w-full"
    >
      <DiagramGrid />

      {/* flow paths */}
      <DottedPath d="M 128 120 H 196" animate />
      <DottedPath d="M 300 120 H 366" animate />
      <Packet path="M 128 120 H 196" dur="3s" />
      <Packet path="M 300 120 H 366" dur="3.4s" begin="1.2s" color="#c7bff4" />

      {/* 1 · create account */}
      <Float delay={0.2}>
        <g>
          <rect x={28} y={34} width={128} height={42} fill="#ffffff" stroke="#d4d4d4" strokeWidth="1" />
          <rect x={28} y={34} width={128} height={4} fill="#aef637" />
          <text x={40} y={55} fontSize="10" fontWeight="600" fontFamily={SANS} fill="#404040">
            Create a free
          </text>
          <text x={40} y={68} fontSize="10" fontWeight="600" fontFamily={SANS} fill="#404040">
            account
          </text>
        </g>
      </Float>
      <StepBadge cx={28} cy={34} n={1} />
      <Person x={92} y={132} scale={1.2} />
      <text x={92} y={180} textAnchor="middle" fontSize="10.5" fontWeight="600" fontFamily={SANS} fill="#525252">
        You
      </text>

      {/* 2 · pick a template */}
      <Float alt delay={0.4}>
        <g>
          <path d="M 216 76 h 66 l 10 10 v 72 h -76 Z" fill="#ffffff" stroke="#9a9a9a" strokeWidth="1" />
          <path d="M 282 76 v 10 h 10" fill="#f4f4f4" stroke="#9a9a9a" strokeWidth="1" />
          <rect x={226} y={90} width={28} height={4} fill="#aef637" />
          <rect x={226} y={102} width={56} height={14} fill="none" stroke="#b8b8b8" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={226} y={122} width={26} height={14} fill="none" stroke="#b8b8b8" strokeWidth="1" strokeDasharray="3 3" />
          <rect x={256} y={122} width={26} height={14} fill="none" stroke="#b8b8b8" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      </Float>
      <StepBadge cx={216} cy={76} n={2} tone="accent" />
      <text x={254} y={180} textAnchor="middle" fontSize="10.5" fontWeight="600" fontFamily={SANS} fill="#525252">
        Pick a template
      </text>

      {/* 3 · AI writes it */}
      <Float delay={0.6}>
        <g>
          <DocPage x={382} y={74} width={56} height={74} accent="#aef637" lines={4} />
          <rect x={390} y={154} width={42} height={20} fill="#0a0a0a" />
          <text x={411} y={168} textAnchor="middle" fontSize="9" fontWeight="700" fontFamily={MONO} fill="#aef637">
            PDF
          </text>
        </g>
      </Float>
      <StepBadge cx={382} cy={74} n={3} />
      <TypingDots x={396} y={58} />
      <text x={410} y={196} textAnchor="middle" fontSize="10.5" fontWeight="600" fontFamily={SANS} fill="#525252">
        Get it written
      </text>

      <Chip x={28} y={212} width={118} text="Free to start" />
    </svg>
  );
}

/** Login story: 1 → sign in securely, 2 → your documents are waiting, 3 → keep going & download. */
function SigninDiagram() {
  return (
    <svg
      viewBox="0 0 480 250"
      role="img"
      aria-label="Sign in to find your saved documents waiting, edit them, and download them as PDFs"
      className="h-auto w-full"
    >
      <DiagramGrid />

      {/* flow paths */}
      <DottedPath d="M 136 120 H 202" animate />
      <DottedPath d="M 316 120 H 372" animate />
      <Packet path="M 136 120 H 202" dur="3s" />
      <Packet path="M 316 120 H 372" dur="3.4s" begin="1.2s" color="#c7bff4" />

      {/* 1 · sign in */}
      <Float delay={0.2}>
        <g>
          <rect x={28} y={34} width={136} height={42} fill="#ffffff" stroke="#d4d4d4" strokeWidth="1" />
          <rect x={28} y={34} width={136} height={4} fill="#aef637" />
          <text x={40} y={55} fontSize="10" fontWeight="600" fontFamily={SANS} fill="#404040">
            Sign in securely
          </text>
          <text x={40} y={68} fontSize="10" fontWeight="600" fontFamily={SANS} fill="#404040">
            and pick up where you left off
          </text>
        </g>
      </Float>
      <StepBadge cx={28} cy={34} n={1} />
      <Person x={86} y={132} scale={1.2} />
      <Lock x={116} y={112} size={20} />
      <text x={96} y={180} textAnchor="middle" fontSize="10.5" fontWeight="600" fontFamily={SANS} fill="#525252">
        You
      </text>

      {/* 2 · your documents waiting */}
      <Float alt delay={0.4}>
        <g>
          <rect x={212} y={70} width={60} height={76} fill="#fafafa" stroke="#d0d0d0" strokeWidth="1" />
          <rect x={306} y={84} width={7} height={62} fill="#eceafd" stroke="#dcd6f6" strokeWidth="1" />
          <rect x={316} y={92} width={6} height={54} fill="#e9f9d4" stroke="#d5eeb0" strokeWidth="1" />
          <DocPage x={220} y={78} width={60} height={78} accent="#aef637" lines={4} />
        </g>
      </Float>
      <StepBadge cx={212} cy={70} n={2} tone="accent" />
      <PulseDot cx={284} cy={78} r={3.5} delay={0.6} />
      <text x={260} y={180} textAnchor="middle" fontSize="10.5" fontWeight="600" fontFamily={SANS} fill="#525252">
        Your documents waiting
      </text>

      {/* 3 · keep going */}
      <Float delay={0.6}>
        <g>
          <DocPage x={388} y={74} width={56} height={74} accent="#aef637" lines={4} />
        </g>
      </Float>
      <StepBadge cx={388} cy={74} n={3} />
      <g>
        <path
          d="M 416 158 v 12 m 0 0 l -6 -7 m 6 7 l 6 -7"
          stroke="#0a0a0a"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 -3; 0 4; 0 -3"
          dur="2.2s"
          repeatCount="indefinite"
        />
      </g>
      <text x={416} y={196} textAnchor="middle" fontSize="10.5" fontWeight="600" fontFamily={SANS} fill="#525252">
        Download when ready
      </text>

      <Chip x={28} y={212} width={158} text="Everything stays saved" />
    </svg>
  );
}

const FEATURES = [
  "Templates that keep every document on brand",
  "A visual editor to tweak anything yourself",
  "One-click PDF export in A4",
];

interface AuthShellProps {
  variant: "signin" | "signup";
  title: string;
  lead: string;
  children: React.ReactNode;
}

/**
 * Light editorial auth layout matching the `/home` landing design: grid
 * guides, oversized heading, and a story diagram on the left; a bordered,
 * square form panel on the right. On mobile only the logo and the form
 * are shown so the fields stay front and center.
 */
export function AuthShell({ variant, title, lead, children }: AuthShellProps) {
  return (
    <div
      className="min-h-screen bg-white font-sans text-[#0a0a0a]"
      style={{ colorScheme: "light" }}
    >
      {/* top bar */}
      <header className="border-b border-[#e5e5e5]">
        <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-5 md:px-8 lg:px-10">
          <a
            href="/home"
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0a0a0a]"
          >
            <KloneWordmark />
          </a>
          <a
            href="/home"
            className="hidden items-center gap-2 text-[13px] font-medium text-[#525252] transition-colors duration-150 hover:text-[#0a0a0a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a] md:flex"
          >
            <ArrowLeft size={14} />
            Back to home
          </a>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-[1200px] px-5 md:px-8 lg:px-10">
        {/* visible grid guides */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="grid h-full grid-cols-12 gap-x-4 md:gap-x-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border-l border-[#ededed]" />
            ))}
          </div>
        </div>

        <main className="relative flex min-h-[calc(100vh-69px)] flex-col items-center justify-center gap-y-12 py-10 lg:grid lg:grid-cols-12 lg:items-stretch lg:justify-items-stretch lg:gap-x-16 lg:py-20">
          {/* Left editorial pane — hidden on mobile so only the logo and form show */}
          <section className="hidden lg:col-span-6 lg:block lg:pr-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#737373]">
              AI Document Studio
            </p>
            <h1 className="mt-5 text-[44px] font-bold leading-[0.98] tracking-tight text-[#0a0a0a] md:text-[56px]">
              {title}
            </h1>
            <p className="mt-5 max-w-[440px] text-[16px] leading-[1.65] text-[#525252]">
              {lead}
            </p>

            <ul className="mt-8 space-y-2.5">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-[14px] text-[#404040]">
                  <span className="h-1.5 w-1.5 shrink-0 bg-[#aef637]" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-10 hidden border border-[#e5e5e5] bg-[#fcfcfc] p-5 lg:block">
              {variant === "signup" ? <SignupDiagram /> : <SigninDiagram />}
            </div>

            <p className="mt-8 font-mono text-[11px] uppercase tracking-wide text-[#8a8a8a]">
              Templates · editor · one-click A4 export
            </p>
          </section>

          {/* Right form pane */}
          <section className="w-full lg:col-span-6">
            <div className="mx-auto w-full max-w-[460px] border border-[#e5e5e5] bg-white p-7 md:p-10">
              <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[#737373]">
                {variant === "signup" ? "Create account" : "Sign in"}
              </p>
              {children}

              {/* toggle between sign in and sign up */}
              <p className="mt-6 text-center text-[13px] text-[#525252]">
                {variant === "signup"
                  ? "Already have an account?"
                  : "Don\u2019t have an account yet?"}{" "}
                <a
                  href={variant === "signup" ? "/login" : "/register"}
                  className="font-medium text-[#0a0a0a] underline decoration-[#d4d4d4] underline-offset-2 transition-colors duration-150 hover:decoration-[#0a0a0a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
                >
                  {variant === "signup" ? "Sign in" : "Sign up"}
                </a>
              </p>

              <p className="mt-8 border-t border-[#f0f0f0] pt-5 text-[11.5px] leading-[1.7] text-[#8a8a8a]">
                By continuing, you agree to Klone&apos;s{" "}
                <a
                  href="#"
                  data-doc="Terms of Service"
                  className="underline decoration-[#d4d4d4] underline-offset-2 transition-colors duration-150 hover:text-[#0a0a0a]"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  data-doc="Privacy Policy"
                  className="underline decoration-[#d4d4d4] underline-offset-2 transition-colors duration-150 hover:text-[#0a0a0a]"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
