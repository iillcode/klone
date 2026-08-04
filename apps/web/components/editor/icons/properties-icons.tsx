/* SVG icons for the properties panel (Figma-style controls).
   Extracted from the original monolithic PropertiesSidebar so each icon is
   a small, reusable, self-contained component. */

export function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}
export function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </svg>
  );
}
export function EyeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
      <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
export function DropletIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
      <path d="M8 1.5S3.5 6.8 3.5 10a4.5 4.5 0 009 0C12.5 6.8 8 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
export function MoreDotsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
      <circle cx="4.5" cy="4" r="1.1" fill="currentColor" />
      <circle cx="11.5" cy="4" r="1.1" fill="currentColor" />
      <circle cx="4.5" cy="8" r="1.1" fill="currentColor" />
      <circle cx="11.5" cy="8" r="1.1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.1" fill="currentColor" />
      <circle cx="11.5" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function AlignLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="6" width="10" height="3.2" rx="0.8" fill="currentColor" />
      <rect x="8" y="14.8" width="6" height="3.2" rx="0.8" fill="currentColor" />
    </svg>
  );
}
export function AlignCenterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="6" width="12" height="3.2" rx="0.8" fill="currentColor" />
      <rect x="8" y="14.8" width="8" height="3.2" rx="0.8" fill="currentColor" />
    </svg>
  );
}
export function AlignRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="6" width="10" height="3.2" rx="0.8" fill="currentColor" />
      <rect x="10" y="14.8" width="6" height="3.2" rx="0.8" fill="currentColor" />
    </svg>
  );
}
export function AlignTopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="4" y1="5" x2="20" y2="5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="8" width="3.2" height="10" rx="0.8" fill="currentColor" />
      <rect x="14.8" y="8" width="3.2" height="6" rx="0.8" fill="currentColor" />
    </svg>
  );
}
export function AlignMiddleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="6" width="3.2" height="12" rx="0.8" fill="currentColor" />
      <rect x="14.8" y="8" width="3.2" height="8" rx="0.8" fill="currentColor" />
    </svg>
  );
}
export function AlignBottomIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="4" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="6" width="3.2" height="10" rx="0.8" fill="currentColor" />
      <rect x="14.8" y="10" width="3.2" height="6" rx="0.8" fill="currentColor" />
    </svg>
  );
}

export function ConstraintsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <line x1="3" y1="1" x2="3" y2="2.2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="1" x2="13" y2="2.2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="3" y1="13.8" x2="3" y2="15" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="13.8" x2="13" y2="15" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
export function ConstrainIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 9L4.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 7l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function RotateIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
      <path d="M3 8a5 5 0 019-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 2.5v2.7h-2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function FlipHIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2" />
      <path d="M9 8L6 12l3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function FlipVIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2" />
      <path d="M8 9L12 6l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15l4 3 4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function CornersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path d="M6 10V7a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 10V7a1 1 0 00-1-1h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 14v3a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 14v3a1 1 0 01-1 1h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ResizeWIcon() {
  return (
    <svg viewBox="0 0 32 20" width="30" height="18" fill="none">
      <line x1="4" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="1.4" />
      <line x1="28" y1="4" x2="28" y2="16" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 10h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 7l-3 3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 7l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function ResizeHIcon() {
  return (
    <svg viewBox="0 0 32 20" width="30" height="18" fill="none">
      <rect x="6" y="3" width="20" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.2" />
      <line x1="22" y1="3" x2="22" y2="17" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
export function ResizeAutoIcon() {
  return (
    <svg viewBox="0 0 32 20" width="30" height="18" fill="none">
      <rect x="4" y="2" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <line x1="8" y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="10" x2="24" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function RadiusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
      <path d="M2 10V5a3 3 0 013-3h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function LineHeightIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
      <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function LetterSpacingIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
      <path d="M2 4v8M14 4v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
      <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function TextAlignIcon({ align }: { align: "left" | "center" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      {align === "left" && (
        <>
          <line x1="5" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="5" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="5" y1="16" x2="17" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {align === "center" && (
        <>
          <line x1="5" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="7" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="6" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {align === "right" && (
        <>
          <line x1="5" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="10" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="7" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
export function DeleteIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
      <path
        d="M3 4.5h10M6.5 4.5V3.2A1.2 1.2 0 017.7 2h.6a1.2 1.2 0 011.2 1.2v1.3M5 4.5l.5 8a1.2 1.2 0 001.2 1.1h2.6a1.2 1.2 0 001.2-1.1l.5-8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
