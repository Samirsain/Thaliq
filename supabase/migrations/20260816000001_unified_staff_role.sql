-- Unified operational staff role.
--
-- Adds a single 'staff' value to restaurant_role so one PIN login can move an
-- order through its entire lifecycle (New → Preparing → Ready → Served)
-- without switching between separate kitchen/waiter/cashier sessions.
--
-- Non-breaking: existing roles (owner, manager, waiter, kitchen, cashier)
-- are untouched and existing staff rows keep their current role. No table
-- structure changes — only a new enum value.
alter type restaurant_role add value if not exists 'staff';
