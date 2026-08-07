"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import {
  login,
  resetPassword,
  type AuthState,
  type ResetPasswordResult,
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

interface LoginFormProps {
  /** Set when /auth/callback redirects back with an error (e.g. OAuth). */
  urlError?: string;
}

export function LoginForm({ urlError }: LoginFormProps) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    login,
    undefined,
  );

  // Inline "forgot password" mode — swaps the form for a reset-email form.
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [resetState, setResetState] = useState<
    ResetPasswordResult | undefined
  >(undefined);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPending(true);
    setResetState(undefined);
    const result = await resetPassword(resetEmail);
    setResetState(result);
    setResetPending(false);
  };

  const error = state?.error ?? urlError;

  if (resetMode) {
    return (
      <div className="space-y-5">
        {resetState?.ok ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Check your email</div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                If an account exists for{" "}
                <span className="font-medium text-foreground">{resetEmail}</span>,
                we sent you a link to reset your password.
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Reset your password
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your account email and we&apos;ll send you a reset link.
              </p>
            </div>

            {resetState?.error && <ErrorAlert message={resetState.error} />}

            <form onSubmit={handleReset} className="space-y-4">
              <TextField
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
              />
              <button
                type="submit"
                disabled={resetPending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                {resetPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </button>
              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </button>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleButton />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          or continue with email
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {error && <ErrorAlert message={error} />}

      <form action={action} className="space-y-4">
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
          autoComplete="current-password"
          placeholder="Password"
          icon={<Lock className="h-4 w-4" />}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setResetMode(true)}
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
