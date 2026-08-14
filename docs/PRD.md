# THALIQ — Complete SaaS Product Requirements Document

Product: THALIQ
Category: Restaurant & Cafe Management SaaS
Platform: Web App + PWA
Primary Market: India
Core Technology: Next.js + Supabase + PostgreSQL
Business Model: Subscription SaaS
Version: 1.0 MVP

---

## 1. Product Vision

THALIQ is a QR-first restaurant operating system for cafes, restaurants, bakeries, food courts and similar businesses.

The core experience:

```
QR Scan
   ↓
Digital Menu
   ↓
Table Automatically Identified
   ↓
Customer Orders
   ↓
Restaurant Receives Live Order
   ↓
Kitchen Prepares
   ↓
Customer Tracks Order
   ↓
Payment / Bill
   ↓
Analytics
```

THALIQ should not be positioned as merely a QR Menu Generator.

**Positioning**

> One QR. Your entire restaurant connected.

**Product promise**

> Scan. Order. Serve. Manage.

---

## 2. Problems THALIQ Solves

Traditional restaurants face:

- Physical menu management
- Menu price updates
- Slow ordering
- Waiter dependency
- Missed table requests
- Kitchen communication problems
- Manual offer management
- No real-time order visibility
- Poor restaurant analytics
- Difficult staff management
- Multiple branch management
- Expensive POS systems

THALIQ combines these workflows into one SaaS.

---

## 3. Target Customers

**Primary**

- Cafes
- Restaurants
- Coffee shops
- Fast-food restaurants
- Bakeries
- Dessert shops
- Food courts
- Cloud kitchens

**Future**

- Hotels
- Restaurant chains
- Franchises
- Multi-location food businesses

---

## 4. User Types

THALIQ has five primary user types.

1. **SaaS Admin** — THALIQ platform owner.
2. **Restaurant Owner** — Complete control over their business.
3. **Restaurant Manager** — Operational management.
4. **Restaurant Staff** — Waiter, Kitchen, Cashier.
5. **Customer** — Uses QR menu without mandatory account creation.

---

## 5. Overall System Architecture

```
THALIQ
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     CUSTOMER          RESTAURANT          SUPER ADMIN
       WEB                WEB                  WEB
          │                 │                   │
          │                 │                   │
          ▼                 ▼                   ▼
       QR Menu          Dashboard          SaaS Control
          │                 │                   │
          └─────────────────┼───────────────────┘
                            │
                         Backend
                            │
                       Supabase
                            │
       ┌─────────────┬──────┼──────┬──────────────┐
       ▼             ▼      ▼      ▼              ▼
   PostgreSQL      Auth   Storage Realtime     Payments
```

---

## 6. Recommended Technology Stack

**Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Responsive design

**Backend**: Next.js Server Actions / API routes, Supabase

**Database**: PostgreSQL through Supabase

**Authentication**: Supabase Auth

**Realtime**: Supabase Realtime

**Storage**: Supabase Storage — for restaurant logos, food images, cover images, staff avatars

**Hosting**: Vercel

**QR**: QR generation library

**Payments**: India-focused payment gateway such as Razorpay, to be integrated after MVP if needed.

---

## 7. Authentication System

**Restaurant Owner** supports: Email/password, Mobile OTP, Forgot password, Session management, Optional 2FA.

**Staff**

Staff should not repeatedly enter complicated credentials.

Recommended flow:

```
Restaurant
     ↓
Staff Account
     ↓
Role
     ↓
PIN
     ↓
PWA Session
```

Example:

```
THE COFFEE HOUSE

Select Role

[ Manager ]
[ Waiter ]
[ Kitchen ]
[ Cashier ]

Enter PIN

● ● ● ●
```

---

## 8. Customer Authentication

Customer should not be forced to register.

```
Scan QR
 ↓
Menu
 ↓
Cart
 ↓
Order
```

Optional customer information (name, mobile, email) can be collected later.

---

## 9. Restaurant Onboarding

First login:

```
Create Account
      ↓
Restaurant Details
      ↓
Branch
      ↓
Tables
      ↓
Menu
      ↓
Branding
      ↓
Menu Template
      ↓
Offers
      ↓
QR Generation
      ↓
Go Live
```

