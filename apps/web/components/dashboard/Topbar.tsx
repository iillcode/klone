/**
 * Top bar (56px) matching the reference dashboard shell: brand block on the
 * left (280px, aligned with the sidebar).
 */
export function Topbar() {
  return (
    <header className="relative z-50 flex h-11 flex-none items-stretch border-b border-[#2d2d2d]/60 bg-[#161617]">
      {/* Brand (same width as the sidebar) */}
      <div className="flex w-60 flex-none items-center gap-2.5 border-r border-[#2d2d2d] px-4">
        <div className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md bg-[#22c55e]">
          <span className="text-[11px] font-extrabold leading-none text-black">K</span>
        </div>
        <span className="text-base font-extrabold tracking-tight text-[#e4e4e7]">Klone</span>
      </div>
    </header>
  );
}
