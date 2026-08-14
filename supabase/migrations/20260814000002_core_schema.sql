-- THALIQ core schema: tables.
--
-- Auth is handled by Supabase (auth.users). `profiles` mirrors the subset of
-- user data THALIQ needs and is kept in sync via the trigger at the bottom
-- of this file.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Platform / identity
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Platform (THALIQ) staff — separate from restaurant staff.
create table platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Restaurants, branches, membership
-- ---------------------------------------------------------------------------

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete restrict,
  slug text not null unique,
  name text not null,
  logo_url text,
  cover_image_url text,
  description text,
  phone text,
  website text,
  instagram text,
  cuisine_type text,
  tax_percent numeric(5, 2) not null default 0,
  service_charge_percent numeric(5, 2) not null default 0,
  status restaurant_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger restaurants_set_updated_at
  before update on restaurants
  for each row execute function set_updated_at();

create index restaurants_owner_id_idx on restaurants (owner_id);

create table branches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  slug text not null,
  name text not null,
  address text,
  city text,
  opens_at time,
  closes_at time,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create trigger branches_set_updated_at
  before update on branches
  for each row execute function set_updated_at();

create index branches_restaurant_id_idx on branches (restaurant_id);

-- Owners/managers who sign in with Supabase Auth (email/password or OTP).
create table restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role restaurant_role not null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create index restaurant_members_user_id_idx on restaurant_members (user_id);
create index restaurant_members_restaurant_id_idx on restaurant_members (restaurant_id);

-- Restaurant staff who sign in with a role + PIN on a shared branch device.
create table staff (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  branch_id uuid references branches (id) on delete set null,
  name text not null,
  phone text,
  role restaurant_role not null,
  pin_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger staff_set_updated_at
  before update on staff
  for each row execute function set_updated_at();

create index staff_restaurant_id_idx on staff (restaurant_id);
create index staff_branch_id_idx on staff (branch_id);

-- ---------------------------------------------------------------------------
-- Tables & sessions
-- ---------------------------------------------------------------------------

create table restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches (id) on delete cascade,
  label text not null,
  status table_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, label)
);

create trigger restaurant_tables_set_updated_at
  before update on restaurant_tables
  for each row execute function set_updated_at();

create index restaurant_tables_branch_id_idx on restaurant_tables (branch_id);

create table table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references restaurant_tables (id) on delete cascade,
  status table_session_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create index table_sessions_table_id_idx on table_sessions (table_id);
create index table_sessions_open_idx on table_sessions (table_id) where status <> 'closed';

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger menu_categories_set_updated_at
  before update on menu_categories
  for each row execute function set_updated_at();

create index menu_categories_restaurant_id_idx on menu_categories (restaurant_id);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  category_id uuid not null references menu_categories (id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  base_price numeric(10, 2) not null,
  is_veg boolean not null default true,
  is_bestseller boolean not null default false,
  is_recommended boolean not null default false,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger menu_items_set_updated_at
  before update on menu_items
  for each row execute function set_updated_at();

create index menu_items_restaurant_id_idx on menu_items (restaurant_id);
create index menu_items_category_id_idx on menu_items (category_id);

create table menu_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references menu_items (id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null,
  is_default boolean not null default false,
  sort_order integer not null default 0
);

create index menu_variants_item_id_idx on menu_variants (item_id);

create table menu_addons (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references menu_items (id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null,
  sort_order integer not null default 0
);

create index menu_addons_item_id_idx on menu_addons (item_id);

-- ---------------------------------------------------------------------------
-- Offers, coupons, combos
-- ---------------------------------------------------------------------------

create table offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name text not null,
  type offer_type not null,
  percentage_value numeric(5, 2),
  flat_value numeric(10, 2),
  starts_on date,
  ends_on date,
  starts_at time,
  ends_at time,
  days_of_week smallint[],
  min_order_value numeric(10, 2),
  max_discount_value numeric(10, 2),
  category_ids uuid[],
  item_ids uuid[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger offers_set_updated_at
  before update on offers
  for each row execute function set_updated_at();

create index offers_restaurant_id_idx on offers (restaurant_id);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  offer_id uuid references offers (id) on delete cascade,
  code text not null,
  usage_limit integer,
  times_used integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (restaurant_id, code)
);

create index coupons_restaurant_id_idx on coupons (restaurant_id);

create table combos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index combos_restaurant_id_idx on combos (restaurant_id);

create table combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references combos (id) on delete cascade,
  item_id uuid not null references menu_items (id) on delete cascade,
  quantity integer not null default 1
);

create index combo_items_combo_id_idx on combo_items (combo_id);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

create table customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  unique (restaurant_id, phone)
);

