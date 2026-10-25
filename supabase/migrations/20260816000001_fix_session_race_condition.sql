-- Fix: Prevent duplicate open sessions on the same table.
--
-- placeOrder() checks for an existing open session before creating a new
-- one, but two concurrent orders on the same table can both read "no
-- session exists" and both insert — splitting the table's orders across
-- two sessions and breaking the bill total. This partial unique index
-- makes the second insert fail at the database level, so the race is
-- impossible regardless of application logic.
--
-- Only applies to active (non-closed) sessions, so a table can have many
-- historical sessions over time — just never more than one open at a time.

CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_one_active_per_table
  ON table_sessions (table_id)
  WHERE status IN ('open', 'bill_requested', 'payment_pending', 'paid');
