import { TopBar } from '@/components/layout/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <div className="ml-[280px] p-2 h-screen">
          <div className="rounded-[6px] bg-[#0d0d0f] h-[calc(100vh-1rem)] flex flex-col overflow-hidden border border-white/5">
          <TopBar />
          <main className="flex-1 min-h-0 overflow-y-auto custom-scroll">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
