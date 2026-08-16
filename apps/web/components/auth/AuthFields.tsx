"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const INPUT_CLASSES =
  "w-full border border-[#2a2a2c] bg-[#1c1c1d] px-4 py-3 text-[14px] text-[#ededed] placeholder:text-[#5a5a5e] transition-colors duration-150 focus:border-[#aef637] focus:outline-none";

/** Error message shown under an invalid input. */
function FieldError({ id, error }: { id: string; error: string }) {
  return (
    <p className="mt-1.5 text-[12px] text-red-600" id={id} role="alert">
      {error}
    </p>
  );
}

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  /** Appended to the input (kept for API compatibility). */
  className?: string;
  /** Inline error message shown below the field. */
  error?: string;
}

/** Text input styled for the dark editorial auth screens. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ name, className = "", error, ...props }, ref) {
    const errorId = `${name}-error`;
    return (
      <div>
        <input
          ref={ref}
          name={name}
          {...props}
          className={`${INPUT_CLASSES} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error && <FieldError id={errorId} error={error} />}
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
  /** Inline error message shown below the field. */
  error?: string;
}

/** Password input with a show/hide toggle. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { name, className = "", inputRef, error, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false);
    const errorId = `${name}-error`;
    return (
      <div>
        <div className="relative">
          <input
            ref={inputRef ?? ref}
            name={name}
            type={visible ? "text" : "password"}
            {...props}
            className={`${INPUT_CLASSES} pr-11 ${className}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8a8a] transition-colors duration-150 hover:text-[#ededed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && <FieldError id={errorId} error={error} />}
      </div>
    );
  },
);
