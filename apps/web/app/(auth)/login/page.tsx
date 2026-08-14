import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
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
    <AuthShell title="Welcome back">
      <AuthCard mode="signin" urlError={urlError} />
    </AuthShell>
  );
}
