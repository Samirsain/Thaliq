import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;

/** Hashes a 4-digit staff PIN for storage in `staff.pin_hash`. */
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

/** Verifies a PIN against a stored `salt:hash` value. */
export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const candidate = scryptSync(pin, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");

  return (
    candidate.length === expected.length &&
    timingSafeEqual(candidate, expected)
  );
}
