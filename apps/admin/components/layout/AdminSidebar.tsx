"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Library, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/templates", label: "Templates", icon: Library },
  {
    href: "/dashboard/templates/new",
    label: "New template",
    icon: Plus,
  },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const initials = (email.split("@")[0] || "A").slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-full w-60 flex-none flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 flex-none items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="grid size-[26px] place-items-center rounded-md bg-[#22c55e]">
          <span className="text-[12px] font-extrabold leading-none text-black">
            K
          </span>
        </div>
        <span className="text-[15px] font-bold tracking-tight text-foreground">
          Klone
        </span>
        <span className="ml-auto rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 space-y-6 overflow-y-auto px-3 py-4 [scrollbar-color:#3f3f46_#161617] [scrollbar-width:thin]">
        <div>
          <p className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <div className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Resources
          </p>
          <div className="space-y-1">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
            >
              <BookOpen className="size-4 text-muted-foreground" />
              Documentation
            </a>
          </div>
        </div>
      </nav>

      {/* Account */}
      <div className="flex-none border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-2.5">
          <span className="grid size-8 flex-none place-items-center rounded-full bg-[#16245a] text-[11px] font-bold text-[#8fb3ff]">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {email}
            </p>
            <p className="truncate text-[11.5px] text-muted-foreground">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
