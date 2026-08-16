import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Create account — Klone",
  description: "Create your free Klone account and start generating PDFs.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      variant="signup"
      title="Start creating documents"
      lead="Create your free account. Pick a template, ask your AI assistant to write, and download a finished PDF."
    >
      <AuthCard mode="signup" />
    </AuthShell>
  );
}
