/**
 * Builds a standard UPI deep link (NPCI's `upi://pay` spec).
 *
 * Rendered as a QR, any UPI app (GPay, PhonePe, Paytm, bank apps) will open
 * with the payee and amount pre-filled. Money moves directly from customer
 * to restaurant — THALIQ is not in the payment path, so this needs no
 * gateway, no merchant onboarding and costs nothing per transaction.
 */
export function buildUpiUri({
  upiId,
  payeeName,
  amount,
  note,
}: {
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
}): string {
  const params: [string, string][] = [
    ["pa", upiId],
    ["pn", payeeName],
    ["am", amount.toFixed(2)],
    ["cu", "INR"],
  ];

  if (note) params.push(["tn", note]);

  // Built with encodeURIComponent rather than URLSearchParams: the latter
  // encodes spaces as "+", which some UPI apps render literally in the payee
  // name ("The+Coffee+House"). Percent-encoding is understood everywhere.
  return `upi://pay?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;
}

/** Loose VPA check — `name@bank`, which is all the UPI spec really guarantees. */
export function isValidUpiId(value: string): boolean {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
}