---

## 10. Restaurant Profile

Owner can configure: restaurant name, logo, cover image, description, phone, address, website, Instagram, opening/closing hours, cuisine type, tax settings, service charges, restaurant status.

---

## 11. Branch Management

Each restaurant can have one or multiple branches depending on subscription.

```
The Coffee House
│
├── Jaipur
├── Jodhpur
├── Delhi
└── Chandigarh
```

Each branch has: tables, staff, menu settings, orders, analytics.

---

## 12. Table Management

Owner can create tables (Table 01 … Table 20). Each table has a unique identifier.

**Table statuses**: Available, Occupied, Order Pending, Preparing, Ready, Bill Requested, Cleaning.

---

## 13. QR System

Every table receives a permanent QR code.

Example:

```
Restaurant: The Coffee House
Branch: Jodhpur
Table: 04

QR
 ↓
/menu/the-coffee-house/jodhpur/table/04
```

Changing menu, price, offers, or template must not require a new QR code.

---

## 14. QR Types

- **Table QR** — used on tables.
- **General Menu QR** — used at entrance, counter, social media, website.
- **Future**: Payment QR, Feedback QR, Loyalty QR.

---

## 15. Customer Digital Menu

Mobile-first interface. Customer sees restaurant logo/name, search, categories, items with images, descriptions, pricing, veg/non-veg, bestseller, recommended, availability, variants, add-ons.

---

## 16. Menu Management

Owner can create/edit/delete categories and items, change price, upload image, add description, mark available/unavailable, mark bestseller, reorder items.

---

## 17. Pricing System

Supports simple price, multiple variants (Regular/Large), and add-ons (Extra Shot, Almond Milk, Extra Cheese).

---

## 18. Offers System

Restaurant owner can create: Percentage discount, Flat discount, Buy 1 Get 1, Combo, Happy Hours, Coupon.

---

## 19. Offer Rules

Offers support: start/end date, start/end time, specific days, minimum order value, maximum discount, specific categories/products, coupon code, usage limits. Offers automatically activate and expire.

---

## 20. Customer Cart

Cart supports quantity, variants, add-ons, special instructions, offers, coupons.

Example:

```
Subtotal          ₹650
Discount         -₹100
Tax                ₹27
Service charge     ₹20
──────────────────────
Total             ₹597
```

---

## 21. Table Session

When a customer scans a table QR: Restaurant → Branch → Table → Table Session. Multiple customers can order from the same table; the restaurant sees the complete table session.

---

## 22. Order System

Order lifecycle:

```
Pending → Accepted → Preparing → Ready → Served → Completed
```

Possible cancellation: Pending → Cancelled. Every status change should be recorded.

---

## 23. Real-Time Orders

```
Customer
   ↓
Supabase PostgreSQL
   ↓
Realtime Event
   ├── Kitchen
   ├── Manager
   └── Waiter
```

No manual refresh should be required.

---

## 24. Kitchen Display System

Kitchen receives simplified orders (table, items, quantities) with Accept → Preparing → Ready actions. The kitchen interface should be extremely simple.

---

## 25. Staff Notification System

> Staff should not have to sit on a mobile dashboard all day.

```
Order → Backend → Push Notification → Staff Device → Sound Alert
```

Notification events: new order, waiter request, bill request, payment received, order ready.

---

## 26. PWA Staff App

Staff can install THALIQ on Android (Open → Install → Home Screen → Push Notifications), receiving alerts even when not actively looking at the dashboard, subject to browser/device notification permissions.

---

## 27. Sound System

**MVP**: device notification, PWA sound, push notification.

**Future**: dedicated THALIQ Alert Box (THALIQ Cloud → Restaurant Wi-Fi → Alert Box → Speaker/LED). New Order → 3 beeps, Waiter → 2 beeps, Bill → 1 beep.

---

## 28. Waiter System

Waiter sees tables, requests, orders. Customer can request: Call Waiter, Water, Cutlery, Bill, Other. Waiter gets notified.

---

## 29. Cashier System

Cashier can view bills, mark payment, generate receipt, close table session, view completed orders.

---

