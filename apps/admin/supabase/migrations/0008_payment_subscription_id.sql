-- Track the Dodo subscription id on each payment row so we can tie
-- subscription lifecycle events (subscription.active / cancelled / expired)
-- back to the originating checkout. Nullable for one-off / top-up payments.

alter table public.payment
  add column if not exists subscription_id text;

create index if not exists payment_subscription_id_idx
  on public.payment (subscription_id);

comment on column public.payment.subscription_id is
  'Dodo subscription_id (sub_...) for subscription payments; null for one-off payments.';

-- ===========================================================================
-- Helper used by the dodo-webhook Edge Function.
-- Resolves the public.users.id for a customer email, matching either
-- public.users.email OR auth.users.email (the latter covers profiles whose
-- public email column is still null). Service-role only.
-- ===========================================================================

create or replace function public.resolve_user_by_email(p_email text)
returns table (user_id uuid)
language sql
security definer
set search_path = public
as $$
  select s.user_id
  from (
    select u.id as user_id, 1 as ord
    from public.users u
    where u.email = p_email
    union all
    select au.id as user_id, 2 as ord
    from auth.users au
    where au.email = p_email
      and not exists (select 1 from public.users u2 where u2.email = p_email)
  ) s
  order by s.ord
  limit 1;
$$;

revoke all on function public.resolve_user_by_email(text) from public;
grant execute on function public.resolve_user_by_email(text) to service_role;
