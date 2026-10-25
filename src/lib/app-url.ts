/**
 * Centralized public application URL.
 *
 * Used for QR codes and other externally-facing links that must resolve to
 * the deployed app, not localhost.
 *
 * Set NEXT_PUBLIC_APP_URL to the public origin of the deployed app
 * (e.g. https://baser-gilt.vercel.app). When unset, falls back to the local
 * dev origin so QR codes still work during development.
 *
 * Changing the production domain later (e.g. to https://qr.cr) only requires
 * updating the environment variable — no code changes needed.
 */
export function publicAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  // Strip trailing slashes so callers can safely append paths.
  return url.replace(/\/+$/, "");
}
