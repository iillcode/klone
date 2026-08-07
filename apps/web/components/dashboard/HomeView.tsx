'use client';

import { useState } from 'react';
import type { Document } from '@/lib/types';
import type { UserProfile } from '@/lib/data/users';
import { Topbar } from '@/components/dashboard/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LandingCards } from '@/components/landing/LandingCards';

interface HomeViewProps {
  documents: Document[];
  profile: UserProfile | null;
}

/**
 * Dashboard home shell — a faithful adaptation of the reference dashboard
 * layout for Klone: a 56px top bar, a 280px sidebar (search, nav, template
 * shortcuts, MCP promo, account → settings) and scrollable content sections
 * listing the user's documents and the starter templates.
 */
export function HomeView({ documents, profile }: HomeViewProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="flex h-full flex-col bg-[#161617] font-sans text-[#e4e4e7] antialiased">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar documents={documents} query={query} onQueryChange={setQuery} profile={profile} />
        <main className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:#3f3f46_#161617] [scrollbar-width:thin]">
          <LandingCards documents={documents} query={query} />
        </main>
      </div>
    </div>
  );
}
