"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/app/actions/auth";

/** Official Google "G" mark (four brand colors), 24x24 viewBox. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3 .55 4.1 1.62l3.07-3.07C17.3 2.19 14.87 1.2 12 1.2 7.78 1.2 4.13 3.62 2.35 7.15l3.58 2.78C6.78 7.32 9.17 5.4 12 5.4z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.28H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.68 2.85c2.15-1.99 3.75-4.93 3.75-8.66z"
      />
      <path
        fill="#FBBC05"
        d="M5.93 14.07a6.6 6.6 0 0 1 0-4.14L2.35 7.15a10.8 10.8 0 0 0 0 9.7l3.58 2.78z"
      />
      <path
        fill="#34A853"
        d="M12 22.8c2.87 0 5.28-.95 7.04-2.57l-3.68-2.85c-1.02.69-2.33 1.1-3.36 1.1-2.83 0-5.22-1.92-6.07-4.5l-3.58 2.78C4.13 20.38 7.78 22.8 12 22.8z"
      />
    </svg>
  );
}

interface GoogleButtonProps {
  label?: string;
}

/** Google OAuth button styled for the dark editorial auth screens. */
export function GoogleButton({ label = "Continue with Google" }: GoogleButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if ("url" in result) {
        window.location.href = result.url;
      } else {
        setError(result.error);
        setPending(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2.5 border border-[#2a2a2c] bg-[#1c1c1d] px-4 py-3 text-[14px] font-medium text-[#ededed] transition-colors duration-150 hover:border-[#3f3f42] hover:bg-[#232324] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637] disabled:opacity-60"
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? <Loader2 size={18} className="animate-spin" /> : <GoogleMark />}
        <span>{pending ? "Redirecting to Google…" : label}</span>
      </button>
      {error && (
        <p className="mt-2 text-[12px] text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
