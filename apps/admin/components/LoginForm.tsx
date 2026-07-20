"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/app/actions/auth";

export default function LoginForm() {
  const [loginState, loginAction, loginPending] = useActionState<
    AuthState,
    FormData
  >(login, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-panel border border-white/5 p-8">
        <h1 className="text-xl font-semibold text-white mb-1">DevLibrary Admin</h1>
        <p className="text-sm text-zinc-500 mb-6">Sign in to your admin account.</p>

        <form action={loginAction} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20"
          />
          <button
            type="submit"
            disabled={loginPending}
            className="w-full rounded-lg bg-white text-black font-medium py-2 text-sm disabled:opacity-60"
          >
            {loginPending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {loginState?.error && (
          <p className="mt-4 text-sm text-red-400">{loginState.error}</p>
        )}
      </div>
    </div>
  );
}
