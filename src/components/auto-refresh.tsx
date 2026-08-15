"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the server component tree via router.refresh() on an interval.
 *
 * Customers and PIN-authenticated staff never hold a Supabase Auth session,
 * so a browser-side Supabase Realtime subscription would connect as `anon`
 * — which correctly can't read orders/waiter_requests/bills under RLS
 * (member-only policies, see supabase/migrations/*_rls_policies.sql). Short
 * polling through the already-authorized server component (which reads via
 * the service-role client after verifying the staff/order token) gets the
 * same "no manual refresh" outcome without weakening that boundary.
 */
export function AutoRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
