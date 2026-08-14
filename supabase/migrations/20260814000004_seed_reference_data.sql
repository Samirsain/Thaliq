-- Reference data: subscription plans and menu templates (PRD sections 32, 47).

insert into subscription_plans (tier, name, monthly_price, max_branches, max_staff, features)
values
  ('starter', 'Starter', 499, 1, 5, jsonb_build_object(
    'templates', 'limited',
    'offers', 'limited',
    'kitchen_display', false,
    'analytics', 'basic',
    'whatsapp', false,
    'loyalty', false,
    'multi_branch', false,
    'white_label', false
  )),
  ('business', 'Business', 999, 1, 20, jsonb_build_object(
    'templates', 'full',
    'offers', 'full',
    'kitchen_display', true,
    'analytics', 'advanced',
    'whatsapp', false,
    'loyalty', false,
    'multi_branch', false,
    'white_label', false
  )),
  ('pro', 'Pro', 1999, null, null, jsonb_build_object(
    'templates', 'full',
    'offers', 'full',
    'kitchen_display', true,
    'analytics', 'advanced',
    'whatsapp', true,
    'loyalty', true,
    'multi_branch', true,
    'white_label', true
  ))
on conflict (tier) do nothing;

insert into templates (slug, name, is_premium)
values
  ('minimal', 'Minimal', false),
  ('classic', 'Classic', false),
  ('modern', 'Modern', false),
  ('luxury', 'Luxury', true),
  ('premium-dark', 'Premium Dark', true),
  ('cafe', 'Cafe', true),
  ('indian', 'Indian', true),
  ('fast-food', 'Fast Food', true),
  ('coffee', 'Coffee', true),
  ('fine-dining', 'Fine Dining', true),
  ('editorial', 'Editorial', true)
on conflict (slug) do nothing;
