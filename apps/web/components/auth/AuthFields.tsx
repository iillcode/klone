"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputBase =
  "h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-muted-foreground/50";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  icon?: React.ReactNode;
}

/** Labeled text input with a leading icon, styled for the auth screens. */
export function TextField({
  label,
  icon,
  className = "",
  ...props
}: TextFieldProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-foreground">
          {label}
        </span>
      )}
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
            {icon}
          </span>
        )}
        <input {...props} className={`${inputBase} ${className}`} />
      </span>
    </label>
  );
}

interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  name: string;
  label?: string;
  icon?: React.ReactNode;
}

/** Password input with a show/hide toggle. */
export function PasswordField({
  label,
  icon,
  className = "",
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-foreground">
          {label}
        </span>
      )}
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          {...props}
          type={visible ? "text" : "password"}
          className={`${inputBase} pr-11 ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}
