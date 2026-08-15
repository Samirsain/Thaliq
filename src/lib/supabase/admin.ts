import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role client for server-only code paths that must bypass RLS by
 * design: staff PIN login (no Supabase Auth session exists yet) and
 * platform-admin operations. Never import this into client components or
 * expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false },
  });
}
