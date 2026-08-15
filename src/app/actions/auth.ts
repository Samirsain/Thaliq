"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null; notice?: string | null };

export async function signUpOwner(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { error: error.message };
  }

  // With "Confirm email" enabled (the Supabase default), signUp creates the
  // user but returns no session until the emailed link is clicked. Redirecting
  // to /onboarding here would bounce straight back to /login and look like the
  // signup silently failed, so say what actually happened instead.
  if (!data.session) {
    return {
      error: null,
      notice: `Account created. Check ${email} for a confirmation link, then sign in.`,
    };
  }

  redirect("/onboarding");
}

export async function signInOwner(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOutOwner() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
