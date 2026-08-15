-- ---------------------------------------------------------------------------
-- THALIQ — demo menu seed
-- ---------------------------------------------------------------------------
--
-- Fills an existing restaurant with a realistic cafe/restaurant menu so the
-- QR flow can be demoed end to end: categories, dishes, variants, add-ons,
-- tables, an offer and a coupon.
--
-- HOW TO RUN
--   Paste the whole file into Supabase → SQL Editor → Run.
--   It targets your oldest restaurant by default. If you have more than one,
--   set v_restaurant_slug below to the one you want.
--
-- SAFE TO RE-RUN: it deletes only the demo rows it created (matched by name)
-- before inserting, so running twice will not duplicate the menu.
--
-- NOT INCLUDED
--   * Photos — image_url is left null. Upload real photos from
--     Dashboard → Menu, since they belong in your Storage bucket.
--   * Staff — PINs are scrypt-hashed by the app, so staff must be added from
--     Dashboard → Staff.
-- ---------------------------------------------------------------------------

do $$
declare
  -- Leave null to use your oldest restaurant, or put your slug here.
  v_restaurant_slug text := null;

  v_restaurant_id uuid;
  v_branch_id     uuid;

  c_coffee    uuid; c_cold     uuid; c_breakfast uuid; c_starters uuid;
  c_pizza     uuid; c_burgers  uuid; c_mains     uuid; c_breads   uuid;
  c_desserts  uuid;

  v_item      uuid;
  v_offer     uuid;
  i           integer;
