import Link from "next/link";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { signOutOwner } from "@/app/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const restaurant = await requireCurrentRestaurant();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r p-4 md:flex md:flex-col md:justify-between">
        <div>
          <Link href="/dashboard" className="mb-6 block px-3 text-lg font-semibold">
            THALIQ
          </Link>
          <SidebarNav />
        </div>
        <div className="border-t pt-4">
          <p className="truncate px-3 text-sm font-medium">{restaurant.restaurantName}</p>
          <p className="px-3 text-xs text-muted-foreground capitalize">{restaurant.role}</p>
          <form action={signOutOwner} className="mt-2 px-3">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start px-0">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
