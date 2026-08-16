"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import {
  login,
  register,
  resetPassword,
  type AuthState,
  type RegisterResult,
} from "@/app/actions/auth";
import { GoogleButton } from "./GoogleButton";
import { TextField, PasswordField } from "./AuthFields";
import { EMAIL_PATTERN, PASSWORD_PATTERN } from "./validation";

type Mode = "signin" | "signup";

interface AuthCardProps {
  mode: Mode;
  /** Error reported by /auth/callback (e.g. failed OAuth) — shown in the err slot. */
  urlError?: string;
}

const SUBMIT_CLASSES =
  "w-full bg-[#0a0a0a] px-4 py-3 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[#262626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a] disabled:opacity-60";

/** Fixed bottom toast pill in the landing page's dark style. */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 bg-[#0a0a0a] px-4 py-2.5 text-[13px] text-white"
    >
      <span className="h-1.5 w-1.5 shrink-0 bg-[#aef637]" aria-hidden="true" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="ml-1 text-white/70 transition-colors duration-150 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function AuthCard({ mode, urlError }: AuthCardProps) {
  const [loginState, loginAction, loginPending] = useActionState<
    AuthState,
    FormData
  >(login, undefined);
  const [registerState, registerAction, registerPending] = useActionState<
    RegisterResult | undefined,
    FormData
  >(register, undefined);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Forgot-password (signin) mode.
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [resetState, setResetState] = useState<{
    ok: boolean;
    error?: string;
  } | null>(null);

  // Inline per-field errors (client-side validation).
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "email" | "password", string>>
  >({});

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const pending = mode === "signup" ? registerPending : loginPending;

  // Server-side error: sign-in/sign-up action result, or an OAuth callback
  // failure. Derived at render time and dismissible once the user acts again.
  const serverError =
    (mode === "signup" ? registerState?.error : loginState?.error) ??
    urlError ??
    "";
  const [dismissedServerError, setDismissedServerError] = useState<
    string | null
  >(null);
  const errMsg = dismissedServerError === serverError ? "" : serverError;

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function clearError(field?: "name" | "email" | "password") {
    if (field) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    } else {
      setFieldErrors({});
    }
    setDismissedServerError(serverError || null);
  }

  // Delegate clicks on `a[data-doc]` (terms links) → demo toast.
  // Listens on document since the terms row is rendered by AuthShell,
  // outside this card's own DOM.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        "a[data-doc]",
      ) as HTMLAnchorElement | null;
      if (target) {
        e.preventDefault();
        showToast(`Opening ${target.dataset.doc}… (demo)`);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /** Validate every field at once and show each invalid field's inline error. */
  function handleSubmit(e: React.FormEvent) {
    const emailVal = email.trim();
    const badEmail = !EMAIL_PATTERN.test(emailVal);
    const errors: Partial<Record<"name" | "email" | "password", string>> = {};
    let firstInvalid: "name" | "email" | "password" | null = null;

    if (mode === "signup") {
      if (fullName.trim().length < 2) {
        errors.name = "Please tell us your name.";
        firstInvalid = firstInvalid ?? "name";
      }
      if (badEmail) {
        errors.email = "Please enter a valid email address.";
        firstInvalid = firstInvalid ?? "email";
      }
      if (!PASSWORD_PATTERN.test(password)) {
        errors.password =
          "Use at least 8 characters with uppercase, lowercase, number and symbol.";
        firstInvalid = firstInvalid ?? "password";
      }
    } else if (badEmail) {
      errors.email = "Please enter a valid email address.";
      firstInvalid = "email";
    }

    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      setFieldErrors(errors);
      setDismissedServerError(serverError || null);
      const ref =
        firstInvalid === "name"
          ? nameRef
          : firstInvalid === "email"
            ? emailRef
            : passRef;
      setTimeout(() => ref.current?.focus(), 0);
      return;
    }
    clearError();
  }

  /** Form `action` dispatcher — signup vs signin server action. */
  function handleFormAction(formData: FormData) {
    if (mode === "signup") {
      return registerAction(formData);
    }
    return loginAction(formData);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const emailVal = resetEmail.trim();
    if (!EMAIL_PATTERN.test(emailVal)) {
      setResetState({
        ok: false,
        error: "Please enter a valid email address.",
      });
      return;
    }
    setResetPending(true);
    const result = await resetPassword(emailVal);
    setResetPending(false);
    setResetState(result);
  }

  function exitReset() {
    setResetMode(false);
    setResetEmail("");
    setResetState(null);
    clearError();
  }

  // ---- Forgot-password branch ----
  if (resetMode) {
    return (
      <div>
        {resetState?.ok ? (
          <div className="py-4 text-center">
            <CheckCircle2 size={40} className="mx-auto text-[#65a30d]" />
            <h2 className="mt-4 text-[20px] font-bold tracking-tight text-[#0a0a0a]">
              Check your inbox!
            </h2>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-[#525252]">
              We sent a password reset link to <b>{resetEmail.trim()}</b>.
            </p>
            <button
              type="button"
              onClick={exitReset}
              className="mx-auto mt-6 flex items-center gap-2 text-[13px] font-medium text-[#0a0a0a] underline decoration-[#d4d4d4] underline-offset-2 transition-colors duration-150 hover:text-[#404040] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
            >
              <ArrowLeft size={14} /> Back to login
            </button>
          </div>
        ) : (
          <>
            <TextField
              ref={emailRef}
              name="resetEmail"
              type="email"
              placeholder="Enter email address"
              autoComplete="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              onInput={() => setResetState(null)}
              error={resetState && !resetState.ok ? resetState.error : undefined}
            />
            <button
              type="button"
              onClick={handleReset}
              disabled={resetPending}
              className={`${SUBMIT_CLASSES} mt-4`}
            >
              {resetPending ? "Sending…" : "Send reset link"}
            </button>
            {errMsg && (
              <p className="mt-3 text-[12px] text-red-600" role="alert">
                {errMsg}
              </p>
            )}
            <p className="mt-5 text-[13px] text-[#525252]">
              Remembered it?{" "}
              <button
                type="button"
                onClick={exitReset}
                className="font-semibold text-[#0a0a0a] underline decoration-[#d4d4d4] underline-offset-2 transition-colors duration-150 hover:text-[#404040]"
              >
                Back to login
              </button>
            </p>
          </>
        )}
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ---- Main sign-in / sign-up form ----
  const submitLabel = mode === "signup" ? "Sign up" : "Continue";

  return (
    <div>
      <GoogleButton
        label={mode === "signup" ? "Sign up with Google" : "Continue with Google"}
      />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#ededed]" />
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a8a8a]">
          or
        </span>
        <span className="h-px flex-1 bg-[#ededed]" />
      </div>

      <form action={handleFormAction} onSubmit={handleSubmit} noValidate>
        {mode === "signup" && (
          <div className="mb-4">
            <TextField
              ref={nameRef}
              name="fullName"
              type="text"
              placeholder="Enter your name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onInput={() => clearError("name")}
              error={fieldErrors.name}
            />
          </div>
        )}

        <div className="mb-4">
          <TextField
            ref={emailRef}
            name="email"
            type="email"
            placeholder="Enter email address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onInput={() => clearError("email")}
            error={fieldErrors.email}
          />
        </div>

        <PasswordField
          ref={passRef}
          name="password"
          placeholder={mode === "signup" ? "Create a password" : "Password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onInput={() => clearError("password")}
          error={fieldErrors.password}
        />

        <button
          type="submit"
          disabled={pending}
          className={`${SUBMIT_CLASSES} mt-5`}
        >
          {submitLabel}
        </button>

        {errMsg && (
          <p className="mt-3 text-[12px] text-red-600" role="alert">
            {errMsg}
          </p>
        )}
      </form>

      {mode === "signin" && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              clearError();
              setResetMode(true);
            }}
            className="text-[13px] font-medium text-[#525252] underline decoration-[#d4d4d4] underline-offset-2 transition-colors duration-150 hover:text-[#0a0a0a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a]"
          >
            Forgot password?
          </button>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
