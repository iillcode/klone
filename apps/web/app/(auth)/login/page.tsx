import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Sign in — Klone",
  description: "Sign in to Klone and keep creating PDFs.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const urlError =
    error === "auth_callback"
      ? "Sign-in could not be completed. Please try again."
      : undefined;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Klone account and keep creating."
      footer={
        <>
          New to Klone?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm urlError={urlError} />
    </AuthShell>
  );
}
