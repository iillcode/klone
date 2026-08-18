-- Add a `generations` table recording every editor Save.
--
-- Each click of the editor's Save button stores a snapshot of the document
-- (title, full canvas HTML, linked template + document). This keeps the
-- user's save history and makes the saved content directly queryable from
-- the database, not only inside visual_implementations.
--
-- Pushed via: supabase db push --db-url "$DATABASE_URL"  (or paste into Supabase SQL Editor)

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  document_id uuid references public.visual_implementations (id) on delete set null,
  template_id uuid references public.pdf_templates (id) on delete set null,
  title text not null default 'Untitled',
  html_code text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.generations is
  'One row per editor Save click: a snapshot of the document the user saved (title + full HTML), linked to its document row and source template.';

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);
create index if not exists generations_document_id_idx
  on public.generations (document_id);

alter table public.generations enable row level security;

drop policy if exists "generations select own" on public.generations;
create policy "generations select own"
  on public.generations for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "generations insert own" on public.generations;
create policy "generations insert own"
  on public.generations for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "generations update own" on public.generations;
create policy "generations update own"
  on public.generations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "generations delete own" on public.generations;
create policy "generations delete own"
  on public.generations for delete to authenticated
  using (user_id = auth.uid());
