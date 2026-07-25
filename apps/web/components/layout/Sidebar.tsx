'use client';

import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] box-content bg-[#070708] z-40 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-white">DevLibrary</span>
        </div>
      </div>
    </aside>
  );
}