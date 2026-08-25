# THALIQ

> One QR. Your entire restaurant connected.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%7C%20Auth%20%7C%20Storage-3ECF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

THALIQ is a QR-first restaurant operating system: digital menu, ordering, live
kitchen display, staff notifications, and analytics in a single SaaS. Full
product spec: [`docs/PRD.md`](docs/PRD.md).

## Features

- 📱 **QR-first digital menu** — no app install, scan and order
- 🧑‍🍳 **Live kitchen display** — pending → accepted → preparing → ready
- 🔔 **Waiter call & bill requests** from the table, in real time-ish
- 🧾 **Cashier flow** — bill creation and UPI QR payment collection
- 🎨 **Templates & branding** — 11 menu templates, brand colour, custom fonts
- 👥 **Role-based staff access** — waiter / kitchen / cashier PIN login
- 🏷️ **Coupons & offers**, seeded subscription plans
- 🛡️ **Multi-tenant by design** — Postgres Row Level Security isolates every restaurant's data
- 📊 **Owner dashboard** — orders, tables, menu, staff, analytics, QR codes
- 🛠️ **Platform admin** — manage restaurants, users, subscriptions, payments

## Table of contents

- [Stack](#stack)
- [Getting started](#getting-started)
- [Database](#database)
- [How auth works](#how-auth-works)
- [Route map](#route-map)
- [What's implemented vs. what's next](#whats-implemented-vs-whats-next)
- [Deployment notes](#deployment-notes)
- [Security notes](#security-notes)

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Supabase (Postgres, Auth, Realtime, Storage) · Vercel

Next.js 16 renames `middleware.ts` to `proxy.ts` — see `src/proxy.ts`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase project credentials
npm run dev
```

### Database

Migrations live in `supabase/migrations/` and are plain SQL (no CLI lock-in),
applied in filename order:

1. `..._extensions_and_enums.sql` — extensions and enum types
2. `..._core_schema.sql` — every table (restaurants, branches, menu, orders,
   staff, subscriptions, …)
3. `..._rls_policies.sql` — Row Level Security: restaurant-level isolation
4. `..._seed_reference_data.sql` — subscription plans and menu templates
5. `..._coupon_usage_function.sql` — atomic coupon-redemption counter used by `placeOrder`
6. `..._storage_buckets.sql` — image buckets + storage RLS (per-restaurant folders)
7. `..._upi_payment.sql` — UPI collection details on `restaurants`

Apply them with the Supabase CLI (`supabase db push`) or by running each file
against your project's Postgres connection in order.

Required env vars (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your
  Supabase project's API settings.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used for staff PIN login and
  platform-admin operations (never exposed to the browser).
- `STAFF_SESSION_SECRET` — random secret signing staff PIN-login cookies
  (`openssl rand -base64 32`).
- `NEXT_PUBLIC_SITE_URL` — used to build QR code target URLs.

## How auth works

Two separate authentication paths, matching the PRD:

- **Owners/managers** sign in with Supabase Auth (email/password). Every
  dashboard query runs through the user's own Supabase session, and RLS scopes
  rows to the restaurant(s) they belong to.
- **Restaurant staff** (waiter/kitchen/cashier) sign in with a role + 4-digit
  PIN at `/staff` — not a Supabase Auth session. The PIN is verified
  server-side against `staff.pin_hash` (scrypt), and a signed HttpOnly cookie
  (`STAFF_SESSION_SECRET`) carries the session. Staff server actions use the
  Supabase service-role client (bypassing RLS by design) after re-verifying
  that cookie on every request — see `src/lib/staff-session.ts` and
  `src/app/actions/staff-ops.ts`.
- **Customers** never authenticate. The QR menu pages
  (`/menu/[restaurant]/[branch]/[table]`) read public menu data through
  anon-role RLS policies; placing an order or requesting the waiter goes
  through a server action using the service-role client (`src/app/actions/orders.ts`,
  `src/app/actions/waiter-requests.ts`), since anon has no write access to
  those tables by design.

## Route map

```
/                                          marketing home
/login, /signup, /onboarding               owner auth + restaurant creation

/dashboard                                 owner/manager (Supabase Auth)
/dashboard/orders
/dashboard/tables
/dashboard/menu
/dashboard/offers
/dashboard/branding                        template, brand colour, font
/dashboard/staff
/dashboard/analytics
/dashboard/qr
/dashboard/settings

/staff                                     role + PIN sign-in
/staff/kitchen                             kitchen display (accept/preparing/ready)
/staff/waiter                              open waiter requests
/staff/cashier                             open bills

/admin                                     platform admin (Supabase Auth + platform_admins)
/admin/restaurants
/admin/users
/admin/subscriptions
/admin/payments
/admin/templates

/menu/[restaurant]/[branch]                general branch menu (entrance QR)
/menu/[restaurant]/[branch]/[table]         table-scoped menu (table QR)
/menu/[restaurant]/[branch]/order/[orderId] live order tracking (PRD §34)
```

## What's implemented vs. what's next

Covers PRD **Phase 1 (Foundation)** in full, plus working slices of Phases
2–4: real auth, restaurant/branch/table/menu/staff CRUD, QR code generation,
image uploads, menu templates and branding, the full customer ordering loop
(cart → coupon → order → live tracking), waiter-call requests, a functional
kitchen/waiter/cashier flow (including bill creation when a customer requests
the check), and near-real-time updates throughout.

**Customer ordering loop** (`src/lib/cart-types.ts`,
`src/components/menu/cart-provider.tsx`, `src/app/actions/orders.ts`): the
cart is client-side (localStorage, scoped per restaurant+branch+table) purely
for UX — every price is re-fetched from the database by ID and every coupon
re-validated inside `placeOrder` before the order is written, so a tampered
client request can't change what the restaurant gets paid. Placing an order
creates or reuses the table's open `table_sessions` row, sets the table to
`order_pending`, and redirects to a live tracking page.

**Images** (`src/lib/compress-image.ts`, `src/components/ui/image-upload.tsx`):
menu photos and restaurant logo/cover upload to Supabase Storage. Images are
downscaled to 900px and re-encoded to WebP **in the browser before upload** —
a 4 MB phone photo lands at ~150 KB, which keeps a full menu inside Supabase's
1 GB free tier and keeps served bytes small. They're served straight from
Storage rather than through `next/image`, since they're already sized and
optimising them again would burn Vercel transformation quota for no gain.
Storage RLS keys off the first path segment (`<restaurant_id>/…`), so one
restaurant cannot overwrite another's images — verified against a real
Postgres instance, including malformed paths.

**Templates & branding** (`src/lib/templates.ts`, `/dashboard/branding`): 11
seeded templates (3 free, 8 premium) change only presentation — layout,
typography, image shape — never menu data, per PRD §32. The owner's brand
colour is applied by overriding the `--brand` CSS custom property for the menu
subtree, so existing `bg-brand`/`text-brand` utilities follow automatically.
Premium templates are gated: locked on Starter, open during trial (PRD §48
gives trials Business-level features).

**Order lifecycle** is closed end to end: kitchen drives pending → accepted →
preparing → ready, the waiter's "Ready to serve" queue takes ready → served,
and the cashier recording payment completes every open order on the table
session and frees the table. Each transition writes to `order_status_history`.

**Payment** (PRD §35's MVP scope — cash/UPI/card, manually confirmed): setting
a UPI ID in Settings lets the cashier show a `upi://pay` QR with the bill
amount pre-filled. The customer's UPI app pays the restaurant directly, so
there is no gateway, no merchant onboarding and no per-transaction fee; the
cashier still confirms receipt by hand, exactly like cash. The URI is
percent-encoded rather than built with `URLSearchParams`, whose `+` for spaces
some UPI apps render literally in the payee name.

**Near-real-time, not websocket Realtime**: customers and PIN-authenticated
staff never hold a Supabase Auth session, so a browser-side Supabase Realtime
subscription would connect as `anon` — which correctly *can't* read
orders/waiter_requests/bills under RLS (member-only policies). Rather than
weaken that boundary, the kitchen/waiter/cashier pages, the order tracking
page, and the owner dashboard poll via `router.refresh()` on a short interval
(`src/components/auto-refresh.tsx`). The owner dashboard *does* have a real
Supabase Auth session, so upgrading it to genuine `postgres_changes` Realtime
is a natural, low-risk follow-up; doing the same for staff/customers would
first need a real auth/token mechanism for them.

Deliberately not built yet (see PRD §53–56 for the phased roadmap):

- True websocket Realtime (see above — currently short-interval polling)
- Push notifications / sound alerts
- Offer rule builder UI (offers table + RLS + coupon redemption logic exist;
  no create/edit form for the owner)
- Customer feedback form (schema exists; no UI)
- Editing/deleting existing menu items (create works; no edit form yet)
- Online payment gateway (UPI QR covers in-person payment; there's no
  automatic reconciliation — the cashier confirms receipt manually)
- GST invoicing, printer integration
- Inventory, loyalty, CRM, WhatsApp — explicitly out of MVP scope per PRD §54

## Deployment notes

- **QR codes embed `NEXT_PUBLIC_SITE_URL`.** Menu, prices, offers and template
  can all change freely without reprinting — the QR only carries a URL — but
  changing the *domain* invalidates every printed code. Settle the final
  domain before printing table stickers. (A `qr_codes` table with a
  `target_url` column is already in the schema if an indirection layer is
  wanted later.)
- **Vercel's Hobby plan is non-commercial only** per their ToS; a revenue-
  generating deployment needs Pro or self-hosting.
- **Supabase free projects pause after ~7 days of inactivity** — fine for a
  live restaurant, worth knowing during intermittent testing.

## Security notes

- RLS is the real access-control boundary (PRD §51: "Restaurant A must never
  access Restaurant B's data") — verified against a real Postgres instance
  during development, including the owner-bootstrap edge case (a brand-new
  owner has no `restaurant_members` row yet when they create their first
  restaurant) and the negative case (a stranger cannot self-assign ownership
  of someone else's restaurant).
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is only ever used server-side,
  for the two cases where no Supabase Auth session exists to check against
  RLS in the first place: staff PIN login and platform-admin listing.
