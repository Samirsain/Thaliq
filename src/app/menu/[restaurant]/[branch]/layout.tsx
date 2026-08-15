import { CartProvider } from "@/components/menu/cart-provider";

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
