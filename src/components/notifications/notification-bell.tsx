'use client';

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AtSign,
  Bell,
  CheckCheck,
  Inbox,
  MessageSquare,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Avatar } from '@/components/common/avatar';
import { NotificationSkeleton } from '@/components/ui/skeletons';
import { useNow } from '@/hooks/use-now';
import { usePopover } from '@/hooks/use-popover';
import { formatRelative } from '@/lib/format';
import { notificationHref, notificationTitle } from '@/lib/notification-text';
import { notificationCountKey, notificationsKey } from '@/lib/query-keys';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationCount,
} from '@/lib/rest';
import type { NotificationDto } from '@/lib/types';
import { cn } from '@/lib/utils';

const ICON = { MENTION: AtSign, DM: MessageSquare, INVITE: UserPlus } as const;

function NotificationItem({
  n,
  now,
  onOpen,
}: {
  n: NotificationDto;
  now: number;
  onOpen: (n: NotificationDto) => void;
}) {
  const unread = !n.readAt;
  const Icon = ICON[n.type];
  return (
    <li data-notification-id={n.id} data-type={n.type} data-read={!unread}>
      <button
        type="button"
        onClick={() => onOpen(n)}
        className={cn(
          'flex w-full gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          unread ? 'bg-accent/40 hover:bg-accent/70' : 'hover:bg-accent/60',
        )}
      >
        <span className="relative shrink-0">
          <Avatar name={n.actor?.username ?? '?'} size="lg" />
          <span
            className={cn(
              'absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full ring-2 ring-popover',
              unread ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className="size-2.5" aria-hidden="true" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block text-sm leading-snug', unread && 'font-medium')}>
            {notificationTitle(n)}
          </span>
          {n.preview && (
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">{n.preview}</span>
          )}
          <time dateTime={n.createdAt} className="mt-1 block text-xs text-muted-foreground">
            {formatRelative(n.createdAt, now)}
          </time>
        </span>
        {unread && (
          <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_6px_2px_hsl(var(--primary)/0.4)]">
            <span className="sr-only">Unread</span>
          </span>
        )}
      </button>
    </li>
  );
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { attach, ...popover } = usePopover();
  const now = useNow();
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const count = useQuery({
    queryKey: notificationCountKey,
    queryFn: notificationCount,
    staleTime: 60_000,
  });
  const list = useInfiniteQuery({
    queryKey: notificationsKey(tab),
    enabled: popover.open,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listNotifications(tab, pageParam),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const unread = count.data ?? 0;
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  async function open(n: NotificationDto) {
    popover.close();
    router.push(notificationHref(n));
    if (!n.readAt) {
      await markNotificationRead(n.id).catch(() => undefined);
      void queryClient.invalidateQueries({ queryKey: notificationCountKey });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  }

  async function markAll() {
    await markAllNotificationsRead().catch(() => undefined);
    queryClient.setQueryData(notificationCountKey, 0);
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <div ref={attach} className="relative">
      <button
        type="button"
        onClick={popover.toggle}
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className={cn(
          'relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          popover.open && 'bg-accent text-accent-foreground',
        )}
      >
        <Bell className="size-4" aria-hidden="true" />
        {unread > 0 && (
          <span
            data-testid="bell-badge"
            className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {popover.open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
        >
          <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <button
              type="button"
              onClick={() => void markAll()}
              disabled={unread === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:text-muted-foreground"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Mark all as read
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Filter notifications"
            className="flex gap-1 border-b border-border px-3"
          >
            {(['all', 'unread'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  tab === t
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'all' ? 'All' : 'Unread'}
                {t === 'unread' && unread > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="max-h-[28rem] overflow-y-auto">
            {list.isPending ? (
              <NotificationSkeleton />
            ) : list.isError ? (
              <ErrorState title="Couldn't load notifications" onRetry={() => void list.refetch()} />
            ) : items.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="You're all caught up"
                description="New mentions, messages and invites will show up here."
                className="py-12"
              />
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {items.map((n) => (
                    <NotificationItem key={n.id} n={n} now={now} onOpen={(x) => void open(x)} />
                  ))}
                </ul>
                {list.hasNextPage && (
                  <div className="border-t border-border p-2">
                    <button
                      type="button"
                      onClick={() => void list.fetchNextPage()}
                      disabled={list.isFetchingNextPage}
                      className="inline-flex h-9 w-full items-center justify-center rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {list.isFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5">
            <Link
              href="/settings"
              onClick={popover.close}
              className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              Notification settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
