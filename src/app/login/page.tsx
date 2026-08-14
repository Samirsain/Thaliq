import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in — THALIQ" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <LoginForm />
    </div>
  );
}