create index customers_restaurant_id_idx on customers (restaurant_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  branch_id uuid not null references branches (id) on delete cascade,
  table_session_id uuid references table_sessions (id) on delete set null,
  customer_id uuid references customers (id) on delete set null,
  status order_status not null default 'pending',
  subtotal numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  tax_amount numeric(10, 2) not null default 0,
  service_charge_amount numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  coupon_id uuid references coupons (id) on delete set null,
  special_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create index orders_restaurant_id_idx on orders (restaurant_id);
create index orders_branch_id_idx on orders (branch_id);
create index orders_table_session_id_idx on orders (table_session_id);
create index orders_status_idx on orders (restaurant_id, status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  item_id uuid not null references menu_items (id) on delete restrict,
  variant_id uuid references menu_variants (id) on delete set null,
  item_name text not null,
  variant_name text,
  unit_price numeric(10, 2) not null,
  quantity integer not null default 1,
  addon_selection jsonb not null default '[]'::jsonb,
  special_instructions text,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on order_items (order_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  status order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_by_staff_id uuid references staff (id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on order_status_history (order_id);

-- ---------------------------------------------------------------------------
-- Bills, payments
-- ---------------------------------------------------------------------------

create table bills (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  branch_id uuid not null references branches (id) on delete cascade,
  table_session_id uuid not null references table_sessions (id) on delete cascade,
  status bill_status not null default 'open',
  total_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index bills_table_session_id_idx on bills (table_session_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  bill_id uuid references bills (id) on delete set null,
  order_id uuid references orders (id) on delete set null,
  method payment_method not null,
  status payment_status not null default 'pending',
  amount numeric(10, 2) not null,
  recorded_by uuid references auth.users (id) on delete set null,
  recorded_by_staff_id uuid references staff (id) on delete set null,
  created_at timestamptz not null default now()
);

create index payments_restaurant_id_idx on payments (restaurant_id);
create index payments_bill_id_idx on payments (bill_id);

-- ---------------------------------------------------------------------------
-- Waiter requests, notifications, staff devices
-- ---------------------------------------------------------------------------

create table waiter_requests (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches (id) on delete cascade,
  table_id uuid not null references restaurant_tables (id) on delete cascade,
  type waiter_request_type not null,
  note text,
  resolved_at timestamptz,
  resolved_by_staff_id uuid references staff (id) on delete set null,
  created_at timestamptz not null default now()
);

create index waiter_requests_branch_id_idx on waiter_requests (branch_id);
create index waiter_requests_open_idx on waiter_requests (branch_id) where resolved_at is null;

create table notifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  branch_id uuid references branches (id) on delete cascade,
  event notification_event not null,
  title text not null,
  body text,
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_restaurant_id_idx on notifications (restaurant_id);
create index notifications_unread_idx on notifications (restaurant_id) where read_at is null;

create table staff_devices (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  push_subscription jsonb not null,
  created_at timestamptz not null default now(),
  check (staff_id is not null or user_id is not null)
);

create index staff_devices_staff_id_idx on staff_devices (staff_id);
create index staff_devices_user_id_idx on staff_devices (user_id);

-- ---------------------------------------------------------------------------
-- QR codes, templates, branding
-- ---------------------------------------------------------------------------

create table qr_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  branch_id uuid references branches (id) on delete cascade,
  table_id uuid references restaurant_tables (id) on delete cascade,
  label text not null,
  target_url text not null,
  created_at timestamptz not null default now()
);

create index qr_codes_restaurant_id_idx on qr_codes (restaurant_id);

create table templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_premium boolean not null default false,
  preview_image_url text
);

create table restaurant_themes (
  restaurant_id uuid primary key references restaurants (id) on delete cascade,
  template_id uuid references templates (id) on delete set null,
  primary_color text,
  secondary_color text,
  font_family text,
  updated_at timestamptz not null default now()
);

create trigger restaurant_themes_set_updated_at
  before update on restaurant_themes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Feedback, loyalty
-- ---------------------------------------------------------------------------

create table feedback (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  order_id uuid references orders (id) on delete set null,
  food_rating smallint check (food_rating between 1 and 5),
  service_rating smallint check (service_rating between 1 and 5),
  experience_rating smallint check (experience_rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index feedback_restaurant_id_idx on feedback (restaurant_id);

create table loyalty_points (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  points integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (restaurant_id, customer_id)
);

-- ---------------------------------------------------------------------------
-- Subscriptions (SaaS billing)
-- ---------------------------------------------------------------------------

create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  tier subscription_plan_tier not null unique,
  name text not null,
  monthly_price numeric(10, 2) not null,
  max_branches integer,
  max_staff integer,
  features jsonb not null default '{}'::jsonb
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  plan_id uuid not null references subscription_plans (id) on delete restrict,
  status subscription_status not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

create index subscriptions_restaurant_id_idx on subscriptions (restaurant_id);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions (id) on delete cascade,
  amount numeric(10, 2) not null,
  status payment_status not null default 'pending',
  provider_reference text,
  created_at timestamptz not null default now()
);

create index transactions_subscription_id_idx on transactions (subscription_id);

-- ---------------------------------------------------------------------------
-- Keep profiles in sync with auth.users
-- ---------------------------------------------------------------------------

create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
