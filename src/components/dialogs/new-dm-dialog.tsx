'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar } from '@/components/common/avatar';
import { EmptyState } from '@/components/common/states';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader } from '@/components/ui/modal';
import { type Person, usePeople } from '@/hooks/use-people';
import { roomsKey } from '@/lib/query-keys';
import { openDm } from '@/lib/rest';
import { addRoom } from '@/lib/rooms-cache';
import type { Room } from '@/lib/types';
import { usePresenceStore } from '@/stores/presence-store';
import { toast } from '@/stores/toast-store';
import { useUiStore } from '@/stores/ui-store';

function PersonRow({
  person,
  busy,
  onPick,
}: {
  person: Person;
  busy: boolean;
  onPick: () => void;
}) {
  const status = usePresenceStore((s) => s.byUser[person.id]?.status);
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        data-user={person.username}
        className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        <Avatar name={person.username} size="lg" presence={status} ring="ring-popover" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{person.username}</span>
          {status && (
            <span className="block text-xs capitalize text-muted-foreground">{status}</span>
          )}
        </span>
      </button>
    </li>
  );
}

export function NewDmDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const people = usePeople(true);

  const q = search.trim().toLowerCase();
  const matches = (people.data ?? []).filter(
    (p) => p.id !== session?.user.id && p.username.toLowerCase().includes(q),
  );

  async function start(person: Person) {
    setBusy(person.id);
    try {
      const room = await openDm(person.id);
      queryClient.setQueryData<Room[]>(roomsKey, (rooms) => addRoom(rooms ?? [], room));
      useUiStore.getState().closeDrawers();
      onClose();
      router.push(`/rooms/${room.id}`);
    } catch (e) {
      toast.error('Could not open the conversation', e instanceof Error ? e.message : undefined);
      setBusy(null);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="dm-title">
      <ModalHeader
        id="dm-title"
        title="New direct message"
        description="Pick someone you share a room with."
        onClose={onClose}
      />
      <div className="relative mt-4">
        <label htmlFor="dm-search" className="sr-only">
          Search users
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="dm-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username"
          className="pl-9"
          data-autofocus
        />
      </div>
      <div className="mt-3 max-h-72 overflow-y-auto">
        {people.isPending ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground" role="status">
            Loading people…
          </p>
        ) : matches.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nobody found"
            description="You can message people you share a room with. Join a room to meet more people."
            className="py-8"
          />
        ) : (
          <ul className="space-y-0.5">
            {matches.map((p) => (
              <PersonRow key={p.id} person={p} busy={busy === p.id} onPick={() => void start(p)} />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
