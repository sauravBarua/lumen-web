'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  Globe,
  Hash,
  Lock,
  LogOut,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, PresenceDot } from '@/components/common/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { RoomListSkeleton } from '@/components/ui/skeletons';
import { ErrorState } from '@/components/common/states';
import { usePopover } from '@/hooks/use-popover';
import { useRooms } from '@/hooks/use-rooms';
import { lockSession } from '@/lib/api/browser';
import { signOutAction } from '@/lib/auth/actions';
import { menuKeyDown } from '@/lib/menu';
import { lookupPresence } from '@/lib/rest';
import { splitRooms } from '@/lib/rooms-cache';
import type { Room } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useDialogStore } from '@/stores/dialog-store';
import { usePresenceStore } from '@/stores/presence-store';
import { useUiStore } from '@/stores/ui-store';

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread messages`}
      className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function RoomLink({ room, active }: { room: Room; active: boolean }) {
  const closeDrawers = useUiStore((s) => s.closeDrawers);
  const Icon = room.type === 'PRIVATE' ? Lock : Hash;
  const unread = room.unreadCount > 0;
  return (
    <li>
      <Link
        href={`/rooms/${room.id}`}
        onClick={closeDrawers}
        aria-current={active ? 'page' : undefined}
        data-room-id={room.id}
        className={cn(
          'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active
            ? 'bg-accent font-medium text-accent-foreground'
            : unread
              ? 'font-semibold hover:bg-accent/60'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )}
      >
        <Icon
          className={cn('size-4 shrink-0', !active && unread && 'text-muted-foreground')}
          aria-hidden="true"
        />
        <span className="flex-1 truncate">{room.name}</span>
        {!active && <UnreadBadge count={room.unreadCount} />}
      </Link>
    </li>
  );
}

function DmLink({ room, active }: { room: Room; active: boolean }) {
  const closeDrawers = useUiStore((s) => s.closeDrawers);
  const presence = usePresenceStore((s) =>
    room.dmUser ? s.byUser[room.dmUser.id]?.status : undefined,
  );
  const unread = room.unreadCount > 0;
  const name = room.dmUser?.username ?? 'Unknown';
  return (
    <li>
      <Link
        href={`/rooms/${room.id}`}
        onClick={closeDrawers}
        aria-current={active ? 'page' : undefined}
        data-room-id={room.id}
        className={cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active
            ? 'bg-accent font-medium text-accent-foreground'
            : unread
              ? 'font-semibold hover:bg-accent/60'
              : 'hover:bg-accent/60',
        )}
      >
        <Avatar name={name} size="sm" presence={presence ?? 'offline'} />
        <span className="flex-1 truncate">{name}</span>
        {!active && <UnreadBadge count={room.unreadCount} />}
      </Link>
    </li>
  );
}

function SectionHeading({
  id,
  title,
  actionLabel,
  onAction,
}: {
  id: string;
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="mb-1 flex items-center justify-between px-2.5">
      <h2 id={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <button
        type="button"
        onClick={onAction}
        aria-label={actionLabel}
        className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function CurrentUser() {
  const { data: session } = useSession();
  const manualAway = useUiStore((s) => s.manualAway);
  const setManualAway = useUiStore((s) => s.setManualAway);
  const { attach, ...menu } = usePopover();
  const status = manualAway ? 'away' : 'online';
  const username = session?.user.username ?? '';

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-2">
        <div ref={attach} className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={menu.toggle}
            aria-haspopup="menu"
            aria-expanded={menu.open}
            className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar name={username || '?'} size="md" own presence={status} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{username}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {status === 'online' ? 'Online' : 'Away'}
                <ChevronDown className="size-3" aria-hidden="true" />
              </span>
            </span>
          </button>
          {menu.open && (
            <div
              role="menu"
              aria-label="Set your status"
              onKeyDown={menuKeyDown}
              className="absolute bottom-full left-0 z-50 mb-2 w-52 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
            >
              {(['online', 'away'] as const).map((s) => (
                <button
                  key={s}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setManualAway(s === 'away');
                    menu.close();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <PresenceDot status={s} className="size-2.5" />
                  {s === 'online' ? 'Online' : 'Away'}
                  {status === s && (
                    <Check className="ml-auto size-4 text-primary" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
        </Link>
        <ThemeToggle className="size-9" />
        <form
          action={async () => {
            await lockSession(); // let any in-flight session request finish, and block new ones
            await signOutAction();
          }}
        >
          <button
            type="submit"
            aria-label="Sign out"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function RoomSidebar() {
  const pathname = usePathname();
  const rooms = useRooms();
  const [query, setQuery] = useState('');
  const open = useDialogStore((s) => s.open);
  const drawerOpen = useUiStore((s) => s.roomsDrawerOpen);
  const closeDrawers = useUiStore((s) => s.closeDrawers);
  const seedPresence = usePresenceStore((s) => s.seed);

  const dmIds = (rooms.data ?? []).flatMap((r) => (r.dmUser ? [r.dmUser.id] : []));
  const dmKey = dmIds.join(',');
  const presence = useQuery({
    queryKey: ['dm-presence', dmKey],
    queryFn: () => lookupPresence(dmIds),
    enabled: dmIds.length > 0,
    staleTime: 60_000,
  });
  useEffect(() => {
    if (presence.data) seedPresence(presence.data);
  }, [presence.data, seedPresence]);

  const { channels, dms } = splitRooms(rooms.data ?? [], query);
  const activeId = pathname.startsWith('/rooms/') ? pathname.split('/')[2] : null;

  return (
    <aside
      aria-label="Rooms and direct messages"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0',
        drawerOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="space-y-3 p-4 pb-2">
        <div className="flex items-center justify-between">
          <Link
            href="/rooms"
            aria-label="Lumen home"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo className="[&>span:first-child]:size-8 [&>span:last-child]:text-lg" />
          </Link>
          <button
            type="button"
            onClick={closeDrawers}
            aria-label="Close rooms"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="relative">
          <label htmlFor="room-search" className="sr-only">
            Search rooms and people
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="room-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rooms and people"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-3" aria-label="Conversations">
        {rooms.isPending ? (
          <RoomListSkeleton />
        ) : rooms.isError ? (
          <ErrorState
            title="Couldn't load rooms"
            onRetry={() => void rooms.refetch()}
            className="py-6"
          />
        ) : (
          <>
            <section aria-labelledby="rooms-heading">
              <SectionHeading
                id="rooms-heading"
                title="Rooms"
                actionLabel="Create room"
                onAction={() => open({ type: 'create-room' })}
              />
              <ul className="space-y-0.5">
                {channels.map((r) => (
                  <RoomLink key={r.id} room={r} active={r.id === activeId} />
                ))}
              </ul>
              {query && channels.length === 0 && (
                <p className="px-2.5 py-1 text-sm text-muted-foreground">No matching rooms</p>
              )}
              <div className="mt-2 space-y-0.5">
                <button
                  type="button"
                  onClick={() => open({ type: 'create-room' })}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  New room
                </button>
                <button
                  type="button"
                  onClick={() => open({ type: 'browse-rooms' })}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Globe className="size-4" aria-hidden="true" />
                  Browse public rooms
                </button>
              </div>
            </section>

            <section aria-labelledby="dm-heading">
              <SectionHeading
                id="dm-heading"
                title="Direct messages"
                actionLabel="New direct message"
                onAction={() => open({ type: 'new-dm' })}
              />
              <ul className="space-y-0.5">
                {dms.map((r) => (
                  <DmLink key={r.id} room={r} active={r.id === activeId} />
                ))}
              </ul>
              {query && dms.length === 0 && (
                <p className="px-2.5 py-1 text-sm text-muted-foreground">No matching people</p>
              )}
            </section>
          </>
        )}
      </nav>

      <CurrentUser />
    </aside>
  );
}
