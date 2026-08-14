"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Users, CreditCard, Receipt, Palette } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/restaurants", label: "Restaurants", icon: Store },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/payments", label: "Payments", icon: Receipt },
  { href: "/admin/templates", label: "Templates", icon: Palette },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
