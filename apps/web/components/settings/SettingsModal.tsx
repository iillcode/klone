'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import type { UserProfile } from '@/lib/data/users';
import { updateProfile } from '@/app/actions/profile';
import { resetPassword, logout } from '@/app/actions/auth';
import { useTheme } from '@/components/ui/theme-provider';
import {
  AlertTriangle,
  Bell,
  Check,
  CreditCard,
  Download,
  Gem,
  Loader2,
  Lock,
  LogOut,
  Monitor,
  Phone,
  Search,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types + nav config
// ---------------------------------------------------------------------------

type SectionId =
  | 'profile'
  | 'security'
  | 'billing'
  | 'appearance'
  | 'notifications'
  | 'danger';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  documentCount?: number;
}

const ACCOUNT_NAV: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

const PREF_NAV: { id: SectionId; label: string; icon: typeof Monitor }[] = [
  { id: 'appearance', label: 'Appearance', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const ADVANCED_NAV: { id: SectionId; label: string; icon: typeof AlertTriangle }[] = [
  { id: 'danger', label: 'Danger zone', icon: AlertTriangle },
];

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

const btn =
  'inline-flex items-center gap-2 h-[34px] px-3 rounded-[9px] border border-[#2a2a2a] bg-[#1a1a1a] text-[13px] font-semibold text-[#e6e6e6] transition-colors hover:border-[#3d3d3d] hover:bg-[#202020] disabled:cursor-wait disabled:opacity-60';
const btnPrimary = `${btn} border-[#2563eb] bg-[#2563eb] text-white hover:border-[#1d4ed8] hover:bg-[#1d4ed8]`;
const btnSm = 'h-[30px] px-2.5 text-[12.5px] rounded-lg gap-1.5';
const btnDanger =
  'border-[#4a1717] bg-transparent text-[#f87171] hover:bg-[#200d0d] hover:border-[#672222]';
const inputCls =
  'w-full h-[38px] rounded-[9px] border border-[#262626] bg-[#1e1e1e] px-3 text-[13.5px] text-[#f5f5f5] placeholder:text-[#6f6f6f] transition-[border-color,box-shadow] focus:border-[#3b82f6] focus:outline-none focus:ring-[3px] focus:ring-[#3b82f6]/15';
const labelCls = 'mb-1.5 block text-[12.5px] font-semibold text-[#a3a3a3]';
const stBlue = 'inline-flex items-center rounded-full bg-[#16245a] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#8fb3ff]';
const stGreen = 'inline-flex items-center rounded-full bg-[#123524] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#4ade80]';
const stYellow = 'inline-flex items-center rounded-full bg-[#3a2b12] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#fbbf24]';

function Panel({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-[14px] border ${
        danger ? 'border-[#f87171]/30' : 'border-[#1f1f1f]'
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
        block ? 'block' : ''
      } ${flexStart ? 'flex-col items-start gap-3.5' : ''} [&+&]:border-t [&+&]:border-t-[#1f1f1f]`}
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
          on ? 'border-[#2563eb] bg-[#2563eb]' : 'border-[#333] bg-[#2a2a2a]'
        }`}
      >
        <span
          className={`absolute top-[3px] h-[14px] w-[14px] rounded-full transition-all duration-200 ${
            on ? 'left-[19px] bg-white' : 'left-[3px] bg-[#9a9a9a]'
          }`}
        />
      </i>
    </label>
  );
}

/** A switch whose state is persisted in localStorage. */
function PersistedSwitch({
  storageKey,
  defaultChecked,
}: {
  storageKey: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useLocalStorage<boolean>(
    `klone:setting:${storageKey}`,
    Boolean(defaultChecked),
  );
  return <Switch checked={on} onChange={setOn} />;
}

function InitialsAvatar({ name, size, tone }: { name: string; size: string; tone: string }) {
  const initials = (name || 'K')
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={`${size} flex-none rounded-full font-bold ${tone}`}
      style={{ display: 'grid', placeItems: 'center', fontSize: size === 'h-[64px] w-[64px]' ? '20px' : '11px' }}
    >
      {initials}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function ProfileSection({ profile }: { profile: UserProfile | null }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [email] = useState(profile?.email ?? '');
  const [website, setWebsite] = useState(profile?.website ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
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
        website: website.trim() || null,
        bio: bio.trim() || null,
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
          <InitialsAvatar name={fullName} size="h-16 w-16" tone="bg-[#16245a] text-[#8fb3ff]" />
          <div className="min-w-0 flex-1">
            <b className="block text-[14px] text-[#f5f5f5]">{fullName || '—'}</b>
            <span className="text-[12.5px] text-[#a3a3a3]">
              {email} · {(profile?.plan ?? 'free') === 'pro' ? 'Pro plan' : 'Hobby plan'}
            </span>
          </div>
          <button className={`${btn} ${btnSm}`} type="button" onClick={() => {}}>
            Change avatar
          </button>
          <button className={`${btn} ${btnSm} text-[#6f6f6f]`} type="button" onClick={() => {}}>
            Remove
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="fn">Full name</label>
              <input id="fn" className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="un">Username</label>
              <input id="un" className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="em">Email</label>
              <input id="em" type="email" className={`${inputCls} opacity-60`} value={email} readOnly />
            </div>
            <div>
              <label className={labelCls} htmlFor="ws">Website</label>
              <input id="ws" className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="bio">Bio</label>
            <textarea id="bio" className={`${inputCls} h-auto min-h-[86px] resize-y py-2.5`} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us what you build…" />
          </div>
        </div>

        {error && <p className="px-5 pb-1 text-[12.5px] text-[#f87171]">{error}</p>}
        <PanelFoot>
          {saved && (
            <span className="mr-auto inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#4ade80]">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <button className={btn} type="button" onClick={() => { setFullName(profile?.full_name ?? ''); setUsername(profile?.username ?? ''); setWebsite(profile?.website ?? ''); setBio(profile?.bio ?? ''); setError(null); }}>
            Cancel
          </button>
          <button className={btnPrimary} type="button" onClick={handleSave} disabled={pending}>
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
  const [revoked, setRevoked] = useState<string[]>([]);

  const sessions = [
    {
      id: 'this-device',
      icon: Monitor,
      b: 'This device · Browser',
      s: 'San Francisco, US · now',
      current: true,
    },
    {
      id: 'iphone',
      icon: Phone,
      b: 'iPhone · Safari',
      s: 'San Francisco, US · 2h ago',
      current: false,
    },
    {
      id: 'windows',
      icon: Monitor,
      b: 'Windows PC · Edge',
      s: 'Austin, US · 3d ago',
      current: false,
    },
  ].filter((s) => !revoked.includes(s.id));

  return (
    <div id="settings-security" className="space-y-3">
      <SecTitle h="Security" p="Password and active sessions." />
      <Panel>
        <Prow flexStart>
          <RowText b="Change password" span="We'll email you a secure reset link." />
          <button
            className={`${btn} ${btnSm}`}
            type="button"
            disabled={resetPending}
            onClick={() => {
              setResetMsg(null);
              startReset(async () => {
                const email = profile?.email;
                if (!email) {
                  setResetMsg('No email on file.');
                  return;
                }
                const res = await resetPassword(email);
                setResetMsg(res.ok ? 'Reset link sent to your email.' : res.error ?? 'Something went wrong.');
              });
            }}
          >
            {resetPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            Update password
          </button>
          {resetMsg && <p className="text-[12.5px] text-[#a3a3a3]">{resetMsg}</p>}
        </Prow>
      </Panel>

      <Panel>
        <Prow>
          <RowText b="Active sessions" span="Devices currently signed in to your account." />
        </Prow>
        {sessions.length === 0 && (
          <Prow>
            <span className="text-[12.5px] text-[#a3a3a3]">No other active sessions.</span>
          </Prow>
        )}
        {sessions.map((s) => (
          <Prow key={s.id}>
            <div className="flex items-center gap-3">
              <s.icon className="h-4 w-4 text-[#a3a3a3]" />
              <RowText b={s.b} span={s.s} />
            </div>
            {s.current ? (
              <span className={stGreen}>Current</span>
            ) : (
              <button
                className={`${btn} ${btnSm}`}
                type="button"
                onClick={() => setRevoked((prev) => [...prev, s.id])}
              >
                Revoke
              </button>
            )}
          </Prow>
        ))}
      </Panel>
    </div>
  );
}

function BillingSection({ profile, documentCount }: { profile: UserProfile | null; documentCount: number }) {
  const plan = profile?.plan === 'pro' ? 'Pro' : 'Hobby';
  const credits = profile?.credits_balance ?? 0;
  const docPct = Math.min(100, Math.round((documentCount / 50) * 100));
  const creditPct = Math.min(100, Math.round((credits / 20) * 100));

  return (
    <div id="settings-billing" className="space-y-3">
      <SecTitle h="Billing" p="Plan, usage and invoices." />
      <Panel>
        <Prow>
          <RowText
            b={<>{plan} <span className={stBlue} style={{ marginLeft: 6 }}>{plan === 'Pro' ? 'Active' : 'Free'}</span></>}
            span="Monthly usage resets on the 1st."
          />
          <button className={`${btnPrimary} ${btnSm}`} type="button">
            <Gem className="h-3.5 w-3.5" /> Upgrade
          </button>
        </Prow>
        <Prow block>
          <div className="grid gap-3.5">
            <div>
              <div className="flex justify-between text-[12.5px] text-[#a3a3a3]">
                <span>Documents</span>
                <b className="text-[#f5f5f5]">{documentCount} / 50</b>
              </div>
              <div className="mt-[7px] h-1.5 overflow-hidden rounded-full bg-[#242424]">
                <i className="block h-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6]" style={{ width: `${docPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12.5px] text-[#a3a3a3]">
                <span>AI credits</span>
                <b className="text-[#f5f5f5]">{credits} / 20</b>
              </div>
              <div className="mt-[7px] h-1.5 overflow-hidden rounded-full bg-[#242424]">
                <i className="block h-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6]" style={{ width: `${creditPct}%` }} />
              </div>
            </div>
          </div>
        </Prow>
      </Panel>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] font-semibold uppercase tracking-wider text-[#6f6f6f]">
                <th className="border-b border-b-[#1f1f1f] px-5 py-2.5">Invoice</th>
                <th className="border-b border-b-[#1f1f1f] px-5 py-2.5">Date</th>
                <th className="border-b border-b-[#1f1f1f] px-5 py-2.5">Amount</th>
                <th className="border-b border-b-[#1f1f1f] px-5 py-2.5">Status</th>
                <th className="border-b border-b-[#1f1f1f] px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {[
                ['#2026-007', 'Jul 1, 2026', '$0.00', 'Paid'],
                ['#2026-006', 'Jun 1, 2026', '$0.00', 'Paid'],
                ['#2026-005', 'May 1, 2026', '$12.00', 'Due'],
              ].map(([id, date, amount, status]) => (
                <tr key={id} className="[&+&>td]:border-t [&>td]:border-t-[#1f1f1f]">
                  <td className="px-5 py-3 font-mono text-[12.5px] text-[#f5f5f5]">{id}</td>
                  <td className="px-5 py-3 text-[#a3a3a3]">{date}</td>
                  <td className="px-5 py-3 text-[#a3a3a3]">{amount}</td>
                  <td className="px-5 py-3">
                    {status === 'Paid' ? <span className={stGreen}>{status}</span> : <span className={stYellow}>{status}</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-[#a3a3a3] transition-colors hover:text-[#f5f5f5]" type="button" aria-label={`Download ${id}`}>
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

const ACCENT_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  violet: '#8b5cf6',
  green: '#22c55e',
  orange: '#f97316',
  pink: '#ec4899',
};

function AppearanceSection() {
  const { setTheme } = useTheme();
  const [pref, setPref] = useLocalStorage<'dark' | 'light' | 'system'>(
    'klone:theme-pref',
    'dark',
  );
  const [accent, setAccent] = useLocalStorage<string>('klone:accent', 'blue');
  const [compact, setCompact] = useLocalStorage<boolean>('klone:setting:compact', false);
  const [reduceMotion, setReduceMotion] = useLocalStorage<boolean>('klone:setting:reduce-motion', false);
  const [hints, setHints] = useLocalStorage<boolean>('klone:setting:keyboard-hints', true);

  // Apply the persisted preference on open (theme is stored in localStorage
  // by ThemeProvider, but "system" needs resolving against the OS).
  useEffect(() => {
    if (pref === 'system') {
      const light = window.matchMedia('(prefers-color-scheme: light)').matches;
      setTheme(light ? 'light' : 'dark');
    } else {
      setTheme(pref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickTheme = (t: 'dark' | 'light' | 'system') => {
    setPref(t);
    if (t === 'system') {
      const light = window.matchMedia('(prefers-color-scheme: light)').matches;
      setTheme(light ? 'light' : 'dark');
    } else {
      setTheme(t);
    }
  };

  // Accent → CSS custom property consumed by the app shell.
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--accent-color',
      ACCENT_COLORS[accent] ?? ACCENT_COLORS.blue,
    );
  }, [accent]);

  // Reduce motion → global class that kills transitions/animations.
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  // Compact mode → data attribute the app can hook into.
  useEffect(() => {
    document.documentElement.dataset.compact = String(compact);
  }, [compact]);

  const accents: { id: string; cls: string }[] = [
    { id: 'blue', cls: 'bg-[#3b82f6]' },
    { id: 'violet', cls: 'bg-[#8b5cf6]' },
    { id: 'green', cls: 'bg-[#22c55e]' },
    { id: 'orange', cls: 'bg-[#f97316]' },
    { id: 'pink', cls: 'bg-[#ec4899]' },
  ];

  const cards: { id: 'dark' | 'light' | 'system'; name: string; prev: string }[] = [
    { id: 'dark', name: 'Dark', prev: 'bg-[#0b0b0b]' },
    { id: 'light', name: 'Light', prev: 'bg-[#f4f4f4]' },
    { id: 'system', name: 'System', prev: 'bg-gradient-to-r from-[#0b0b0b] to-[#f4f4f4]' },
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
                pref === c.id ? 'border-[#3b82f6]' : 'border-[#2a2a2a] hover:border-[#3d3d3d]'
              }`}
            >
              <span className={`mb-2.5 block h-[62px] rounded-lg border border-[#1f1f1f] ${c.prev}`} />
              <span className="flex items-center justify-between text-[13px] font-semibold text-[#f5f5f5]">
                {c.name}
                {pref === c.id && <Check className="h-3.5 w-3.5 text-[#3b82f6]" />}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 px-5 pb-4 pt-3.5">
          <span className="mr-2.5 text-[12.5px] font-semibold text-[#a3a3a3]">Accent</span>
          {accents.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-label={`Accent ${a.id}`}
              onClick={() => setAccent(a.id)}
              className={`h-[26px] w-[26px] rounded-full transition-shadow ${a.cls} ${
                accent === a.id ? 'ring-2 ring-[#f5f5f5] ring-offset-2 ring-offset-[#161617]' : ''
              }`}
            />
          ))}
        </div>

        <Prow>
          <RowText b="Compact mode" span="Tighter spacing for large screens." />
          <Switch checked={compact} onChange={setCompact} />
        </Prow>
        <Prow>
          <RowText b="Reduce motion" span="Minimize animations and effects." />
          <Switch checked={reduceMotion} onChange={setReduceMotion} />
        </Prow>
        <Prow>
          <RowText b="Show keyboard hints" span="Display shortcuts like “/” for search." />
          <Switch checked={hints} onChange={setHints} />
        </Prow>
      </Panel>
    </div>
  );
}

function ToggleList({ rows }: { rows: { key: string; b: string; s: string; on?: boolean }[] }) {
  return (
    <Panel>
      {rows.map((r) => (
        <Prow key={r.key}>
          <RowText b={r.b} span={r.s} />
          <PersistedSwitch storageKey={r.key} defaultChecked={r.on} />
        </Prow>
      ))}
    </Panel>
  );
}

function NotificationsSection() {
  return (
    <div id="settings-notifications" className="space-y-4">
      <SecTitle h="Notifications" p="Choose what reaches you." />
      <ToggleList
        rows={[
          { key: 'notif:security', b: 'Security alerts', s: 'Sign-in attempts and password changes.', on: true },
          { key: 'notif:mentions', b: 'Mentions & replies', s: 'When someone mentions you in a comment.', on: true },
          { key: 'notif:digest', b: 'Weekly digest', s: 'A summary of new documents in your workspace.', on: true },
          { key: 'notif:updates', b: 'Product updates', s: 'Changelog highlights and new features.' },
          { key: 'notif:marketing', b: 'Marketing emails', s: 'Tips, offers and surveys. Never spam.' },
        ]}
      />
    </div>
  );
}

function DangerSection({ profile, onExport }: { profile: UserProfile | null; onExport: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div id="settings-danger" className="space-y-4">
      <SecTitle h="Danger zone" p="Irreversible actions — proceed with care." />
      <Panel danger>
        <Prow>
          <RowText b="Export account data" span="Download everything as a JSON archive." />
          <button className={`${btn} ${btnSm}`} type="button" onClick={onExport}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </Prow>
        <Prow>
          <RowText b="Delete account" span="Permanently remove your account and documents." />
          <button className={`${btn} ${btnSm} ${btnDanger}`} type="button" onClick={() => setConfirm(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete account
          </button>
        </Prow>
        {confirm && (
          <div className="border-t border-t-[#f87171]/30 bg-[#200d0d] px-5 py-4 text-[13px] text-[#fca5a5]">
            <b className="block text-[#f87171]">Are you sure?</b>
            <span className="mt-0.5 block text-[12.5px]">
              This permanently deletes your account and all {`${profile?.email ?? ''}`} documents.
            </span>
            <div className="mt-3 flex gap-2">
              <button className={`${btn} ${btnSm} ${btnDanger}`} type="button" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button className={`${btnPrimary} ${btnSm} !border-[#dc2626] !bg-[#dc2626] hover:!bg-[#b91c1c]`} type="button">
                Delete permanently
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

export function SettingsModal({ open, onClose, profile, documentCount = 0 }: SettingsModalProps) {
  const [section, setSection] = useState<SectionId>('profile');
  const [pending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  // Esc to close + "/" to focus search + body scroll lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const exportData = useCallback(() => {
    const data = { exported_at: new Date().toISOString(), profile };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'klone-account-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [profile]);

  if (!open) return null;

  const handleSignOut = () => startTransition(() => logout());

  const navItem = (id: SectionId, label: string, Icon: typeof User, danger?: boolean) => (
    <button
      key={id}
      type="button"
      onClick={() => setSection(id)}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13.5px] font-medium transition-colors ${
        section === id ? 'bg-[#1c1c1c] text-white' : 'text-[#d6d6d6] hover:bg-[#1c1c1c] hover:text-white'
      }`}
    >
      <Icon className={`h-4 w-4 ${section === id ? 'text-white' : danger ? 'text-[#f87171]' : 'text-[#9a9a9a]'}`} />
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
            <h2 className="text-[14px] font-semibold text-[#f5f5f5]">Settings</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="grid h-8 w-8 place-items-center rounded-lg text-[#a3a3a3] transition-colors hover:bg-[#1c1c1c] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
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
            <p className="px-2.5 pb-1.5 pt-2 text-[12.5px] text-[#8f8f8f]">Account</p>
            {ACCOUNT_NAV.map((n) => navItem(n.id, n.label, n.icon))}
            <p className="px-2.5 pb-1.5 pt-3 text-[12.5px] text-[#8f8f8f]">Preferences</p>
            {PREF_NAV.map((n) => navItem(n.id, n.label, n.icon))}
            <p className="px-2.5 pb-1.5 pt-3 text-[12.5px] text-[#8f8f8f]">Advanced</p>
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
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4 text-[#f87171]" />}
              <span className="font-medium">{pending ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </aside>

        {/* ── Modal content ── */}
        <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7 [scrollbar-color:#242424_#161617] [scrollbar-width:thin]">
          <div className="mx-auto max-w-[720px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-extrabold tracking-[-0.01em] text-[#f5f5f5]">Settings</h2>
                <p className="mt-1 text-[13px] text-[#a3a3a3]">Manage your account, workspace and preferences.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close settings" className="text-[#6f6f6f] transition-colors hover:text-[#f5f5f5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {section === 'profile' && <ProfileSection profile={profile} />}
            {section === 'security' && <SecuritySection profile={profile} />}
            {section === 'billing' && <BillingSection profile={profile} documentCount={documentCount} />}
            {section === 'appearance' && <AppearanceSection />}
            {section === 'notifications' && <NotificationsSection />}
            {section === 'danger' && <DangerSection profile={profile} onExport={exportData} />}
          </div>
        </main>
      </div>
    </div>
  );
}
