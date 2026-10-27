'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, Ellipsis, Shield, UserPlus, X } from 'lucide-react';
import { useEffect } from 'react';
import { Avatar } from '@/components/common/avatar';
import { ErrorState } from '@/components/common/states';
import { MemberListSkeleton } from '@/components/ui/skeletons';
import { useNow } from '@/hooks/use-now';
import { usePopover } from '@/hooks/use-popover';
import { formatLastSeen } from '@/lib/format';
import { menuKeyDown } from '@/lib/menu';
import { membersKey, roomsKey } from '@/lib/query-keys';
import { listMembers, removeMember, roomPresence, setMemberRole } from '@/lib/rest';
import type { Member, Room } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useDialogStore } from '@/stores/dialog-store';
import { usePresenceStore } from '@/stores/presence-store';
import { toast } from '@/stores/toast-store';
import { useUiStore } from '@/stores/ui-store';

function MemberMenu({ room, member }: { room: Room; member: Member }) {
  const queryClient = useQueryClient();
  const { attach, ...menu } = usePopover();
  const canManageRoles = room.myRole === 'OWNER';
  const canRemove =
    room.myRole === 'OWNER' || (room.myRole === 'ADMIN' && member.role === 'MEMBER');

  async function run(action: () => Promise<unknown>, success: string) {
    menu.close();
    try {
      await action();
      void queryClient.invalidateQueries({ queryKey: membersKey(room.id) });
      void queryClient.invalidateQueries({ queryKey: roomsKey });
      toast.success(success);
    } catch (e) {
      toast.error('Action failed', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <div ref={attach} className="relative">
      <button
        type="button"
        onClick={menu.toggle}
        aria-haspopup="menu"
        aria-expanded={menu.open}
        aria-label={`Actions for ${member.username}`}
        className="inline-flex size-7 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-accent hover:text-accent-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
      >
        <Ellipsis className="size-4" aria-hidden="true" />
      </button>
      {menu.open && (
        <div
          role="menu"
          aria-label="Member actions"
          onKeyDown={menuKeyDown}
          className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {canManageRoles && (
            <button
              role="menuitem"
              type="button"
              onClick={() =>
                void run(
                  () =>
                    setMemberRole(
                      room.id,
                      member.userId,
                      member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN',
                    ),
                  member.role === 'ADMIN' ? 'Admin role removed' : 'Made admin',
                )
              }
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            >
              <Shield className="size-4 text-muted-foreground" aria-hidden="true" />
              {member.role === 'ADMIN' ? 'Remove admin role' : 'Make admin'}
            </button>
          )}
          {canRemove && (
            <button
              role="menuitem"
              type="button"
              onClick={() =>
                void run(() => removeMember(room.id, member.userId), `${member.username} removed`)
              }
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden="true" />
              Remove from room
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  room,
  member,
  meId,
  now,
}: {
  room: Room;
  member: Member;
  meId: string;
  now: number;
}) {
  const entry = usePresenceStore((s) => s.byUser[member.userId]);
  const status = entry?.status ?? 'offline';
  const isMe = member.userId === meId;
  const canAct =
    !isMe &&
    member.role !== 'OWNER' &&
    (room.myRole === 'OWNER' || (room.myRole === 'ADMIN' && member.role === 'MEMBER'));

  return (
    <li
      data-user={member.username}
      data-role={member.role}
      data-presence={status}
      className="group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-accent/60"
    >
      <Avatar name={member.username} presence={status} muted={status === 'offline'} own={isMe} />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-sm font-medium',
            status === 'offline' && 'text-muted-foreground',
          )}
        >
          {member.username}{' '}
          {isMe && <span className="font-normal text-muted-foreground">(you)</span>}
        </span>
        {status === 'offline' && (
          <span className="block truncate text-xs text-muted-foreground">
            {formatLastSeen(entry?.lastSeenAt ?? null, now)}
          </span>
        )}
      </span>
      {member.role === 'OWNER' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-foreground">
          <Crown className="size-3 text-warning" aria-hidden="true" />
          Owner
        </span>
      )}
      {member.role === 'ADMIN' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
          <Shield className="size-3" aria-hidden="true" />
          Admin
        </span>
      )}
      {canAct && <MemberMenu room={room} member={member} />}
    </li>
  );
}

const RANK = { online: 0, away: 1, offline: 2 } as const;

export function MembersPanel({ room, meId }: { room: Room; meId: string }) {
  const now = useNow();
  const open = useDialogStore((s) => s.open);
  const mobileOpen = useUiStore((s) => s.membersMobileOpen);
  const collapsed = useUiStore((s) => s.membersCollapsed);
  const setMobileOpen = useUiStore((s) => s.setMembersMobileOpen);
  const toggleMembers = useUiStore((s) => s.toggleMembers);
  const seed = usePresenceStore((s) => s.seed);
  const byUser = usePresenceStore((s) => s.byUser);

  const members = useQuery({
    queryKey: membersKey(room.id),
    queryFn: () => listMembers(room.id),
    staleTime: 30_000,
  });
  const presence = useQuery({
    queryKey: ['room-presence', room.id],
    queryFn: () => roomPresence(room.id),
    staleTime: 30_000,
  });
  useEffect(() => {
    if (presence.data) seed(presence.data);
  }, [presence.data, seed]);

  const sorted = [...(members.data ?? [])].sort(
    (a, b) =>
      RANK[byUser[a.userId]?.status ?? 'offline'] - RANK[byUser[b.userId]?.status ?? 'offline'] ||
      a.username.localeCompare(b.username),
  );
  const groups = [
    { id: 'owner', title: 'Owner', list: sorted.filter((m) => m.role === 'OWNER') },
    { id: 'admins', title: 'Admins', list: sorted.filter((m) => m.role === 'ADMIN') },
    { id: 'members', title: 'Members', list: sorted.filter((m) => m.role === 'MEMBER') },
  ].filter((g) => g.list.length > 0);
  const canAdd = room.myRole === 'OWNER' || room.myRole === 'ADMIN';

  return (
    <aside
      id="members-panel"
      aria-label="Room members"
      className={cn(
        'fixed inset-y-0 right-0 z-40 flex w-[260px] flex-col border-l border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : 'translate-x-full',
        collapsed && 'lg:hidden',
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-semibold">
          Members <span className="font-normal text-muted-foreground">· {room.memberCount}</span>
        </h2>
        <button
          type="button"
          onClick={() =>
            window.matchMedia('(min-width:1024px)').matches
              ? toggleMembers(true)
              : setMobileOpen(false)
          }
          aria-label="Close members"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        {members.isPending ? (
          <MemberListSkeleton />
        ) : members.isError ? (
          <ErrorState
            title="Couldn't load members"
            onRetry={() => void members.refetch()}
            className="py-6"
          />
        ) : (
          groups.map((g) => (
            <section key={g.id} aria-labelledby={`${g.id}-heading`}>
              <h3
                id={`${g.id}-heading`}
                className="mb-1 px-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {g.title} · {g.list.length}
              </h3>
              <ul>
                {g.list.map((m) => (
                  <MemberRow key={m.userId} room={room} member={m} meId={meId} now={now} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {canAdd && (
        <div className="shrink-0 border-t border-border p-3">
          <button
            type="button"
            onClick={() =>
              open({ type: 'add-member', roomId: room.id, roomName: room.name ?? 'room' })
            }
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Add member
          </button>
        </div>
      )}
    </aside>
  );
}
