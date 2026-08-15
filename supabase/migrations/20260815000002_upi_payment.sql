-- UPI collection details for in-person payment (PRD section 35's MVP scope:
-- cash / UPI / card with a manually recorded status).
--
-- No payment gateway is involved: THALIQ builds a standard `upi://pay` deep
-- link from these fields and renders it as a QR. The customer's UPI app pays
-- the restaurant directly, so there is nothing to settle, no per-transaction
-- fee, and no gateway account to onboard. The cashier still confirms receipt
-- manually, exactly like cash.

alter table restaurants
  add column if not exists upi_id text,
  add column if not exists upi_display_name text;

comment on column restaurants.upi_id is
  'UPI VPA (e.g. restaurant@okhdfcbank) used to build upi://pay QR codes.';
