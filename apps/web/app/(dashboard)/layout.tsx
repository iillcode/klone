'use client';

import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPreview = pathname.startsWith('/preview/');
  const marginClass = isPreview ? 'ml-0' : 'ml-[280px]';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className={`${marginClass} h-screen transition-all duration-200`}>
          <div className="h-screen flex flex-col overflow-hidden bg-card">
          <main className="flex-1 min-h-0 overflow-y-auto custom-scroll">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
