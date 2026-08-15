"use client";

import { useState } from "react";

import { AddToCartDialog, type MenuItemForCart } from "@/components/menu/add-to-cart-dialog";
import { CartBar } from "@/components/menu/cart-bar";
import { WaiterRequestButton } from "@/components/menu/waiter-request-button";
import { Badge } from "@/components/ui/badge";
import { templateStyle } from "@/lib/templates";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; menu_items: MenuItemForCart[] };

export type MenuTheme = {
  templateSlug: string | null;
  primaryColor: string | null;
  fontFamily: string | null;
};

const FONT_CLASS: Record<string, string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
};

export function CustomerMenu({
  restaurant,
  categories,
  tableLabel,
  branchId,
  tableId,
  theme,
}: {
  restaurant: {
    name: string;
    description: string | null;
    cuisine_type: string | null;
    logo_url: string | null;
    cover_image_url: string | null;
  };
  categories: Category[];
  tableLabel?: string | null;
  branchId: string;
  tableId?: string;
  theme?: MenuTheme;
}) {
  const [activeItem, setActiveItem] = useState<MenuItemForCart | null>(null);
  const style = templateStyle(theme?.templateSlug);

  // The owner's brand colour overrides the --brand token for this subtree, so
  // every element already styled with bg-brand/text-brand follows along.
  const brandVars = theme?.primaryColor
    ? ({
        "--brand": theme.primaryColor,
        "--color-brand": theme.primaryColor,
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      style={brandVars}
      className={cn(
        "mx-auto flex max-w-xl flex-col gap-6 pb-28",
        style.page,
        theme?.fontFamily ? FONT_CLASS[theme.fontFamily] : null,
      )}
    >
      {restaurant.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={restaurant.cover_image_url}
          alt=""
          className="h-36 w-full object-cover sm:rounded-b-xl"
        />
      ) : null}

      <div
        className={`flex flex-col items-center gap-2 px-4 text-center ${restaurant.cover_image_url ? "-mt-12" : "pt-6"}`}
      >
        {restaurant.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.logo_url}
            alt={restaurant.name}
            className="size-16 rounded-full border-2 border-background object-cover shadow-sm"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-background bg-brand text-xl font-semibold text-brand-foreground shadow-sm">
            {restaurant.name.slice(0, 1)}
          </div>
        )}
        <h1 className={style.title}>{restaurant.name}</h1>
        {restaurant.cuisine_type ? (
          <p className="text-sm text-muted-foreground">{restaurant.cuisine_type}</p>
        ) : null}
        {tableLabel ? <Badge variant="brand">Table {tableLabel}</Badge> : null}
      </div>

      {categories.map((category) => (
        <section key={category.id} className="flex flex-col gap-3 px-4">
          <h2 className={style.heading}>{category.name}</h2>
          <div className="flex flex-col gap-3">
            {category.menu_items.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.is_available}
                onClick={() => setActiveItem(item)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 p-3 text-left transition-colors enabled:hover:bg-accent/60 disabled:opacity-60",
                  style.card,
                )}
              >
                {/* min-w-0 lets the text column actually shrink; without it a
                    long name or description forces the row wider than the
                    screen and the thumbnail gets pushed off the edge. */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 shrink-0 rounded-sm border ${item.is_veg ? "border-green-600 bg-green-600" : "border-red-600 bg-red-600"}`}
                    />
                    <p className="min-w-0 truncate font-medium">{item.name}</p>
                    {item.is_bestseller ? (
                      <Badge variant="outline" className="shrink-0">
                        Bestseller
                      </Badge>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="font-medium">₹{item.base_price}</p>
                </div>

                {item.image_url ? (
                  <div className="relative shrink-0">
                    {/* Already compressed at upload and served straight from
                        Supabase Storage — no image-optimization pass needed. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                      className={cn("size-16 border object-cover sm:size-20", style.image)}
                    />
                    {!item.is_available ? (
                      <span
                        className={cn(
                          "absolute inset-0 flex items-center justify-center bg-background/75 text-xs font-medium",
                          style.image,
                        )}
                      >
                        Sold out
                      </span>
                    ) : null}
                  </div>
                ) : !item.is_available ? (
                  <Badge variant="destructive" className="shrink-0">
                    Sold out
                  </Badge>
                ) : null}
              </button>
            ))}
            {category.menu_items.length === 0 && (
              <p className="text-sm text-muted-foreground">No items in this category yet.</p>
            )}
          </div>
        </section>
      ))}

      {categories.length === 0 && (
        <p className="px-4 text-center text-sm text-muted-foreground">Menu coming soon.</p>
      )}

      {activeItem ? (
        <AddToCartDialog item={activeItem} open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)} />
      ) : null}

      {tableId ? <WaiterRequestButton branchId={branchId} tableId={tableId} /> : null}
      <CartBar />
    </div>
  );
}
