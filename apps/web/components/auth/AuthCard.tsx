"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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

/** Fixed bottom toast pill (reference `.toast.show`). */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast show" role="status">
      <i />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss" style={{ background: "none", border: 0, color: "#fff", cursor: "pointer", marginLeft: 4 }}>
        ×
      </button>
    </div>
  );
}

export function AuthCard({ mode, urlError }: AuthCardProps) {
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, undefined);
  const [registerState, registerAction, registerPending] = useActionState<RegisterResult, FormData>(register, undefined);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Forgot-password (signin) mode.
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [resetState, setResetState] = useState<{ ok: boolean; error?: string } | null>(null);

  // Inline per-field errors (client-side validation).
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "email" | "password", string>>>({});
  // Global err slot — used for server/auth errors that aren't field-specific.
  const [errMsg, setErrMsg] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const authBodyRef = useRef<HTMLDivElement>(null);

  const pending = mode === "signup" ? registerPending : loginPending;

  // Delegate clicks on `a[data-doc]` (terms links) → demo toast.
  // Listens on document since the terms row is rendered by AuthShell,
  // outside this card's own DOM.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a[data-doc]") as HTMLAnchorElement | null;
      if (target) {
        e.preventDefault();
        showToast(`Opening ${target.dataset.doc}… (demo)`);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sign-in errors → surface in the err slot (reference `.err.show`).
  useEffect(() => {
    if (loginState?.error) {
      setErrMsg(loginState.error);
    }
  }, [loginState]);

  // Sign-up errors → surface in the err slot. On success the server action
  // auto-logs the user in and redirects to the dashboard (no success page).
  useEffect(() => {
    if (registerState?.error) {
      setErrMsg(registerState.error);
    }
  }, [registerState]);

  // Callback error (OAuth) → surface it in the err slot right away.
  useEffect(() => {
    if (urlError) {
      setErrMsg(urlError);
    }
  }, [urlError]);

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
    setErrMsg("");
  }

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
        errors.email = "Hmm, that email doesn't look right.";
        firstInvalid = firstInvalid ?? "email";
      }
      if (!PASSWORD_PATTERN.test(password)) {
        errors.password =
          "Use at least 8 characters with uppercase, lowercase, number and symbol.";
        firstInvalid = firstInvalid ?? "password";
      }
    } else if (badEmail) {
      errors.email = "Hmm, that email doesn't look right.";
      firstInvalid = "email";
    }

    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      setFieldErrors(errors);
      setErrMsg("");
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
      setResetState({ ok: false, error: "Hmm, that email doesn't look right." });
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
      <div className="panel-body">
        <div className="auth-body" ref={authBodyRef}>
          {resetState?.ok ? (
            <div className="reset-done">
              <CheckCircle2 className="reset-ck" />
              <h2 className="reset-title">Check your inbox!</h2>
              <p className="reset-msg">
                We sent a password reset link to <b>{resetEmail.trim()}</b>.
              </p>
              <button type="button" className="backbtn" onClick={exitReset}>
                <ArrowLeft /> Back to login
              </button>
            </div>
          ) : (
            <>
              <div className="field fx">
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
                  className={resetState && !resetState.ok ? "bad" : ""}
                />
              </div>
              <div className="fx">
                <button
                  type="button"
                  className={`submit${resetPending ? " loading" : ""}`}
                  onClick={handleReset}
                  disabled={resetPending}
                >
                  Send reset link
                </button>
              </div>
              <div className="err" id="errMsg">
                {!resetState?.ok ? "" : resetState?.error ?? errMsg}
              </div>
              <p className="swap fx">
                Remembered it?{" "}
                <button type="button" onClick={exitReset} style={{ background: "none", border: 0, color: "#fff", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
                  Back to login
                </button>
              </p>
            </>
          )}
        </div>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ---- Main sign-in / sign-up form ----
  const submitLabel = mode === "signup" ? "Sign up" : "Continue";

  return (
    <div className="panel-body">
      <div className="auth-body" ref={authBodyRef}>
        <div className="fx">
          <GoogleButton label={mode === "signup" ? "Sign up with Google" : "Continue with Google"} />
        </div>

        <div className="divider fx">or</div>

        <form action={handleFormAction} onSubmit={handleSubmit} noValidate>
          {/* Name field — signup only, animates in via .extra.open (reference). */}
          <div className={`extra${mode === "signup" ? " open" : ""}`}>
            <div>
              {mode === "signup" && (
                <div className="field fx">
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
                    className={fieldErrors.name ? "bad" : ""}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="field fx">
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
              className={fieldErrors.email ? "bad" : ""}
            />
          </div>

          <div className="field fx">
            <PasswordField
              ref={passRef}
              name="password"
              placeholder={mode === "signup" ? "Create a password" : "Password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInput={() => clearError("password")}
              error={fieldErrors.password}
              className={fieldErrors.password ? "bad" : ""}
            />
          </div>

          <div className="fx">
            <button type="submit" className={`submit${pending ? " loading" : ""}`} id="submitBtn">
              {pending ? "" : submitLabel}
            </button>
          </div>
          <div className={errMsg ? "err show" : "err"} id="errMsg">
            {errMsg}
          </div>
        </form>

        {mode === "signin" && (
          <button type="button" className="forgot fx" onClick={() => { clearError(); setResetMode(true); }}>
            Forgot password?
          </button>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}