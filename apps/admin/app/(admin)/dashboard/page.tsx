import Link from "next/link";
import { verifySession } from "@/lib/auth";
import { getTemplates } from "@/lib/data";
import { buttonVariants } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Library, Plus, LayoutTemplate } from "lucide-react";

export default async function DashboardPage() {
  await verifySession();
  const templates = await getTemplates();
  const active = templates.filter((t) => t.is_active).length;
  const recent = templates.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage Klone&apos;s templates and admin settings.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Library className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Templates
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {templates.length}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            in the library
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutTemplate className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Active
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {active}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            currently published
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plus className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Create
            </span>
          </div>
          <Link
            href="/dashboard/templates/new"
            className={buttonVariants({ className: "mt-4 w-full" })}
          >
            <Plus className="size-4" />
            New template
          </Link>
        </div>
      </div>

      {/* Recent templates */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Recent templates
          </h2>
          <Link
            href="/dashboard/templates"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              No templates yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first template to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dashboard/templates/${t.id}`}
                  className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="grid size-9 flex-none place-items-center rounded-lg bg-muted text-muted-foreground">
                    <LayoutTemplate className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {t.name}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {t.slug}
                    </p>
                  </div>
                  {t.category ? (
                    <Badge variant="secondary">{t.category}</Badge>
                  ) : null}
                  {t.is_active ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
