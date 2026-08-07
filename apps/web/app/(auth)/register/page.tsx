import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Create account — Klone",
  description: "Create your free Klone account and start generating PDFs.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start turning prompts into polished PDFs — free forever."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
