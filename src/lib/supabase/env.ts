/**
 * Reads a Supabase credential from the environment and fails loudly if it
 * looks wrong.
 *
 * The Supabase dashboard renders API keys masked (`sb_publishable_••••`), and
 * copying that masked text instead of clicking Reveal/Copy is an easy mistake.
 * Supabase sends the key in the `apikey` HTTP header, and header values must
 * be a ByteString — so a `•` (U+2022) blows up at the first request with
 * "Cannot convert argument to a ByteString…", which says nothing about which
 * variable is at fault. Catch it here with a message that names the variable.
 */
function readCredential(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Add it in your hosting provider's environment variables (see .env.example) and redeploy.`,
    );
  }

  if (/[^\x20-\x7E]/.test(value)) {
    throw new Error(
      `${name} contains non-ASCII characters (e.g. the "•" used to mask secrets in the Supabase dashboard). ` +
        `You likely copied the hidden value — use the Reveal/Copy button on Supabase → Settings → API to get the real key, then redeploy.`,
    );
  }

  return value;
}

export function supabaseUrl(): string {
  return readCredential("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return readCredential("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseServiceRoleKey(): string {
  return readCredential("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
