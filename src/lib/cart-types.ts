export type CartAddon = { id: string; name: string; price: number };

export type CartLine = {
  key: string;
  itemId: string;
  itemName: string;
  isVeg: boolean;
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
  addons: CartAddon[];
  quantity: number;
  specialInstructions: string;
};

export function lineTotal(line: CartLine): number {
  const addonsTotal = line.addons.reduce((sum, addon) => sum + addon.price, 0);
  return (line.unitPrice + addonsTotal) * line.quantity;
}
