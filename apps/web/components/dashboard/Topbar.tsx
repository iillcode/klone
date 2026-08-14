/**
 * Top bar (56px) matching the reference dashboard shell: brand block on the
 * left (280px, aligned with the sidebar), followed by a "Templates" marker.
 */
export function Topbar() {
  return (
    <header className="relative z-50 flex h-11 flex-none items-stretch border-b border-[#2d2d2d]/60 bg-[#161617]">
      {/* Brand (same width as the sidebar) */}
      <div className="flex w-60 flex-none items-center gap-2.5 border-r border-[#2d2d2d] px-4">
        <div className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md bg-[#22c55e]">
          <span className="text-[11px] font-extrabold leading-none text-black">
            K
          </span>
        </div>
        <span className="text-base font-extrabold tracking-tight text-[#e4e4e7]">
          Klone
        </span>
      </div>

      {/* Template context marker — pinned to the right, big icon + small label */}
      <button
        type="button"
        onClick={() => {
          document
            .getElementById("templates-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
        aria-label="Go to templates"
        className="group ml-auto flex flex-col items-center justify-center gap-0.5 px-4 text-[#a1a1aa] transition-colors hover:text-[#e4e4e7]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width="100"
          height="100"
          className="h-5 w-5 text-[#a1a1aa] transition-colors group-hover:text-[#e4e4e7]"
          aria-hidden="true"
        >
          <defs>
            {/* Glass gradient — inherits the icon color via currentColor */}
            <linearGradient
              id="library-glass"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>

            {/* Clip path covering all books and shelf */}
            <clipPath id="library-clip">
              <rect x="10" y="72" width="80" height="6" rx="2" />
              <rect x="16" y="22" width="18" height="50" rx="2" />
              <rect x="38" y="16" width="20" height="56" rx="2" />
              <rect x="62" y="26" width="16" height="46" rx="2" />
            </clipPath>
          </defs>

          {/* Shelf Base */}
          <rect
            x="10"
            y="72"
            width="80"
            height="6"
            rx="2"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="1.5"
          />

          {/* Book 1 (Left - Medium) */}
          <rect
            x="16"
            y="22"
            width="18"
            height="50"
            rx="2"
            fill="currentColor"
            fillOpacity="0.35"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="20"
            y="30"
            width="10"
            height="3"
            rx="1"
            fill="currentColor"
            opacity="0.7"
          />
          <rect
            x="20"
            y="60"
            width="10"
            height="3"
            rx="1"
            fill="currentColor"
            opacity="0.7"
          />

          {/* Book 2 (Center - Tallest, most solid) */}
          <rect
            x="38"
            y="16"
            width="20"
            height="56"
            rx="2"
            fill="currentColor"
            fillOpacity="0.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="42"
            y="24"
            width="12"
            height="3"
            rx="1"
            fill="currentColor"
            opacity="0.8"
          />
          <rect
            x="42"
            y="32"
            width="12"
            height="3"
            rx="1"
            fill="currentColor"
            opacity="0.6"
          />
          <rect
            x="42"
            y="62"
            width="12"
            height="3"
            rx="1"
            fill="currentColor"
            opacity="0.7"
          />

          {/* Book 3 (Right - Shortest, lightest) */}
          <rect
            x="62"
            y="26"
            width="16"
            height="46"
            rx="2"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="66"
            y="34"
            width="8"
            height="3"
            rx="1"
            fill="currentColor"
            opacity="0.7"
          />
          <rect
            x="66"
            y="58"
            width="8"
            height="3"
            rx="1"
            fill="currentColor"
            opacity="0.7"
          />

          {/* Animated Glass Glaze */}
          <g clipPath="url(#library-clip)">
            <rect
              x="-100"
              y="-20"
              width="60"
              height="140"
              fill="url(#library-glass)"
              transform="skewX(-20)"
            >
              <animate
                attributeName="x"
                values="-100; 160; 160"
                keyTimes="0; 0.5; 1"
                dur="3.8s"
                repeatCount="indefinite"
              />
            </rect>
          </g>
        </svg>
        <span className="text-[10px] font-medium leading-none text-[#a1a1aa] transition-colors group-hover:text-[#e4e4e7]">
          Templates
        </span>
      </button>
    </header>
  );
}
