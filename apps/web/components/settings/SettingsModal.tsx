"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { UserProfile } from "@/lib/data/users";
import { updateProfile } from "@/app/actions/profile";
import { resetPassword, logout } from "@/app/actions/auth";
import { useTheme } from "@/components/ui/theme-provider";
import {
  Check,
  CreditCard,
  ExternalLink,
  Gem,
  Loader2,
  Lock,
  LogOut,
  Monitor,
  Search,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { pressClasses } from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Types + nav config
// ---------------------------------------------------------------------------

type SectionId = "profile" | "security" | "payments" | "appearance";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

const ACCOUNT_NAV: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "payments", label: "Payments", icon: CreditCard },
];

const PREF_NAV: { id: SectionId; label: string; icon: typeof Monitor }[] = [
  { id: "appearance", label: "Appearance", icon: Monitor },
];

const ADVANCED_NAV: {
  id: SectionId;
  label: string;
  icon: typeof Monitor;
}[] = [];

// ---------------------------------------------------------------------------
// Persistence helpers (system caching via localStorage)
// ---------------------------------------------------------------------------

/**
 * useState synced to localStorage. Reads the stored value once on mount
 * (after hydration) and writes every change — preferences survive reloads.
 */
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        // Intentional: hydrate the stored value once after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // ignore unparsable/private-mode storage
    }
    loadedRef.current = true;
  }, [key]);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota / availability errors
    }
  }, [key, value]);

  return [value, setValue] as const;
}

// ---------------------------------------------------------------------------
// Small UI primitives (mirroring the reference template's classes)
// ---------------------------------------------------------------------------

const btn = pressClasses("dark", "sm");
const btnPrimary = pressClasses("primary", "sm");
const btnSm = "px-2.5 py-1 gap-1.5";
const inputCls =
  "w-full h-[38px] rounded-[9px] border border-[#262626] bg-[#1e1e1e] px-3 text-[13.5px] text-[#f5f5f5] placeholder:text-[#6f6f6f] transition-[border-color,box-shadow] focus:border-[#aef637] focus:outline-none focus:ring-[3px] focus:ring-[#aef637]/15";
const labelCls = "mb-1.5 block text-[12.5px] font-semibold text-[#a3a3a3]";
const stBlue =
  "inline-flex items-center rounded-full bg-[#16245a] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#8fb3ff]";
const stGreen =
  "inline-flex items-center rounded-full bg-[#123524] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#4ade80]";
const stYellow =
  "inline-flex items-center rounded-full bg-[#3a2b12] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#fbbf24]";

