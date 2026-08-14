import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account — THALIQ" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignupForm />
    </div>
  );
}
