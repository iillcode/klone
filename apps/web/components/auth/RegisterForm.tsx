"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import {
  register,
  type RegisterResult,
} from "@/app/actions/auth";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordField, TextField } from "@/components/auth/AuthFields";

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<
    RegisterResult | undefined,
    FormData
  >(register, undefined);

  // Registration succeeded and email confirmation is required.
  const success = state?.success;

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <div className="font-semibold text-foreground">Account created</div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Check your inbox for a confirmation link, then sign in to start
            creating documents.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-primary hover:underline"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleButton />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          or sign up with email
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {state?.error && <ErrorAlert message={state.error} />}

      <form action={action} className="space-y-4">
        <TextField
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Full name"
          icon={<User className="h-4 w-4" />}
        />
        <TextField
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
        />
        <PasswordField
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Password"
          icon={<Lock className="h-4 w-4" />}
        />
        <PasswordField
          name="confirmPassword"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Confirm password"
          icon={<Lock className="h-4 w-4" />}
        />

        <p className="text-xs leading-relaxed text-muted-foreground">
          At least 6 characters. By creating an account you agree to Klone&apos;s{" "}
          <span className="font-medium text-foreground">Terms of Service</span>{" "}
          and <span className="font-medium text-foreground">Privacy Policy</span>.
        </p>

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