## 30. Restaurant Dashboard

Displays today's revenue, today's orders, active tables, pending orders, completed orders, average order value, and a live order feed.

---

## 31. Restaurant Branding

Owner can configure logo, colors, fonts, cover image, description, buttons, menu layout. The customer-facing menu should feel like the restaurant's own branded application.

---

## 32. Menu Templates

**Free**: Minimal, Classic, Modern.

**Premium**: Luxury, Premium Dark, Cafe, Indian, Fast Food, Coffee, Fine Dining, Editorial.

Template changes must not change menu data.

---

## 33. Menu Preview

Owner can preview Mobile/Tablet/Desktop, with Preview/Save/Publish actions.

---

## 34. Customer Order Tracking

```
ORDER #1042

✓ Received
✓ Accepted
● Preparing
○ Ready
○ Served
```

Status updates in real time.

---

## 35. Bill & Payment

**MVP**: Cash, UPI, Card, manual payment status.

**Future**: Online payment, payment gateway, digital receipt, GST invoice, printer integration.

---

## 36. Customer Feedback

After a completed order, customer rates Food / Service / Experience (1–5 stars). Owner sees aggregate ratings.

---

## 37. Analytics

- **Revenue**: today, week, month, custom range
- **Orders**: total, completed, cancelled, pending
- **Products**: best selling, lowest selling, most viewed
- **Customers**: new, returning
- **Offers**: usage, discount amount, revenue generated

---

## 38. Staff Management

Owner adds staff with name, mobile, role, PIN, permissions.

Roles: Owner, Manager, Waiter, Kitchen, Cashier.

---

## 39. Role-Based Access Control

- **Owner** — everything.
- **Manager** — orders + tables + menu + staff + analytics.
- **Kitchen** — only kitchen.
- **Waiter** — tables + requests.
- **Cashier** — bills + payments.

Staff should never see subscription or sensitive owner settings unless explicitly permitted.

---

## 40. Notification Center

Dashboard bell shows recent events, e.g. "New Order — Table 04, 2 min ago".

---

## 41. Customer CRM — Future

Customer segments: New, Returning, Frequent, High Value.

---

## 42. Loyalty — Future

₹100 spent → 10 points. Points redeemable for discounts, free products, coupons.

---

## 43. WhatsApp Integration — Future

Notifications for order confirmed, order ready, bill, payment, offers. Premium feature.

---

## 44. Inventory — Future

Basic inventory (Milk, Coffee, Cheese, Bread). When unavailable, item shows "Sold Out" and the customer menu automatically disables it.

---

## 45. Multi-Branch — Pro

Centralized reporting across branches (Jodhpur, Jaipur, Delhi, …).

---

## 46. Super Admin Dashboard

THALIQ platform owner dashboard tracking restaurants, active subscriptions, trials, MRR, orders, users.

Modules: Restaurants, Users, Plans, Subscriptions, Payments, Templates, Support, Analytics, System settings.

---

## 47. Subscription Model

| Feature | Starter | Business | Pro |
| --- | --- | --- | --- |
| Digital Menu | ✓ | ✓ | ✓ |
| QR Tables | ✓ | ✓ | ✓ |
| Templates | Limited | ✓ | ✓ |
| Ordering | ✓ | ✓ | ✓ |
| Offers | Limited | ✓ | ✓ |
| Kitchen | — | ✓ | ✓ |
| Staff | Limited | ✓ | ✓ |
| Analytics | Basic | Advanced | Advanced |
| WhatsApp | — | — | ✓ |
| Loyalty | — | — | ✓ |
| Multiple Branches | — | — | ✓ |
| White Label | — | — | ✓ |

Initial pricing to test: Starter ₹499/month, Business ₹999/month, Pro ₹1,999/month.

---

## 48. Free Trial

14-day free trial at Business-level features. After expiry: Trial Expired → Choose Plan → Continue.

---

## 49. Database Design

Core tables:

```
users, restaurants, branches, restaurant_members, roles, permissions
tables, table_sessions
menu_categories, menu_items, menu_variants, menu_addons
offers, coupons, combos
orders, order_items, order_status_history
payments, bills
notifications, staff_devices
qr_codes
templates, restaurant_themes
subscriptions, subscription_plans, transactions
customers, feedback, loyalty_points
```

