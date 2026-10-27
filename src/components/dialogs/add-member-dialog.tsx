'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Search, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Avatar } from '@/components/common/avatar';
import { EmptyState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader } from '@/components/ui/modal';
import { type Person, usePeople } from '@/hooks/use-people';
import { membersKey, roomsKey } from '@/lib/query-keys';
import { addMember, listMembers } from '@/lib/rest';
import { toast } from '@/stores/toast-store';

export function AddMemberDialog({
  roomId,
  roomName,
  onClose,
}: {
  roomId: string;
  roomName: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Person[]>([]);
  const [saving, setSaving] = useState(false);
  const people = usePeople(true);
  const members = useQuery({
    queryKey: membersKey(roomId),
    queryFn: () => listMembers(roomId),
    staleTime: 30_000,
  });

  const memberIds = new Set(members.data?.map((m) => m.userId));
  const q = search.trim().toLowerCase();
  const matches = (people.data ?? []).filter(
    (p) => p.id !== session?.user.id && p.username.toLowerCase().includes(q),
  );
  const isSelected = (p: Person) => selected.some((s) => s.id === p.id);

  function toggle(p: Person) {
    setSelected((cur) =>
      cur.some((s) => s.id === p.id) ? cur.filter((s) => s.id !== p.id) : [...cur, p],
    );
  }

  async function submit() {
    setSaving(true);
    const failed: string[] = [];
    for (const person of selected) {
      try {
        await addMember(roomId, person.id);
      } catch {
        failed.push(person.username);
      }
    }
    void queryClient.invalidateQueries({ queryKey: membersKey(roomId) });
    void queryClient.invalidateQueries({ queryKey: roomsKey });
    setSaving(false);
    if (failed.length) toast.error('Some people could not be added', failed.join(', '));
    else
      toast.success(
        selected.length === 1 ? `${selected[0].username} added` : `${selected.length} people added`,
      );
    if (failed.length < selected.length) onClose();
  }

  return (
    <Modal onClose={onClose} labelledBy="add-title">
      <ModalHeader
        id="add-title"
        title={`Add people to #${roomName}`}
        description="They'll get a notification and can start reading right away."
        onClose={onClose}
      />

      {selected.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Selected people">
          {selected.map((p) => (
            <li
              key={p.id}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-accent pl-2.5 pr-1 text-xs font-medium text-accent-foreground"
            >
              {p.username}
              <button
                type="button"
                onClick={() => toggle(p)}
                aria-label={`Remove ${p.username}`}
                className="inline-flex size-5 items-center justify-center rounded-full hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-3">
        <label htmlFor="add-search" className="sr-only">
          Search users to add
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="add-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username"
          className="pl-9"
          data-autofocus
        />
      </div>

      <div className="mt-3 max-h-64 overflow-y-auto">
        {people.isPending || members.isPending ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground" role="status">
            Loading people…
          </p>
        ) : matches.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nobody found"
            description="You can add people you share a room with."
            className="py-8"
          />
        ) : (
          <ul className="space-y-0.5">
            {matches.map((p) => {
              const already = memberIds.has(p.id);
              const picked = isSelected(p);
              return (
                <li
                  key={p.id}
                  data-user={p.username}
                  className={
                    picked
                      ? 'flex items-center gap-3 rounded-md bg-accent/60 p-2'
                      : 'flex items-center gap-3 rounded-md p-2 hover:bg-accent/60'
                  }
                >
                  <Avatar name={p.username} size="lg" />
                  <span className="min-w-0 flex-1 text-sm font-medium">{p.username}</span>
                  {already ? (
                    <span className="text-xs text-muted-foreground">Already a member</span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant={picked ? 'ghost' : 'outline'}
                      className="h-8 px-3 text-xs"
                      onClick={() => toggle(p)}
                      aria-label={`${picked ? 'Unselect' : 'Select'} ${p.username}`}
                    >
                      {picked ? (
                        <>
                          <Check className="size-3.5" aria-hidden="true" />
                          Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={selected.length === 0}
          loading={saving}
          onClick={() => void submit()}
        >
          {selected.length <= 1 ? 'Add 1 person' : `Add ${selected.length} people`}
        </Button>
      </div>
    </Modal>
  );
}
