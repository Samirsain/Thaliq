import { Badge } from "@/components/ui/badge";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  is_veg: boolean;
  is_bestseller: boolean;
  is_available: boolean;
};

type Category = { id: string; name: string; menu_items: MenuItem[] };

export function CustomerMenu({
  restaurant,
  categories,
  tableLabel,
}: {
  restaurant: { name: string; description: string | null; cuisine_type: string | null };
  categories: Category[];
  tableLabel?: string | null;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 pb-16">
      <div className="flex flex-col items-center gap-2 pt-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-brand text-xl font-semibold text-brand-foreground">
          {restaurant.name.slice(0, 1)}
        </div>
        <h1 className="text-xl font-semibold">{restaurant.name}</h1>
        {restaurant.cuisine_type ? (
          <p className="text-sm text-muted-foreground">{restaurant.cuisine_type}</p>
        ) : null}
        {tableLabel ? <Badge variant="brand">Table {tableLabel}</Badge> : null}
      </div>

      {categories.map((category) => (
        <section key={category.id} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{category.name}</h2>
          <div className="flex flex-col gap-3">
            {category.menu_items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 shrink-0 rounded-sm border ${item.is_veg ? "border-green-600 bg-green-600" : "border-red-600 bg-red-600"}`}
                    />
                    <p className="font-medium">{item.name}</p>
                    {item.is_bestseller ? <Badge variant="outline">Bestseller</Badge> : null}
                  </div>
                  {item.description ? (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="font-medium">₹{item.base_price}</p>
                </div>
                {!item.is_available ? <Badge variant="destructive">Sold out</Badge> : null}
              </div>
            ))}
            {category.menu_items.length === 0 && (
              <p className="text-sm text-muted-foreground">No items in this category yet.</p>
            )}
          </div>
        </section>
      ))}

      {categories.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Menu coming soon.</p>
      )}
    </div>
  );
}
