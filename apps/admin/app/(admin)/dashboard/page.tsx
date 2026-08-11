import Link from "next/link";
import { verifySession } from "@/lib/auth";
import { getTemplates } from "@/lib/data";
import { buttonVariants } from "@repo/ui/button";

export default async function DashboardPage() {
  await verifySession();
  const templates = await getTemplates();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage Klone&apos;s templates and admin settings.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Templates
          </h2>
          <Link
            href="/dashboard/templates"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View all
          </Link>
        </div>
        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-semibold text-white">
              {templates.length}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              template{templates.length === 1 ? "" : "s"} in the library
            </p>
          </div>
          <Link
            href="/dashboard/templates/new"
            className={buttonVariants()}
          >
            + New template
          </Link>
        </div>
      </div>
    </div>
  );
}
