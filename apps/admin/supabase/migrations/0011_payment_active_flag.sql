-- Flag the currently-active subscription payment so the app can show which
-- payment/subscription is live (true) vs cancelled/expired (false).
-- Defaults to true for historical rows (they were the active charge at insert).

alter table public.payment
  add column if not exists active boolean not null default true;

create index if not exists payment_active_idx
  on public.payment (user_id, active);

comment on column public.payment.active is
  'True while the subscription tied to this payment is active; set false when Dodo reports cancellation/expiry.';