begin
  ---------------------------------------------------------------------------
  -- Resolve target restaurant + branch
  ---------------------------------------------------------------------------
  if v_restaurant_slug is null then
    select id into v_restaurant_id from restaurants order by created_at limit 1;
  else
    select id into v_restaurant_id from restaurants where slug = v_restaurant_slug;
  end if;

  if v_restaurant_id is null then
    raise exception 'No restaurant found. Sign up and finish onboarding first.';
  end if;

  select id into v_branch_id
  from branches where restaurant_id = v_restaurant_id
  order by created_at limit 1;

  if v_branch_id is null then
    raise exception 'Restaurant % has no branch yet.', v_restaurant_id;
  end if;

  raise notice 'Seeding restaurant % (branch %)', v_restaurant_id, v_branch_id;

  ---------------------------------------------------------------------------
  -- Clear previous demo rows so this is idempotent.
  -- Deleting the categories cascades to items, which cascades to variants
  -- and add-ons.
  ---------------------------------------------------------------------------
  delete from menu_categories
  where restaurant_id = v_restaurant_id
    and name in ('Hot Coffee','Cold Beverages','Breakfast','Starters',
                 'Pizza','Burgers & Sandwiches','Main Course','Breads','Desserts');

  delete from coupons where restaurant_id = v_restaurant_id and code in ('WEEKEND20','FIRST50');
  delete from offers  where restaurant_id = v_restaurant_id
    and name in ('Weekend 20% Off','Flat ₹50 Off','Happy Hours');

  ---------------------------------------------------------------------------
  -- Categories
  ---------------------------------------------------------------------------
  insert into menu_categories (restaurant_id, name, sort_order) values
    (v_restaurant_id, 'Hot Coffee',            1) returning id into c_coffee;
  insert into menu_categories (restaurant_id, name, sort_order) values
    (v_restaurant_id, 'Cold Beverages',        2) returning id into c_cold;
  insert into menu_categories (restaurant_id, name, sort_order) values
    (v_restaurant_id, 'Breakfast',             3) returning id into c_breakfast;
  insert into menu_categories (restaurant_id, name, sort_order) values
    (v_restaurant_id, 'Starters',              4) returning id into c_starters;
  insert into menu_categories (restaurant_id, name, sort_order) values
    (v_restaurant_id, 'Pizza',                 5) returning id into c_pizza;
  insert into menu_categories (restaurant_id, name, sort_order) values
    (v_restaurant_id, 'Burgers & Sandwiches',  6) returning id into c_burgers;
  insert into menu_categories (restaurant_id, name, sort_order) values
    (v_restaurant_id, 'Main Course',           7) returning id into c_mains;
  insert into menu_categories (restaurant_id, name, sort_order) values
    (v_restaurant_id, 'Breads',                8) returning id into c_breads;
  insert into menu_categories (restaurant_id, name, sort_order) values
    (v_restaurant_id, 'Desserts',              9) returning id into c_desserts;

  ---------------------------------------------------------------------------
  -- HOT COFFEE  (variants + add-ons)
  ---------------------------------------------------------------------------
  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, is_recommended, sort_order)
  values (v_restaurant_id, c_coffee, 'Cappuccino',
          'Double shot espresso with steamed milk and a thick foam cap.',
          149, true, true, true, 1)
  returning id into v_item;
  insert into menu_variants (item_id, name, price, is_default, sort_order) values
    (v_item, 'Regular', 149, true, 1),
    (v_item, 'Large',   189, false, 2);
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Extra Shot',   40, 1),
    (v_item, 'Almond Milk',  30, 2),
    (v_item, 'Hazelnut Syrup', 25, 3);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_coffee, 'Cafe Latte',
          'Smooth espresso with plenty of steamed milk.', 159, true, false, 2)
  returning id into v_item;
  insert into menu_variants (item_id, name, price, is_default, sort_order) values
    (v_item, 'Regular', 159, true, 1),
    (v_item, 'Large',   199, false, 2);
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Extra Shot', 40, 1),
    (v_item, 'Vanilla Syrup', 25, 2);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_coffee, 'Espresso', 'Single origin, served short and strong.', 119, true, 3);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_recommended, sort_order)
  values (v_restaurant_id, c_coffee, 'Filter Coffee',
          'South Indian filter kaapi, served in a traditional tumbler.', 99, true, true, 4);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_coffee, 'Masala Chai',
          'Assam tea brewed with ginger, cardamom and clove.', 79, true, 5);

  ---------------------------------------------------------------------------
  -- COLD BEVERAGES
  ---------------------------------------------------------------------------
  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_cold, 'Cold Coffee',
          'Blended chilled coffee topped with vanilla ice cream.', 179, true, true, 1)
  returning id into v_item;
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Extra Ice Cream Scoop', 50, 1),
    (v_item, 'Chocolate Sauce', 20, 2);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_cold, 'Iced Americano', 'Espresso over ice with chilled water.', 149, true, 2);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_cold, 'Fresh Lime Soda', 'Sweet or salted, your choice.', 89, true, 3);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_recommended, sort_order)
  values (v_restaurant_id, c_cold, 'Mango Lassi',
          'Thick sweet lassi with Alphonso pulp.', 129, true, true, 4);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_cold, 'Masala Chaas', 'Spiced buttermilk with roasted cumin.', 69, true, 5);

  ---------------------------------------------------------------------------
  -- BREAKFAST
  ---------------------------------------------------------------------------
  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_breakfast, 'Masala Dosa',
          'Crisp dosa with spiced potato filling, sambar and chutney.', 149, true, true, 1);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_breakfast, 'Idli Sambar', 'Three steamed idlis with sambar.', 109, true, 2);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_breakfast, 'Poha', 'Flattened rice with peanuts, curry leaves and lemon.', 89, true, 3);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_recommended, sort_order)
  values (v_restaurant_id, c_breakfast, 'Aloo Paratha',
          'Two stuffed parathas with white butter, curd and pickle.', 139, true, true, 4);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_breakfast, 'Masala Omelette', 'Three eggs, onion, chilli, buttered toast.', 129, false, 5);

  ---------------------------------------------------------------------------
  -- STARTERS
  ---------------------------------------------------------------------------
  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_starters, 'Paneer Tikka',
          'Char-grilled cottage cheese with peppers and mint chutney.', 279, true, true, 1);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_starters, 'Veg Spring Rolls', 'Crisp rolls with sweet chilli dip.', 189, true, 2);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_starters, 'Chicken Tikka',
          'Boneless thigh marinated overnight in yoghurt and spices.', 329, false, true, 3);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_starters, 'Chilli Chicken', 'Indo-Chinese, tossed with onion and capsicum.', 299, false, 4);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_starters, 'Masala Fries', 'Hand-cut fries dusted with chaat masala.', 149, true, 5)
  returning id into v_item;
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Cheese Dip', 40, 1),
    (v_item, 'Peri Peri Seasoning', 20, 2);

  ---------------------------------------------------------------------------
  -- PIZZA  (variants by size)
  ---------------------------------------------------------------------------
  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_pizza, 'Margherita',
          'San Marzano sauce, mozzarella and fresh basil.', 249, true, true, 1)
  returning id into v_item;
  insert into menu_variants (item_id, name, price, is_default, sort_order) values
    (v_item, '7 inch',  249, true, 1),
    (v_item, '10 inch', 399, false, 2),
    (v_item, '12 inch', 549, false, 3);
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Extra Cheese', 60, 1),
    (v_item, 'Olives', 40, 2),
    (v_item, 'Jalapenos', 40, 3);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_pizza, 'Farmhouse',
          'Onion, capsicum, mushroom, sweetcorn and tomato.', 349, true, 2)
  returning id into v_item;
  insert into menu_variants (item_id, name, price, is_default, sort_order) values
    (v_item, '7 inch',  349, true, 1),
    (v_item, '10 inch', 499, false, 2);
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Extra Cheese', 60, 1);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_recommended, sort_order)
  values (v_restaurant_id, c_pizza, 'Chicken Tikka Pizza',
          'Tandoori chicken, onion and coriander.', 429, false, true, 3)
  returning id into v_item;
  insert into menu_variants (item_id, name, price, is_default, sort_order) values
    (v_item, '7 inch',  429, true, 1),
    (v_item, '10 inch', 599, false, 2);

  ---------------------------------------------------------------------------
  -- BURGERS & SANDWICHES
  ---------------------------------------------------------------------------
  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_burgers, 'Crispy Veg Burger',
          'Spiced potato patty, lettuce and house mayo.', 179, true, true, 1)
  returning id into v_item;
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Cheese Slice', 40, 1),
    (v_item, 'Extra Patty', 70, 2);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_burgers, 'Paneer Makhani Burger',
          'Grilled paneer in makhani sauce.', 219, true, 2);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_burgers, 'Grilled Chicken Burger',
          'Peri-peri chicken breast, lettuce, cheddar.', 259, false, true, 3)
  returning id into v_item;
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Cheese Slice', 40, 1),
    (v_item, 'Extra Patty', 90, 2);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_burgers, 'Bombay Grilled Sandwich',
          'Potato, beetroot, cucumber and green chutney.', 149, true, 4);

  ---------------------------------------------------------------------------
  -- MAIN COURSE
  ---------------------------------------------------------------------------
  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_mains, 'Paneer Butter Masala',
          'Cottage cheese in a rich tomato-cashew gravy.', 329, true, true, 1);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_mains, 'Dal Makhani', 'Black lentils simmered overnight with butter.', 279, true, 2);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_mains, 'Butter Chicken',
          'Tandoori chicken in a silky tomato and cream gravy.', 399, false, true, 3);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_mains, 'Kadhai Chicken', 'Wok-tossed with peppers and crushed coriander.', 379, false, 4);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_recommended, sort_order)
  values (v_restaurant_id, c_mains, 'Veg Biryani',
          'Long-grain rice layered with vegetables, served with raita.', 299, true, true, 5)
  returning id into v_item;
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Extra Raita', 40, 1);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_mains, 'Hyderabadi Chicken Biryani',
          'Dum-cooked with saffron, served with mirchi ka salan.', 379, false, true, 6);

  ---------------------------------------------------------------------------
  -- BREADS
  ---------------------------------------------------------------------------
  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_breads, 'Butter Naan', 'Tandoor-baked, brushed with butter.', 59, true, 1);
  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_breads, 'Garlic Naan', 'Naan with garlic and coriander.', 79, true, 2);
  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_breads, 'Tandoori Roti', 'Whole wheat, straight from the tandoor.', 39, true, 3);
  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_breads, 'Laccha Paratha', 'Flaky layered paratha.', 69, true, 4);

  ---------------------------------------------------------------------------
  -- DESSERTS  (one deliberately sold out, to show that state)
  ---------------------------------------------------------------------------
  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_bestseller, sort_order)
  values (v_restaurant_id, c_desserts, 'Gulab Jamun',
          'Two warm jamuns in cardamom syrup.', 99, true, true, 1);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_desserts, 'Chocolate Brownie',
          'Warm brownie with vanilla ice cream.', 179, true, 2)
  returning id into v_item;
  insert into menu_addons (item_id, name, price, sort_order) values
    (v_item, 'Extra Scoop', 50, 1);

  insert into menu_items (restaurant_id, category_id, name, description, base_price,
                          is_veg, is_available, sort_order)
  values (v_restaurant_id, c_desserts, 'Tiramisu',
          'Classic mascarpone and espresso layers.', 229, true, false, 3);

  insert into menu_items (restaurant_id, category_id, name, description, base_price, is_veg, sort_order)
  values (v_restaurant_id, c_desserts, 'Gajar Ka Halwa', 'Slow-cooked carrot halwa with khoya.', 149, true, 4);

  ---------------------------------------------------------------------------
  -- Tables 01–12 (skips any that already exist)
  ---------------------------------------------------------------------------
  for i in 1..12 loop
    insert into restaurant_tables (branch_id, label)
    values (v_branch_id, 'Table ' || lpad(i::text, 2, '0'))
    on conflict (branch_id, label) do nothing;
  end loop;

  ---------------------------------------------------------------------------
  -- Offers + coupons
  ---------------------------------------------------------------------------
  insert into offers (restaurant_id, name, type, percentage_value,
                      min_order_value, max_discount_value, is_active)
  values (v_restaurant_id, 'Weekend 20% Off', 'percentage', 20, 500, 200, true)
  returning id into v_offer;

  insert into coupons (restaurant_id, offer_id, code, usage_limit, is_active)
  values (v_restaurant_id, v_offer, 'WEEKEND20', 100, true);

  insert into offers (restaurant_id, name, type, flat_value, min_order_value, is_active)
  values (v_restaurant_id, 'Flat ₹50 Off', 'flat', 50, 300, true)
  returning id into v_offer;

  insert into coupons (restaurant_id, offer_id, code, usage_limit, is_active)
  values (v_restaurant_id, v_offer, 'FIRST50', 500, true);

  insert into offers (restaurant_id, name, type, percentage_value,
                      starts_at, ends_at, is_active)
  values (v_restaurant_id, 'Happy Hours', 'percentage', 20, '14:00', '17:00', true);

  raise notice 'Done. % categories, % items, % tables.',
    (select count(*) from menu_categories where restaurant_id = v_restaurant_id),
    (select count(*) from menu_items      where restaurant_id = v_restaurant_id),
    (select count(*) from restaurant_tables where branch_id = v_branch_id);
end $$;
