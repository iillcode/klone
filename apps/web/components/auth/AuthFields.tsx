"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  /** Appended to the input (used to surface the "bad" shake class). */
  className?: string;
  /** Inline error message shown below the field (red, left-aligned). */
  error?: string;
}

/** Text input styled for the auth screens (Mobbin-style dark fields). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ name, className = "", error, ...props }, ref) {
    const errorId = `${name}-error`;
    return (
      <div className="field">
        <input
          ref={ref}
          name={name}
          {...props}
          className={className}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error && (
          <p className="field-error" id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  name: string;
  className?: string;
  /** Ref used to focus the password input on validation failure. */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Inline error message shown below the field (red, left-aligned). */
  error?: string;
}

/** Password input with a show/hide toggle. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ name, className = "", inputRef, error, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const errorId = `${name}-error`;
    return (
      <div className="field">
        <input
          ref={inputRef ?? ref}
          name={name}
          type={visible ? "text" : "password"}
          {...props}
          className={className}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          className="eye show"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
        {error && (
          <p className="field-error" id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);