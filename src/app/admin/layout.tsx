import Link from "next/link";

import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { Button } from "@/components/ui/button";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { signOutOwner } from "@/app/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r p-4 md:flex md:flex-col md:justify-between">
        <div>
          <Link href="/admin" className="mb-6 block px-3 text-lg font-semibold">
            THALIQ Admin
          </Link>
          <AdminSidebarNav />
        </div>
        <form action={signOutOwner} className="px-3">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start px-0">
            Sign out
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
