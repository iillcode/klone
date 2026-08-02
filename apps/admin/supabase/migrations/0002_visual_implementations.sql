-- Visual implementations schema: user-saved HTML/CSS designs created via the MCP server
-- Pushed via: supabase db push --db-url "$DATABASE_URL"  (or paste into Supabase SQL Editor)

create table if not exists public.visual_implementations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  html_code text not null,
  css_code text,
  source_component_ids text[] default '{}',
  prompt_used text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visual_implementations_user_id_idx
  on public.visual_implementations (user_id);

-- Row Level Security: each user can only manage their own implementations.
alter table public.visual_implementations enable row level security;

drop policy if exists "users manage own visual implementations" on public.visual_implementations;
create policy "users manage own visual implementations"
  on public.visual_implementations for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
