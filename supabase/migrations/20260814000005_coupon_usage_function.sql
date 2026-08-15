-- Atomic coupon usage increment, called from the order-placement server
-- action via the service-role client (customers never touch this table
-- directly).

create or replace function increment_coupon_usage(p_coupon_id uuid)
returns void as $$
  update coupons set times_used = times_used + 1 where id = p_coupon_id;
$$ language sql security definer set search_path = public;

grant execute on function increment_coupon_usage(uuid) to service_role;