---

## 50. Database Relationship

```
User
 ↓
Restaurant
 ↓
Branch
 ├── Tables
 │    └── Sessions
 │
 ├── Menu
 │    ├── Categories
 │    ├── Items
 │    ├── Variants
 │    └── Add-ons
 │
 ├── Offers
 ├── Orders
 │    └── Order Items
 ├── Staff
 ├── Customers
 └── Subscription
```

---

## 51. Security Requirements

Must implement: Supabase Auth, role-based access, restaurant-level data isolation, PostgreSQL Row Level Security, secure API routes, input validation, rate limiting, secure sessions, audit logs, payment security.

**Critical rule**:

> Restaurant A must never be able to access Restaurant B's data.

---

## 52. URL Structure

**Customer**

```
/menu/[restaurant]/[branch]/[table]
```

**Restaurant**

```
/dashboard
/dashboard/orders
/dashboard/tables
/dashboard/menu
/dashboard/offers
/dashboard/staff
/dashboard/analytics
/dashboard/qr
/dashboard/settings
```

**Staff**

```
/staff
/staff/kitchen
/staff/waiter
/staff/cashier
```

**Admin**

```
/admin
/admin/restaurants
/admin/users
/admin/subscriptions
/admin/payments
/admin/templates
```

---

## 53. MVP Development Priority

**Phase 1 — Foundation**: Next.js setup, Supabase setup, database, authentication, restaurant creation, user roles.

**Phase 2 — Restaurant Setup**: restaurant profile, tables, menu categories, menu items, pricing, images, branding.

**Phase 3 — QR & Customer**: QR generation, QR routing, customer menu, templates, cart, table detection.

**Phase 4 — Orders**: order creation, order management, realtime, kitchen, order tracking.

**Phase 5 — Operations**: staff, notifications, waiter requests, bill requests, PWA, sound alerts.

**Phase 6 — Business**: offers, coupons, analytics, subscription, super admin.

---

## 54. MVP Must NOT Include

Full inventory, loyalty, CRM automation, advanced marketing, POS hardware, GST accounting suite, staff attendance, custom hardware, complex multi-branch analytics. These belong in later versions.

---

## 55. Version 2

Inventory, Online Payments, WhatsApp, Advanced Analytics, Feedback, Multi-Branch, Floor Plan, Advanced Offers, Digital Billing, Staff Attendance.

---

## 56. Version 3

Loyalty, CRM, Marketing Automation, POS Integration, GST Billing, Printer Integration, Custom Domain, White Label, API, THALIQ Alert Box.

---

## 57. Key Product Differentiator

THALIQ should not compete as "another QR menu." Instead: QR → Menu → Order → Table → Kitchen → Staff → Payment → Analytics. One system connects the restaurant.

---

## 58. Final Customer Experience

Customer → Scan QR → Branded Menu → Browse → Offers → Customize → Cart → Order → Live Tracking → Payment → Feedback.

---

## 59. Final Restaurant Experience

Owner → Dashboard → Menu, Pricing, Offers, Tables, QR, Staff, Orders, Kitchen, Analytics, Subscription.

---

## 60. Final Staff Experience

Order → Push Notification → Sound → Staff Device / Kitchen Display → Accept → Preparing → Ready → Served. Staff should not be dependent on continuously watching a phone dashboard.

---

## 61. Final Business Model

THALIQ earns through SaaS subscriptions (₹499 → ₹999 → ₹1,999/month).

Future revenue: premium templates, white-label, custom domains, WhatsApp credits, payment services, hardware alert devices, multi-branch plans, enterprise plans.

---

## 62. Final Product Definition

THALIQ is a restaurant operating system that starts with a QR code and connects the complete customer-to-kitchen workflow.

Recommended production stack:

> Next.js + TypeScript + Tailwind + shadcn/ui + Supabase PostgreSQL + Supabase Auth + Supabase Realtime + Supabase Storage + Vercel

**MVP goal**: First make QR → menu → table → order → kitchen → notification → completion completely reliable. Everything else should be layered on top of that core loop.
