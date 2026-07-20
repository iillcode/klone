'use client';

import { usePathname } from 'next/navigation';
import { ExternalIcon } from '../icons';
import { Button } from '@/components/ui/button';

function getTitle(pathname: string): string {
  if (pathname.startsWith('/themes')) return 'Themes';
  if (pathname.startsWith('/templates')) return 'Templates';
  if (pathname.startsWith('/components')) return 'Components';
  return 'Components';
}

export function TopBar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="h-[40px] flex items-center justify-between px-8 border-b border-white/5">
      {/* Left: page title */}
      <h1 className="text-[18px] font-semibold text-white">{title}</h1>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost">
          Pricing
          <ExternalIcon />
        </Button>
      </div>
    </header>
  );
}
