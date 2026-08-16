import { LandingContainer } from "./Section";

interface FictionalLogo {
  name: string;
  style: React.CSSProperties;
}

const LOGO_ROWS: FictionalLogo[][] = [
  [
    { name: "openvector", style: { fontFamily: "var(--font-geist-mono)" } },
    { name: "MERIDIAN", style: { letterSpacing: "0.2em", fontSize: "13px" } },
    { name: "Kestrel.ai", style: { fontWeight: 500 } },
    { name: "papertrail*", style: { fontFamily: "var(--font-geist-mono)" } },
    { name: "LATTICE", style: { letterSpacing: "0.24em", fontSize: "12px" } },
    { name: "Docsmith", style: {} },
  ],
  [
    { name: "formless_", style: { fontFamily: "var(--font-geist-mono)" } },
    { name: "ORBITAL", style: { letterSpacing: "0.18em", fontSize: "13px" } },
    { name: "Ledgerly", style: {} },
    { name: "quillbase", style: { fontFamily: "var(--font-geist-mono)" } },
    { name: "Foundry OS", style: {} },
    { name: "AXIOM", style: { letterSpacing: "0.2em", fontSize: "12px" } },
  ],
  [
    { name: "briefcase/", style: { fontFamily: "var(--font-geist-mono)" } },
    { name: "CALIBER", style: { letterSpacing: "0.22em", fontSize: "12px" } },
    { name: "Inkwell", style: {} },
    { name: "mono/report", style: { fontFamily: "var(--font-geist-mono)" } },
    { name: "Stratos", style: {} },
    { name: "NOCTURNE", style: { letterSpacing: "0.2em", fontSize: "12px" } },
  ],
];

/** Understated grayscale customer logo strip in a 3-row grid. */
export function LogoCloud() {
  return (
    <div className="border-t border-[#e5e5e5] bg-white">
      <LandingContainer>
        <div className="divide-y divide-[#f0f0f0] py-2">
          {LOGO_ROWS.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-2 items-center gap-y-4 py-5 sm:grid-cols-3 md:grid-cols-6"
            >
              {row.map((logo) => (
                <span
                  key={logo.name}
                  className="flex justify-center text-[15px] font-semibold tracking-tight text-[#a3a3a3] transition-colors duration-150 hover:text-[#404040]"
                  style={logo.style}
                >
                  {logo.name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </LandingContainer>
    </div>
  );
}
