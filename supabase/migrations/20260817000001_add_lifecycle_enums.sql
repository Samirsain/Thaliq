-- Add payment_pending and paid states to the session and table status enums.
ALTER TYPE table_session_status ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE table_session_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE table_status ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE table_status ADD VALUE IF NOT EXISTS 'paid';