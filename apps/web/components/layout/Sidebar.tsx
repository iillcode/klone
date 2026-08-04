'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Document } from '@/lib/types';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface SidebarProps {
  documents: Document[];
  overlay?: boolean;
}

export function Sidebar({ documents, overlay }: SidebarProps) {
  const router = useRouter();
  const [sidebarHover, setSidebarHover] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#22c55e] flex items-center justify-center">
            <span className="text-black font-bold text-sm">K</span>
          </div>
          <span className="text-base font-semibold text-sidebar-foreground">Klone</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 scrollbar-none">
        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Documents
        </div>
        {documents.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No documents yet. Pick a template to create one.
          </p>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => router.push(`/preview/${doc.id}`)}
                className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <div className="font-medium truncate text-sidebar-foreground">
                  {doc.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  Updated {new Date(doc.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 pb-3">
        <ThemeToggle />
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed left-0 top-0 h-screen z-30 pointer-events-none">
        <div
          className="absolute left-0 top-0 w-2 h-full z-40 pointer-events-auto"
          onMouseEnter={() => setSidebarHover(true)}
        />
        <div
          className={`w-[280px] pointer-events-auto h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out ${
            sidebarHover ? 'translate-x-0' : '-translate-x-full'
          }`}
          onMouseLeave={() => setSidebarHover(false)}
        >
          {sidebarContent}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 w-[280px] h-screen flex flex-col z-20 bg-sidebar border-r border-sidebar-border">
      {sidebarContent}
    </div>
  );
}
