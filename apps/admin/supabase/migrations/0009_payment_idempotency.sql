-- Prevent duplicate payment rows for the same Dodo charge.
-- A subscription charge is reported by both `payment.*` and `subscription.*`
-- events; the webhook only writes a payment row from the `payment.*` event,
-- but this unique key is a defensive backstop against any future double
-- delivery (Dodo retries on non-2xx responses).
alter table public.payment
  add constraint payment_provider_reference_key
  unique (provider_reference);

-- Clean up the duplicate USD/INR rows created before this guard existed:
-- keep the USD row for each (payment_id, subscription_id) pair, drop the
-- local-currency duplicate. Safe to re-run (no-op if already clean).
delete from public.payment a
using public.payment b
where a.provider_reference = b.provider_reference
  and a.currency <> 'USD'
  and b.currency = 'USD'
  and a.subscription_id is not distinct from b.subscription_id;