function Panel({
  children,
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[14px] border ${
        danger ? "border-[#f87171]/30" : "border-[#1f1f1f]"
      } bg-[#1a1a1a]`}
    >
      {children}
    </div>
  );
}

function Prow({
  children,
  block,
  flexStart,
}: {
  children: React.ReactNode;
  block?: boolean;
  flexStart?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-[15px] ${
        block ? "block" : ""
      } ${flexStart ? "flex-col items-start gap-3.5" : ""} [&+&]:border-t [&+&]:border-t-[#1f1f1f]`}
    >
      {children}
    </div>
  );
}

function RowText({ b, span }: { b: React.ReactNode; span: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <b className="block text-[13.5px] font-semibold text-[#f5f5f5]">{b}</b>
      <span className="mt-0.5 block text-[12.5px] text-[#a3a3a3]">{span}</span>
    </div>
  );
}

function PanelFoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end gap-2.5 border-t border-[#1f1f1f] bg-[#181818] px-5 py-[13px]">
      {children}
    </div>
  );
}

function SecTitle({ h, p }: { h: string; p: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2.5">
      <h3 className="text-[15px] font-bold text-[#f5f5f5]">{h}</h3>
      <p className="text-[12.5px] text-[#6f6f6f]">{p}</p>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  defaultChecked,
}: {
  checked?: boolean;
  onChange?: (v: boolean) => void;
  defaultChecked?: boolean;
}) {
  const [internal, setInternal] = useState(Boolean(defaultChecked));
  const on = checked ?? internal;
  const toggle = () => {
    if (onChange) onChange(!on);
    else setInternal(!on);
  };
  return (
    <label className="relative block h-[22px] w-[38px] flex-none">
      <input
        type="checkbox"
        className="absolute inset-0 m-0 cursor-pointer opacity-0"
        checked={on}
        onChange={toggle}
      />
      <i
        className={`pointer-events-none absolute inset-0 rounded-full border transition-colors duration-200 ${
          on ? "border-[#aef637] bg-[#aef637]" : "border-[#333] bg-[#2a2a2a]"
        }`}
      >
        <span
          className={`absolute top-[3px] h-[14px] w-[14px] rounded-full transition-all duration-200 ${
            on ? "left-[19px] bg-white" : "left-[3px] bg-[#9a9a9a]"
          }`}
        />
      </i>
    </label>
  );
}

function InitialsAvatar({
  name,
  size,
  tone,
}: {
  name: string;
  size: string;
  tone: string;
}) {
  const initials = (name || "K")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`${size} flex-none rounded-full font-bold ${tone}`}
      style={{
        display: "grid",
        placeItems: "center",
        fontSize: size === "h-[64px] w-[64px]" ? "20px" : "11px",
      }}
    >
      {initials}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function ProfileSection({ profile }: { profile: UserProfile | null }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [email] = useState(profile?.email ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfile({
        full_name: fullName.trim() || null,
        username: username.trim() || null,
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div id="settings-profile" className="space-y-4">
      <SecTitle h="Profile" p="How you appear across Klone." />
      <Panel>
        <div className="flex items-center gap-4 border-b border-[#1f1f1f] p-5">
          <InitialsAvatar
            name={fullName}
            size="h-16 w-16"
            tone="bg-[#16245a] text-[#8fb3ff]"
          />
          <div className="min-w-0 flex-1">
            <b className="block text-[14px] text-[#f5f5f5]">
              {fullName || "—"}
            </b>
            <span className="text-[12.5px] text-[#a3a3a3]">
              {email} ·{" "}
              {(profile?.plan ?? "free") === "pro" ? "Pro plan" : "Hobby plan"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="fn">
                Full name
              </label>
              <input
                id="fn"
                className={inputCls}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="un">
                Username
              </label>
              <input
                id="un"
                className={inputCls}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="em">
                Email
              </label>
              <input
                id="em"
                type="email"
                className={`${inputCls} opacity-60`}
                value={email}
                readOnly
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="px-5 pb-1 text-[12.5px] text-[#f87171]">{error}</p>
        )}
        <PanelFoot>
          {saved && (
            <span className="mr-auto inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#4ade80]">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <button
            className={btnPrimary}
            type="button"
            onClick={handleSave}
            disabled={pending}
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </button>
        </PanelFoot>
      </Panel>
    </div>
  );
}

function SecuritySection({ profile }: { profile: UserProfile | null }) {
  const [resetPending, startReset] = useTransition();
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  return (
    <div id="settings-security" className="space-y-3">
      <SecTitle h="Security" p="Password and active sessions." />
      <Panel>
        <Prow flexStart>
          <RowText
            b="Change password"
            span="We'll email you a secure reset link."
          />
          <button
            className={cn(btn, btnSm)}
            type="button"
            disabled={resetPending}
            onClick={() => {
              setResetMsg(null);
              startReset(async () => {
                const email = profile?.email;
                if (!email) {
                  setResetMsg("No email on file.");
                  return;
                }
                const res = await resetPassword(email);
                setResetMsg(
                  res.ok
                    ? "Reset link sent to your email."
                    : (res.error ?? "Something went wrong."),
                );
              });
            }}
          >
            {resetPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            Update password
          </button>
          {resetMsg && (
            <p className="text-[12.5px] text-[#a3a3a3]">{resetMsg}</p>
          )}
        </Prow>
      </Panel>
    </div>
  );
}

interface PaymentRow {
  id: string;
  created_at: string;
  description: string | null;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_reference: string | null;
  subscription_id: string | null;
  active: boolean;
}

function PaymentsSection({ profile }: { profile: UserProfile | null }) {
  const [rows, setRows] = useState<PaymentRow[] | null>(null);
  const [dodoCustomerId, setDodoCustomerId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null,
  );
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [portalLoginUrl, setPortalLoginUrl] = useState<string | null>(null);
  const [portalOpening, setPortalOpening] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/payments", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load payments");
        if (!cancelled) {
          setRows(json.payments ?? []);
          setDodoCustomerId(json.dodoCustomerId ?? null);
          setSubscriptionStatus(json.subscriptionStatus ?? null);
          setActivePaymentId(json.activePaymentId ?? null);
          setPortalLoginUrl(json.portalLoginUrl ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Open the Dodo customer portal. If we have a Dodo customer id, request a
  // dynamic session (drops the user straight in, no email re-entry);
  // otherwise fall back to the static email-based login link.
  const openPortal = async () => {
    if (portalOpening) return;
    setPortalOpening(true);
    try {
      if (dodoCustomerId) {
        const res = await fetch("/api/billing-portal", {
          method: "POST",
          cache: "no-store",
        });
        const json = await res.json();
        if (res.ok && json.url) {
          window.open(json.url, "_blank", "noreferrer");
          return;
        }
        // Fall through to static link on any error (e.g. no_customer).
      }
      if (portalLoginUrl) {
        window.open(portalLoginUrl, "_blank", "noreferrer");
      }
    } finally {
      setPortalOpening(false);
    }
  };

  const hasActiveSub = subscriptionStatus === "active";
  const isCancelled =
    subscriptionStatus === "cancelled" || subscriptionStatus === "expired";
  const isProOrActive = profile?.plan === "pro" || hasActiveSub;

  return (
    <div id="settings-payments" className="space-y-3">
      <SecTitle h="Payments" p="Transactions and your billing portal." />

      {isProOrActive ? (
        <Panel>
          <div className="flex items-center justify-between gap-4 px-5 py-[15px]">
            <RowText
              b="Dodo Payments portal"
              span={
                isCancelled
                  ? "Your plan is cancelled — you keep Pro until the period ends, then revert to Hobby."
                  : "Manage your subscription, update payment methods and download invoices."
              }
            />
            {portalLoginUrl || dodoCustomerId ? (
              <button
                className={cn(btnPrimary, btnSm)}
                type="button"
                onClick={openPortal}
                disabled={portalOpening}
              >
                {portalOpening ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                Manage billing
              </button>
            ) : (
              <span className="text-[12.5px] text-[#a3a3a3]">
                Portal not configured
              </span>
            )}
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className="flex items-center justify-between gap-4 px-5 py-[15px]">
            <RowText
              b="No active subscription"
              span="Upgrade to Klone Pro to unlock the billing portal."
            />
            <button
              className={cn(btnPrimary, btnSm)}
              type="button"
              onClick={() => (window.location.href = "/pricing")}
            >
              <Gem className="h-3.5 w-3.5" /> Upgrade
            </button>
          </div>
        </Panel>
      )}

      <Panel>
        <div className="overflow-x-auto">
          {loadError && (
            <p className="px-5 py-4 text-[12.5px] text-[#f87171]">
              {loadError}
            </p>
          )}
          {!loadError && rows === null && (
            <div className="flex items-center gap-2 px-5 py-6 text-[12.5px] text-[#a3a3a3]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading payments…
            </div>
          )}
          {!loadError && rows !== null && rows.length === 0 && (
            <p className="px-5 py-6 text-[12.5px] text-[#a3a3a3]">
              No payment records yet.
            </p>
          )}
          {!loadError && rows !== null && rows.length > 0 && (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] font-semibold uppercase tracking-wider text-[#6f6f6f]">
                  <th className="border-b border-b-[#1f1f1f] px-5 py-2.5">
                    Date
                  </th>
                  <th className="border-b border-b-[#1f1f1f] px-5 py-2.5">
                    Description
                  </th>
                  <th className="border-b border-b-[#1f1f1f] px-5 py-2.5">
                    Amount
                  </th>
                  <th className="border-b border-b-[#1f1f1f] px-5 py-2.5">
                    Status
                  </th>
                  <th className="border-b border-b-[#1f1f1f] px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="[&+&>td]:border-t [&>td]:border-t-[#1f1f1f]"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-[#a3a3a3]">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-[#f5f5f5]">
                      {r.description ?? "Klone Pro"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[#a3a3a3]">
                      {r.currency} {r.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      {r.status === "succeeded" || r.status === "paid" ? (
                        <span className={stGreen}>Paid</span>
                      ) : (
                        <span className={stYellow}>{r.status}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.id === activePaymentId ? (
                        <span className={stBlue}>Active</span>
                      ) : r.subscription_id && !r.active ? (
                        <span className={stYellow}>Cancelled</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
    </div>
  );
}

function AppearanceSection() {
  const { setTheme } = useTheme();
  const [pref, setPref] = useLocalStorage<"dark" | "light" | "system">(
    "klone:theme-pref",
    "dark",
  );

  // Apply the persisted preference on open (theme is stored in localStorage
  // by ThemeProvider, but "system" needs resolving against the OS).
  useEffect(() => {
    if (pref === "system") {
      const light = window.matchMedia("(prefers-color-scheme: light)").matches;
      setTheme(light ? "light" : "dark");
    } else {
      setTheme(pref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickTheme = (t: "dark" | "light" | "system") => {
    setPref(t);
    if (t === "system") {
      const light = window.matchMedia("(prefers-color-scheme: light)").matches;
      setTheme(light ? "light" : "dark");
    } else {
      setTheme(t);
    }
  };

  const cards: {
    id: "dark" | "light" | "system";
    name: string;
    prev: string;
  }[] = [
    { id: "dark", name: "Dark", prev: "bg-[#0b0b0b]" },
    { id: "light", name: "Light", prev: "bg-[#f4f4f4]" },
    {
      id: "system",
      name: "System",
      prev: "bg-gradient-to-r from-[#0b0b0b] to-[#f4f4f4]",
    },
  ];

  return (
    <div id="settings-appearance" className="space-y-4">
      <SecTitle h="Appearance" p="Theme, accent and density." />
      <Panel>
        <div className="grid grid-cols-3 gap-3 px-5 pt-5 pb-1.5">
          {cards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pickTheme(c.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                pref === c.id
                  ? "border-[#aef637]"
                  : "border-[#2a2a2a] hover:border-[#3d3d3d]"
              }`}
            >
              <span
                className={`mb-2.5 block h-[62px] rounded-lg border border-[#1f1f1f] ${c.prev}`}
              />
              <span className="flex items-center justify-between text-[13px] font-semibold text-[#f5f5f5]">
                {c.name}
                {pref === c.id && (
                  <Check className="h-3.5 w-3.5 text-[#aef637]" />
                )}
              </span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

export function SettingsModal({ open, onClose, profile }: SettingsModalProps) {
  const [section, setSection] = useState<SectionId>("profile");
  const [pending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  // Esc to close + "/" to focus search + body scroll lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSignOut = () => startTransition(() => logout());

  const navItem = (
    id: SectionId,
    label: string,
    Icon: typeof User,
    danger?: boolean,
  ) => (
    <button
      key={id}
      type="button"
      onClick={() => setSection(id)}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13.5px] font-medium transition-colors ${
        section === id
          ? "bg-[#1c1c1c] text-white"
          : "text-[#d6d6d6] hover:bg-[#1c1c1c] hover:text-white"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${section === id ? "text-white" : danger ? "text-[#f87171]" : "text-[#9a9a9a]"}`}
      />
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="flex h-[84vh] max-h-[820px] w-[960px] max-w-[calc(100vw-48px)] overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#161617] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal sidebar nav ── */}
        <aside className="flex w-[230px] flex-none flex-col border-r border-[#1f1f1f] bg-[#161617]">
          <div className="flex h-12 flex-none items-center justify-between border-b border-[#1f1f1f] pl-5 pr-2">
            <h2 className="text-[14px] font-semibold text-[#f5f5f5]">
              Settings
            </h2>
          </div>

          <label className="mx-3 mt-3 mb-1 flex h-9 flex-none cursor-text items-center gap-2 rounded-lg border border-[#262626] bg-[#1e1e1e] px-3 text-[#6f6f6f]">
            <Search className="h-[15px] w-[15px]" />
            <input
              ref={searchRef}
              placeholder="Search settings"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#f5f5f5] outline-none placeholder:text-[#6f6f6f]"
            />
            <kbd className="font-sans text-xs text-[#6f6f6f]">/</kbd>
          </label>

          <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-2 [scrollbar-color:#242424_#161617] [scrollbar-width:thin]">
            <p className="px-2.5 pb-1.5 pt-2 text-[12.5px] text-[#8f8f8f]">
              Account
            </p>
            {ACCOUNT_NAV.map((n) => navItem(n.id, n.label, n.icon))}
            <p className="px-2.5 pb-1.5 pt-3 text-[12.5px] text-[#8f8f8f]">
              Preferences
            </p>
            {PREF_NAV.map((n) => navItem(n.id, n.label, n.icon))}
            <p className="px-2.5 pb-1.5 pt-3 text-[12.5px] text-[#8f8f8f]">
              Advanced
            </p>
            {ADVANCED_NAV.map((n) => navItem(n.id, n.label, n.icon, true))}
          </nav>

          {/* Sign out — moved inside the modal */}
          <div className="mx-3 mb-3 flex-none border-t border-[#1f1f1f] pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={pending}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13.5px] font-medium text-[#d6d6d6] transition-colors hover:bg-[#200d0d] hover:text-[#f87171] disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 text-[#f87171]" />
              )}
              <span className="font-medium">
                {pending ? "Signing out…" : "Sign out"}
              </span>
            </button>
          </div>
        </aside>

        {/* ── Modal content ── */}
        <main className="min-h-0 flex-1 overflow-y-auto px-8 py-3 [scrollbar-color:#242424_#161617] [scrollbar-width:thin]">
          <div className="mx-auto max-w-[720px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-extrabold tracking-[-0.01em] text-[#f5f5f5]">
                  Settings
                </h2>
                <p className="mt-1 text-[13px] text-[#a3a3a3]">
                  Manage your account, workspace and preferences.
                </p>
              </div>
            </div>

            {section === "profile" && <ProfileSection profile={profile} />}
            {section === "security" && <SecuritySection profile={profile} />}
            {section === "payments" && <PaymentsSection profile={profile} />}
            {section === "appearance" && <AppearanceSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
