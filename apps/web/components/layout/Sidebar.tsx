'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { ComponentsIcon, SearchIcon, TemplatesIcon, ThemeIcon } from '@/components/icons';

type NavChild = { id: string; label: string };
type NavItem = { id: string; label: string; children: NavChild[] };

const tabs = [
  { id: 'components', label: 'Components', icon: ComponentsIcon },
  { id: 'themes', label: 'Themes', icon: ThemeIcon },
  { id: 'templates', label: 'Templates', icon: TemplatesIcon },
] as const;

const navItems: NavItem[] = [
  {
    id: 'components',
    label: 'Components',
    children: [
      { id: 'all', label: 'All Components' },
      { id: 'ui', label: 'UI' },
      { id: 'marketing', label: 'Marketing' },
      { id: 'effects', label: 'Effects' },
    ],
  },
  {
    id: 'themes',
    label: 'Themes',
    children: [
      { id: 'all', label: 'All Themes' },
      { id: 'dark', label: 'Dark' },
      { id: 'light', label: 'Light' },
      { id: 'colorful', label: 'Colorful' },
    ],
  },
  {
    id: 'templates',
    label: 'Templates',
    children: [
      { id: 'all', label: 'All Templates' },
      { id: 'landing', label: 'Landing' },
      { id: 'portfolio', label: 'Portfolio' },
      { id: 'blog', label: 'Blog' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] box-content bg-[#070708] z-40 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-white">DevLibrary</span>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = pathname === `/${id}` || pathname.startsWith(`/${id}/`);
            return (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => router.push(`/${id}`)}
                className={`flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-[13px] transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {active && <span className="truncate">{label}</span>}
              </button>
            );
          })}

          <div className="relative ml-1 flex min-w-0 flex-1 items-center">
            <SearchIcon className="w-4 h-4 absolute left-2 text-zinc-500 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search"
              className="h-8 w-full rounded-md border-0 bg-white/5 pl-7 text-[13px] text-white placeholder:text-zinc-500 focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {navItems
          .filter((item) => pathname === `/${item.id}` || pathname.startsWith(`/${item.id}/`))
          .map((item) => (
            <div key={item.id}>
              <div className="space-y-0.5 px-0">
                {item.children.map((child) => {
                  const href = `/${item.id}/${child.id}`;
                  const childActive = pathname === href;
                  return (
                    <Link
                      key={child.id}
                      href={href}
                      className={`block w-full text-left px-3 py-1.5 rounded-md text-[14px] transition-colors ${
                        childActive
                          ? 'text-white font-medium'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
      </nav>
    </aside>
  );
}
