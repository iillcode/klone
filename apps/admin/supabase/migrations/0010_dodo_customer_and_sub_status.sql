-- Support a dynamic Dodo customer-portal session (no email re-entry) and
-- surface live subscription state in the app.
--
-- 1. dodo_customer_id — Dodo's customer id (cus_...) for the user. Stored by
--    the dodo-webhook Edge Function so the web app can open a portal session
--    via client.customers.customerPortal.create(cus_...) instead of the
--    email-based static login link.
-- 2. subscription_status — mirrors the latest Dodo subscription state
--    (active / cancelled / on_hold / paused / expired / null). Lets the UI
--    show "Cancelled — reverts to Hobby on <date>" and drive the portal link
--    even when plan is still 'pro' during a paid period.

alter table public.users
  add column if not exists dodo_customer_id text;

alter table public.users
  add column if not exists subscription_status text
    check (
      subscription_status is null
      or subscription_status in (
        'active', 'cancelled', 'on_hold', 'paused', 'expired'
      )
    );

create index if not exists users_dodo_customer_id_idx
  on public.users (dodo_customer_id);

comment on column public.users.dodo_customer_id is
  'Dodo Payments customer id (cus_...). Used to open a dynamic portal session.';

comment on column public.users.subscription_status is
  'Mirrors the latest Dodo subscription state for the user''s Klone Pro plan.';

-- Backfill subscription_status from the most recent payment row that has a
-- subscription_id, so existing pro users (whose webhook fired before this
-- migration) show the correct portal state.
update public.users u
set subscription_status = 'active'
where u.plan = 'pro'
  and u.subscription_status is null
  and exists (
    select 1 from public.payment p
    where p.user_id = u.id
      and p.subscription_id is not null
      and p.status = 'succeeded'
  );
