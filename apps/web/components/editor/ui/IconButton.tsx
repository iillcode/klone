"use client";

/* Figma-style toolbar/action buttons (faithful port of the mock's controls). */

/* .icon-btn (square, header actions) */
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
      className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-[6px] transition-colors ${
        active
          ? "bg-[#454545] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "text-[#b8b8b8] hover:bg-[#454545] hover:text-[#ffffff]"
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
    <div className="flex bg-[#3a3a3a] rounded-[6px] overflow-hidden mr-1.5 last:mr-0">
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
          ? "bg-[#454545] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "text-[#b8b8b8] hover:bg-[#454545] hover:text-[#ffffff]"
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
          ? "bg-[#454545] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "bg-[#3a3a3a] text-[#b8b8b8] hover:bg-[#454545] hover:text-[#ffffff]"
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
          ? "bg-[#454545] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "bg-[#3a3a3a] text-[#9b9b9b] hover:bg-[#454545] hover:text-[#ffffff]"
      }`}
    >
      {children}
    </button>
  );
}
