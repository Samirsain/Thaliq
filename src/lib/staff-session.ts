import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

export type StaffSession = {
  staffId: string;
  restaurantId: string;
  branchId: string | null;
  role: "owner" | "manager" | "waiter" | "kitchen" | "cashier" | "staff";
  name: string;
  sessionVersion: number;
};

export const STAFF_SESSION_COOKIE = "thaliq_staff_session";

function secret(): string {
  const value = process.env.STAFF_SESSION_SECRET;
  if (!value) {
    throw new Error("STAFF_SESSION_SECRET is not configured");
  }
  return value;
}

/** Signs a staff session into an opaque cookie value: base64(payload).hmac */
export function signStaffSession(session: StaffSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

/** Verifies and decodes a staff session cookie value. Returns null if invalid. */
export function verifyStaffSession(token: string | undefined): StaffSession | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Validates the staff session against the database: checks that the staff
 * member is still active and that the session version matches (allowing
 * session revocation via version increment on PIN reset, deactivation, or
 * explicit revocation).
 */
async function validateStaffSession(session: StaffSession): Promise<StaffSession | null> {
  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("staff")
    .select("is_active, session_version")
    .eq("id", session.staffId)
    .maybeSingle();

  if (!staff || !staff.is_active || staff.session_version !== session.sessionVersion) {
    return null;
  }

  return session;
}

/** Reads and verifies the staff session cookie; redirects to /staff if missing/invalid/wrong role. */
export async function requireStaffSession(
  expectedRole: "waiter" | "kitchen" | "cashier",
): Promise<StaffSession> {
  const cookieStore = await cookies();
  const session = verifyStaffSession(cookieStore.get(STAFF_SESSION_COOKIE)?.value);

  if (!session || session.role !== expectedRole) {
    redirect("/staff");
  }

  const valid = await validateStaffSession(session);
  if (!valid) {
    redirect("/staff");
  }

  return valid;
}

/**
 * Requires a unified operational staff session (role "staff"). The unified
 * Orders screen lets one person advance an order through its whole lifecycle
 * (New -> Preparing -> Ready -> Served) without separate kitchen/waiter/cashier
 * logins.
 */
export async function requireOperationalStaffSession(): Promise<StaffSession> {
  const cookieStore = await cookies();
  const session = verifyStaffSession(cookieStore.get(STAFF_SESSION_COOKIE)?.value);

  if (!session || session.role !== "staff") {
    redirect("/staff");
  }

  const valid = await validateStaffSession(session);
  if (!valid) {
    redirect("/staff");
  }

  return valid;
}
