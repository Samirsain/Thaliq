-- THALIQ core schema: extensions and enum types.

create extension if not exists "pgcrypto";

create type restaurant_role as enum (
  'owner',
  'manager',
  'waiter',
  'kitchen',
  'cashier'
);

create type restaurant_status as enum (
  'active',
  'suspended',
  'closed'
);

create type table_status as enum (
  'available',
  'occupied',
  'order_pending',
  'preparing',
  'ready',
  'bill_requested',
  'cleaning'
);

create type table_session_status as enum (
  'open',
  'bill_requested',
  'closed'
);

create type order_status as enum (
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
  'completed',
  'cancelled'
);

create type offer_type as enum (
  'percentage',
  'flat',
  'bogo',
  'combo',
  'happy_hour'
);

create type payment_method as enum (
  'cash',
  'upi',
  'card',
  'online'
);

create type payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded'
);

create type bill_status as enum (
  'open',
  'requested',
  'paid'
);

create type waiter_request_type as enum (
  'call_waiter',
  'water',
  'cutlery',
  'bill',
  'other'
);

create type notification_event as enum (
  'new_order',
  'waiter_request',
  'bill_request',
  'payment_received',
  'order_ready'
);

create type subscription_plan_tier as enum (
  'starter',
  'business',
  'pro'
);

create type subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired'
);
