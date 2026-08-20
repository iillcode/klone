-- Dodo Payments webhook event log (idempotency + audit trail).
-- The Dodo webhook is processed by a Supabase Edge Function
-- (supabase/functions/dodo-webhook) which writes entitlements to
-- public.users / public.payment. This table prevents duplicate
-- processing of the same webhook-id and keeps a full audit trail.

create table if not exists public.dodo_webhook_events (
  id uuid primary key default gen_random_uuid(),
  webhook_id text unique,
  event_type text not null,
  data jsonb not null,
  processed boolean not null default false,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0
);

create index if not exists idx_dodo_webhook_events_processed
  on public.dodo_webhook_events (processed, created_at);
create index if not exists idx_dodo_webhook_events_webhook_id
  on public.dodo_webhook_events (webhook_id);

comment on table public.dodo_webhook_events is
  'Audit log of Dodo Payments webhook deliveries processed by the edge function.';

alter table public.dodo_webhook_events enable row level security;

-- Service role (edge function) bypasses RLS; no anon/client policies needed.
drop policy if exists "dodo_webhook_events service only" on public.dodo_webhook_events;
create policy "dodo_webhook_events service only"
  on public.dodo_webhook_events for all to service_role
  using (true) with check (true);
