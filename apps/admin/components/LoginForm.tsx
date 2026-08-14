"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/app/actions/auth";
import { Lock } from "lucide-react";

export default function LoginForm() {
  const [loginState, loginAction, loginPending] = useActionState<
    AuthState,
    FormData
  >(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/20">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid size-11 place-items-center rounded-xl bg-[#22c55e]">
            <span className="text-[15px] font-extrabold leading-none text-black">
              K
            </span>
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Klone Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your admin account.
          </p>
        </div>

        <form action={loginAction} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring"
          />
          <button
            type="submit"
            disabled={loginPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-60"
          >
            {loginPending ? (
              "Signing in…"
            ) : (
              <>
                <Lock className="size-4" />
                Sign in
              </>
            )}
          </button>
        </form>

        {loginState?.error && (
          <p className="mt-4 text-center text-sm text-destructive">
            {loginState.error}
          </p>
        )}
      </div>
    </div>
  );
}
