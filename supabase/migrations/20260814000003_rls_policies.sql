-- THALIQ RLS policies.
--
-- Critical rule (PRD section 51): Restaurant A must never be able to access
-- Restaurant B's data.
--
-- Two access paths exist:
--   1. Supabase Auth sessions — restaurant owners/managers signed in with
--      email/password or OTP. `auth.uid()` identifies them and policies
--      below scope every row to the restaurant(s) they belong to via
--      `restaurant_members`.
--   2. Restaurant staff (waiter/kitchen/cashier) sign in with a role + PIN
--      on a shared device, which is NOT a Supabase Auth session. Staff
--      requests are authenticated and authorized in the Next.js server
--      layer (Server Actions / Route Handlers) using the service role key,
--      after validating a signed staff-session cookie. The same is true for
--      customer-initiated writes (placing an order, requesting the bill,
--      submitting feedback) — the anon key is read-only for public menu
--      data; every write and every "give me my own order status" read goes
--      through a server-side handler that checks a table/order token
--      before touching the service-role client. This avoids relying on RLS
--      to express "only if you know this UUID", which Postgres row
--      security cannot do safely for anon/public roles.

-- ---------------------------------------------------------------------------
-- Helper functions (security definer to avoid RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function is_platform_admin()
returns boolean as $$
  select exists (
    select 1 from platform_admins where user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

create or replace function is_restaurant_member(target_restaurant_id uuid)
returns boolean as $$
  select exists (
    select 1 from restaurant_members
    where restaurant_id = target_restaurant_id and user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

create or replace function is_restaurant_manager(target_restaurant_id uuid)
returns boolean as $$
  select exists (
    select 1 from restaurant_members
    where restaurant_id = target_restaurant_id
      and user_id = auth.uid()
      and role in ('owner', 'manager')
  );
$$ language sql stable security definer set search_path = public;

create or replace function branch_restaurant_id(target_branch_id uuid)
returns uuid as $$
  select restaurant_id from branches where id = target_branch_id;
$$ language sql stable security definer set search_path = public;

create or replace function table_restaurant_id(target_table_id uuid)
returns uuid as $$
  select b.restaurant_id
  from restaurant_tables t
  join branches b on b.id = t.branch_id
  where t.id = target_table_id;
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table platform_admins enable row level security;
alter table restaurants enable row level security;
alter table branches enable row level security;
alter table restaurant_members enable row level security;
alter table staff enable row level security;
alter table restaurant_tables enable row level security;
alter table table_sessions enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table menu_variants enable row level security;
alter table menu_addons enable row level security;
alter table offers enable row level security;
alter table coupons enable row level security;
alter table combos enable row level security;
alter table combo_items enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table bills enable row level security;
alter table payments enable row level security;
alter table waiter_requests enable row level security;
alter table notifications enable row level security;
alter table staff_devices enable row level security;
alter table qr_codes enable row level security;
alter table templates enable row level security;
alter table restaurant_themes enable row level security;
alter table feedback enable row level security;
alter table loyalty_points enable row level security;
alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;
alter table transactions enable row level security;

-- ---------------------------------------------------------------------------
-- profiles / platform_admins
-- ---------------------------------------------------------------------------

create policy "profiles_select_own" on profiles for select
  using (id = auth.uid() or is_platform_admin());

create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());

create policy "platform_admins_select_self" on platform_admins for select
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- restaurants / branches
-- ---------------------------------------------------------------------------

create policy "restaurants_public_read" on restaurants for select
  using (status = 'active' or is_restaurant_member(id) or is_platform_admin());

-- Bootstrap case: a freshly signed-up owner has no restaurant_members row
-- yet, so is_restaurant_manager() cannot pass. Allow creating a restaurant
-- they immediately own; membership is granted right after (see the
-- restaurant_members bootstrap policy below).
create policy "restaurants_insert_self" on restaurants for insert
  with check (owner_id = auth.uid());

create policy "restaurants_member_update" on restaurants for update
  using (is_restaurant_manager(id) or is_platform_admin())
  with check (is_restaurant_manager(id) or is_platform_admin());

create policy "restaurants_member_delete" on restaurants for delete
  using (is_restaurant_manager(id) or is_platform_admin());

create policy "branches_public_read" on branches for select
  using (is_active or is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "branches_manager_manage" on branches for all
  using (is_restaurant_manager(restaurant_id) or is_platform_admin())
  with check (is_restaurant_manager(restaurant_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- restaurant_members / staff
-- ---------------------------------------------------------------------------

create policy "restaurant_members_select" on restaurant_members for select
  using (user_id = auth.uid() or is_restaurant_manager(restaurant_id) or is_platform_admin());

-- Bootstrap case: lets a user who just created a restaurant (restaurants.
-- owner_id = auth.uid()) grant themselves the 'owner' membership row. Every
-- subsequent invite (adding a manager, etc.) goes through the policy below
-- instead, once an owner/manager membership already exists.
create policy "restaurant_members_owner_bootstrap" on restaurant_members for insert
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "restaurant_members_manage" on restaurant_members for all
  using (is_restaurant_manager(restaurant_id) or is_platform_admin())
  with check (is_restaurant_manager(restaurant_id) or is_platform_admin());

create policy "staff_manager_manage" on staff for all
  using (is_restaurant_manager(restaurant_id) or is_platform_admin())
  with check (is_restaurant_manager(restaurant_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- tables / sessions (public read for QR resolution, member manage)
-- ---------------------------------------------------------------------------

create policy "restaurant_tables_public_read" on restaurant_tables for select
  using (true);

create policy "restaurant_tables_member_manage" on restaurant_tables for all
  using (is_restaurant_member(branch_restaurant_id(branch_id)) or is_platform_admin())
  with check (is_restaurant_member(branch_restaurant_id(branch_id)) or is_platform_admin());

create policy "table_sessions_member_read" on table_sessions for select
  using (is_restaurant_member(table_restaurant_id(table_id)) or is_platform_admin());

create policy "table_sessions_member_manage" on table_sessions for all
  using (is_restaurant_member(table_restaurant_id(table_id)) or is_platform_admin())
  with check (is_restaurant_member(table_restaurant_id(table_id)) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- menu (public read of available items, member manage)
-- ---------------------------------------------------------------------------

create policy "menu_categories_public_read" on menu_categories for select
  using (true);

create policy "menu_categories_member_manage" on menu_categories for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "menu_items_public_read" on menu_items for select
  using (true);

create policy "menu_items_member_manage" on menu_items for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "menu_variants_public_read" on menu_variants for select
  using (true);

create policy "menu_variants_member_manage" on menu_variants for all
  using (
    is_restaurant_member((select restaurant_id from menu_items where id = item_id))
    or is_platform_admin()
  )
  with check (
    is_restaurant_member((select restaurant_id from menu_items where id = item_id))
    or is_platform_admin()
  );

create policy "menu_addons_public_read" on menu_addons for select
  using (true);

create policy "menu_addons_member_manage" on menu_addons for all
  using (
    is_restaurant_member((select restaurant_id from menu_items where id = item_id))
    or is_platform_admin()
  )
  with check (
    is_restaurant_member((select restaurant_id from menu_items where id = item_id))
    or is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- offers, coupons, combos (public read of active offers, member manage)
-- ---------------------------------------------------------------------------

create policy "offers_public_read" on offers for select
  using (is_active);

create policy "offers_member_manage" on offers for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "coupons_member_only" on coupons for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "combos_public_read" on combos for select
  using (is_active);

create policy "combos_member_manage" on combos for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "combo_items_public_read" on combo_items for select
  using (true);

create policy "combo_items_member_manage" on combo_items for all
  using (
    is_restaurant_member((select restaurant_id from combos where id = combo_id))
    or is_platform_admin()
  )
  with check (
    is_restaurant_member((select restaurant_id from combos where id = combo_id))
    or is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- customers, orders, order_items, order_status_history — member only.
-- Customer-facing order placement and tracking go through server-side
-- handlers using the service role key (see comment at top of file).
-- ---------------------------------------------------------------------------

create policy "customers_member_only" on customers for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "orders_member_only" on orders for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "order_items_member_only" on order_items for all
  using (
    is_restaurant_member((select restaurant_id from orders where id = order_id))
    or is_platform_admin()
  )
  with check (
    is_restaurant_member((select restaurant_id from orders where id = order_id))
    or is_platform_admin()
  );

create policy "order_status_history_member_only" on order_status_history for all
  using (
    is_restaurant_member((select restaurant_id from orders where id = order_id))
    or is_platform_admin()
  )
  with check (
    is_restaurant_member((select restaurant_id from orders where id = order_id))
    or is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- bills, payments — member only
-- ---------------------------------------------------------------------------

create policy "bills_member_only" on bills for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "payments_member_only" on payments for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- waiter requests, notifications, staff devices — member only
-- ---------------------------------------------------------------------------

create policy "waiter_requests_member_only" on waiter_requests for all
  using (is_restaurant_member(branch_restaurant_id(branch_id)) or is_platform_admin())
  with check (is_restaurant_member(branch_restaurant_id(branch_id)) or is_platform_admin());

create policy "notifications_member_only" on notifications for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "staff_devices_own_or_manager" on staff_devices for all
  using (
    user_id = auth.uid()
    or is_platform_admin()
    or is_restaurant_manager((select restaurant_id from staff where id = staff_id))
  )
  with check (
    user_id = auth.uid()
    or is_platform_admin()
    or is_restaurant_manager((select restaurant_id from staff where id = staff_id))
  );

-- ---------------------------------------------------------------------------
-- qr_codes, templates, restaurant_themes
-- ---------------------------------------------------------------------------

create policy "qr_codes_member_only" on qr_codes for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "templates_public_read" on templates for select
  using (true);

create policy "templates_platform_admin_manage" on templates for insert
  with check (is_platform_admin());

create policy "templates_platform_admin_update" on templates for update
  using (is_platform_admin());

create policy "templates_platform_admin_delete" on templates for delete
  using (is_platform_admin());

create policy "restaurant_themes_public_read" on restaurant_themes for select
  using (true);

create policy "restaurant_themes_member_manage" on restaurant_themes for insert
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "restaurant_themes_member_update" on restaurant_themes for update
  using (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "restaurant_themes_member_delete" on restaurant_themes for delete
  using (is_restaurant_member(restaurant_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- feedback, loyalty
-- ---------------------------------------------------------------------------

create policy "feedback_member_only" on feedback for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

create policy "loyalty_points_member_only" on loyalty_points for all
  using (is_restaurant_member(restaurant_id) or is_platform_admin())
  with check (is_restaurant_member(restaurant_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- subscriptions / billing
-- ---------------------------------------------------------------------------

create policy "subscription_plans_public_read" on subscription_plans for select
  using (true);

create policy "subscription_plans_platform_admin_manage" on subscription_plans for insert
  with check (is_platform_admin());

create policy "subscription_plans_platform_admin_update" on subscription_plans for update
  using (is_platform_admin());

create policy "subscription_plans_platform_admin_delete" on subscription_plans for delete
  using (is_platform_admin());

create policy "subscriptions_owner_read" on subscriptions for select
  using (is_restaurant_manager(restaurant_id) or is_platform_admin());

create policy "subscriptions_platform_admin_manage" on subscriptions for insert
  with check (is_platform_admin());

create policy "subscriptions_platform_admin_update" on subscriptions for update
  using (is_platform_admin());

create policy "subscriptions_platform_admin_delete" on subscriptions for delete
  using (is_platform_admin());

create policy "transactions_owner_read" on transactions for select
  using (
    is_platform_admin()
    or is_restaurant_manager(
      (select restaurant_id from subscriptions where id = subscription_id)
    )
  );

create policy "transactions_platform_admin_manage" on transactions for insert
  with check (is_platform_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
--
-- RLS policies above are the real access-control boundary. These grants
-- just make the schema self-sufficient on any Postgres instance — a
-- hosted Supabase project already configures equivalent default privileges
-- for `anon`/`authenticated`/`service_role` on the public schema, but we
-- don't want migration correctness to depend on that being true.

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
