import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Create account — Klone",
  description: "Create your free Klone account and start generating PDFs.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login">Log in</Link>
        </>
      }
    >
      <AuthCard mode="signup" />
    </AuthShell>
  );
}
