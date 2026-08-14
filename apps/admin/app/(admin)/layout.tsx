import { verifySession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground antialiased">
      <AdminSidebar email={session.email} />

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 flex-none items-center gap-3 border-b border-border bg-background px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-4"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-foreground">
              Admin console
            </span>
          </div>

          <form action={logout} className="ml-auto">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign out
            </button>
          </form>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-6 [scrollbar-color:#3f3f46_#161617] [scrollbar-width:thin]">
          {children}
        </main>
      </div>
    </div>
  );
}
