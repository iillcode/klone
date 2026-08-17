"use client";

/* Figma-style toolbar/action buttons (faithful port of the mock's controls). */

/* open-pencil icon-button (size-6, klone tokens: #353535/#888/#aef637) */
export function IconBtn({
  title,
  onClick,
  active = false,
  size = 16,
  className = "",
  children,
}: {
  title?: string;
  onClick?: () => void;
  active?: boolean;
  size?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`size-6 shrink-0 flex items-center justify-center rounded border border-transparent bg-transparent text-[#888888] outline-none transition-colors focus-visible:border-[#aef637] ${
        active
          ? "border-[#aef637] text-[#aef637]"
          : "hover:bg-[#353535] hover:text-[#f0f0f0]"
      } ${className}`}
    >
      <span style={{ width: size, height: size }} className="flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}

/* .btn-group — one joined group of 32x28 icon buttons */
export function BtnGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#1e1e1e] rounded-[6px] overflow-hidden mr-1.5 last:mr-0">
      {children}
    </div>
  );
}

/* .icon-btn.sq — 32x28 member of a btn-group */
export function SqBtn({
  title,
  onClick,
  active = false,
  children,
}: {
  title?: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`w-8 h-7 shrink-0 flex items-center justify-center transition-colors ${
        active
          ? "bg-[#2e2e2e] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "text-[#b8b8b8] hover:bg-[#262626] hover:text-[#ffffff]"
      }`}
    >
      {children}
    </button>
  );
}

/* .icon-btn.box — standalone 32x32 field-style button */
export function BoxBtn({
  title,
  onClick,
  active = false,
  children,
}: {
  title?: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-[6px] transition-colors ${
        active
          ? "bg-[#2e2e2e] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "bg-[#1e1e1e] text-[#b8b8b8] hover:bg-[#262626] hover:text-[#ffffff]"
      }`}
    >
      {children}
    </button>
  );
}

/* .icon-btn.wide — flex-1 32px option row (resizing) */
export function WideBtn({
  title,
  onClick,
  active = false,
  children,
}: {
  title?: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 h-8 min-w-0 flex items-center justify-center rounded-[6px] transition-colors ${
        active
          ? "bg-[#2e2e2e] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "bg-[#1e1e1e] text-[#9b9b9b] hover:bg-[#262626] hover:text-[#ffffff]"
      }`}
    >
      {children}
    </button>
  );
}
