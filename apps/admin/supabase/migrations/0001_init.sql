-- Admin content schema: categories -> sub_categories -> components
-- Pushed via: supabase db push --db-url "$DATABASE_URL"  (or paste into Supabase SQL Editor)

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.sub_categories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);

create table if not exists public.components (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  sub_category_id uuid not null references public.sub_categories (id) on delete restrict,
  component_code text not null,
  demo_url text,
  prompt text,
  chain_id uuid references public.components (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists sub_categories_category_id_idx
  on public.sub_categories (category_id);
create index if not exists components_sub_category_id_idx
  on public.components (sub_category_id);
create index if not exists components_chain_id_idx
  on public.components (chain_id);

-- Row Level Security: authenticated (admin) users get full access.
alter table public.categories enable row level security;
alter table public.sub_categories enable row level security;
alter table public.components enable row level security;

drop policy if exists "authenticated full access categories" on public.categories;
create policy "authenticated full access categories"
  on public.categories for all to authenticated
  using (true) with check (true);

drop policy if exists "authenticated full access sub_categories" on public.sub_categories;
create policy "authenticated full access sub_categories"
  on public.sub_categories for all to authenticated
  using (true) with check (true);

drop policy if exists "authenticated full access components" on public.components;
create policy "authenticated full access components"
  on public.components for all to authenticated
  using (true) with check (true);

-- Starter data (matches the public gallery's nav). Safe to edit/delete later.
insert into public.categories (name, slug) values
  ('Components', 'components'),
  ('Templates', 'templates'),
  ('Themes', 'themes')
on conflict (slug) do nothing;

insert into public.sub_categories (category_id, name, slug) values
  ((select id from public.categories where slug = 'components'), 'UI', 'ui'),
  ((select id from public.categories where slug = 'components'), 'Marketing', 'marketing'),
  ((select id from public.categories where slug = 'components'), 'Effects', 'effects'),
  ((select id from public.categories where slug = 'templates'), 'Landing', 'landing'),
  ((select id from public.categories where slug = 'templates'), 'Portfolio', 'portfolio'),
  ((select id from public.categories where slug = 'templates'), 'Blog', 'blog'),
  ((select id from public.categories where slug = 'themes'), 'Dark', 'dark'),
  ((select id from public.categories where slug = 'themes'), 'Light', 'light'),
  ((select id from public.categories where slug = 'themes'), 'Colorful', 'colorful')
on conflict (category_id, slug) do nothing;
