import { verifySession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <span className="text-sm font-semibold text-white">Klone Admin</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{session.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/5"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
