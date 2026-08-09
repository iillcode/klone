/**
 * Shared client-side validation patterns used by the auth forms.
 * Real-time validation is pattern-only — each validator returns an error
 * message (or empty string when valid).
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
 * Strong password: at least 8 characters, with at least one uppercase
 * letter, one lowercase letter, one number and one symbol.
 */
export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const FULL_NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;

export function validateEmail(value: string): string {
  const v = value.trim();
  if (v === "") return "";
  if (!EMAIL_PATTERN.test(v)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(value: string): string {
  if (value === "") return "";
  if (!PASSWORD_PATTERN.test(value)) {
    return "Use at least 8 characters with uppercase, lowercase, number and symbol.";
  }
  return "";
}

export function validateFullName(value: string): string {
  const v = value.trim();
  if (v === "") return "";
  if (!FULL_NAME_PATTERN.test(v)) {
    return "Use at least 2 letters (A–Z, spaces, apostrophes or hyphens).";
  }
  return "";
}

export function validateConfirmPassword(
  password: string,
  confirm: string,
): string {
  if (confirm === "") return "";
  if (confirm !== password) return "Passwords do not match.";
  return "";
}
