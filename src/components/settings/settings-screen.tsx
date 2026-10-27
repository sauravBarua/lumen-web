'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Info, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { ErrorState } from '@/components/common/states';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { preferencesKey } from '@/lib/query-keys';
import { getPreferences, updatePreference } from '@/lib/rest';
import { applyTheme, getThemePreference, subscribeTheme, type ThemePreference } from '@/lib/theme';
import type { NotificationType, Preference } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from '@/stores/toast-store';

const TYPES: { type: NotificationType; label: string; description: string }[] = [
  { type: 'MENTION', label: 'Mentions', description: 'When someone @mentions you in a room' },
  { type: 'DM', label: 'Direct messages', description: 'When someone sends you a private message' },
  { type: 'INVITE', label: 'Room invites', description: 'When someone adds you to a room' },
];

type Channel = 'inApp' | 'email';
type Edits = Partial<Record<NotificationType, Partial<Record<Channel, boolean>>>>;

const THEMES: { value: ThemePreference; label: string; preview: React.ReactNode }[] = [
  {
    value: 'light',
    label: 'Light',
    preview: (
      <span className="block h-16 rounded-md border border-neutral-200 bg-white p-2">
        <span className="block h-2 w-1/2 rounded bg-neutral-300" />
        <span className="mt-1.5 block h-2 w-3/4 rounded bg-violet-500/70" />
      </span>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    preview: (
      <span className="block h-16 rounded-md border border-neutral-800 bg-neutral-900 p-2">
        <span className="block h-2 w-1/2 rounded bg-neutral-600" />
        <span className="mt-1.5 block h-2 w-3/4 rounded bg-violet-400/80" />
      </span>
    ),
  },
  {
    value: 'system',
    label: 'System',
    preview: (
      <span className="flex h-16 overflow-hidden rounded-md border border-neutral-300">
        <span className="block w-1/2 bg-white p-2">
          <span className="block h-2 w-3/4 rounded bg-neutral-300" />
          <span className="mt-1.5 block h-2 w-full rounded bg-violet-500/70" />
        </span>
        <span className="block w-1/2 bg-neutral-900 p-2">
          <span className="block h-2 w-3/4 rounded bg-neutral-600" />
          <span className="mt-1.5 block h-2 w-full rounded bg-violet-400/80" />
        </span>
      </span>
    ),
  },
];

const CARD = 'rounded-lg border border-border bg-card p-6 text-card-foreground';

function ReadOnlyField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          readOnly
          aria-readonly="true"
          className="h-10 w-full cursor-default rounded-md border border-input bg-muted px-3 pr-9 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Lock
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function NotificationPreferences() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: preferencesKey, queryFn: getPreferences });
  const [edits, setEdits] = useState<Edits>({});
  const [saving, setSaving] = useState(false);

  const server = (type: NotificationType): Preference =>
    query.data?.find((p) => p.type === type) ?? { type, inApp: true, email: true };
  const value = (type: NotificationType, channel: Channel) =>
    edits[type]?.[channel] ?? server(type)[channel];

  function toggle(type: NotificationType, channel: Channel, checked: boolean) {
    setEdits((current) => {
      const next = { ...current[type], [channel]: checked };
      if (server(type)[channel] === checked) delete next[channel]; // back to the saved value: no change
      const copy = { ...current, [type]: next };
      if (Object.keys(next).length === 0) delete copy[type];
      return copy;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(edits).map(([type, patch]) =>
          updatePreference(type as NotificationType, patch),
        ),
      );
      await queryClient.invalidateQueries({ queryKey: preferencesKey });
      setEdits({});
      toast.success('Preferences saved', 'Your notification settings are up to date.');
    } catch (e) {
      toast.error('Could not save preferences', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  if (query.isError)
    return (
      <ErrorState title="Couldn't load your preferences" onRetry={() => void query.refetch()} />
    );

  return (
    <>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[22rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">
                Notify me about
              </th>
              <th scope="col" className="w-24 py-2 text-center font-medium">
                In-app
              </th>
              <th scope="col" className="w-24 py-2 text-center font-medium">
                Email
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {TYPES.map(({ type, label, description }) => (
              <tr key={type} data-pref-type={type}>
                <th scope="row" className="py-4 pr-4 text-left font-normal">
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{description}</span>
                </th>
                {(['inApp', 'email'] as const).map((channel) => (
                  <td key={channel} className="text-center">
                    <Switch
                      aria-label={`${label}, ${channel === 'inApp' ? 'in-app' : 'email'}`}
                      checked={value(type, channel)}
                      disabled={query.isPending}
                      onCheckedChange={(checked) => toggle(type, channel, checked)}
                      className="focus-visible:ring-offset-card"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-md bg-muted px-3 py-2.5 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Emails are only sent when you are offline and haven&apos;t read the notification.
      </p>

      <div className="mt-5 flex justify-end">
        <Button
          onClick={() => void save()}
          loading={saving}
          disabled={Object.keys(edits).length === 0}
        >
          Save preferences
        </Button>
      </div>
    </>
  );
}

export function SettingsScreen() {
  const { data: session } = useSession();
  const pref = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    () => 'system' as ThemePreference,
  );
  const username = session?.user.username ?? '';

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 rounded-md px-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to chat
          </Link>
          <ThemeToggle className="size-9" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage how Lumen looks and how it keeps you in the loop.
          </p>
        </div>

        <section aria-labelledby="h-profile" className={CARD}>
          <h2 id="h-profile" className="text-base font-semibold">
            Profile
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account details. These can&apos;t be changed here.
          </p>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <span
              className="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-xl font-semibold text-accent-foreground"
              aria-hidden="true"
            >
              {username.slice(0, 2).toUpperCase()}
            </span>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField id="username" label="Username" value={username} />
              <ReadOnlyField id="email" label="Email" value={session?.user.email ?? ''} />
            </div>
          </div>
        </section>

        <section aria-labelledby="h-appearance" className={CARD}>
          <h2 id="h-appearance" className="text-base font-semibold">
            Appearance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a theme for Lumen on this device.
          </p>
          <div
            role="radiogroup"
            aria-labelledby="h-appearance"
            className="mt-5 grid gap-3 sm:grid-cols-3"
          >
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={pref === t.value}
                data-theme-option={t.value}
                onClick={() => applyTheme(t.value)}
                className={cn(
                  'rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  pref === t.value
                    ? 'border-primary bg-accent/40'
                    : 'border-input hover:bg-accent/50',
                )}
              >
                {t.preview}
                <span className="mt-2 flex items-center justify-between px-1 text-sm font-medium">
                  {t.label}
                  <Check
                    className={cn('size-4 text-primary', pref !== t.value && 'opacity-0')}
                    aria-hidden="true"
                  />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="h-notifs" className={CARD}>
          <h2 id="h-notifs" className="text-base font-semibold">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how you want to hear about activity.
          </p>
          <NotificationPreferences />
        </section>
      </main>
    </div>
  );
}
