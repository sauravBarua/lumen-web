'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Hash, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormAlert } from '@/components/auth/form-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal, ModalHeader } from '@/components/ui/modal';
import { Switch } from '@/components/ui/switch';
import { roomsKey } from '@/lib/query-keys';
import { ApiError, createRoom } from '@/lib/rest';
import { addRoom } from '@/lib/rooms-cache';
import { type CreateRoomValues, createRoomSchema } from '@/lib/schemas/chat';
import type { Room } from '@/lib/types';
import { toast } from '@/stores/toast-store';
import { useUiStore } from '@/stores/ui-store';

export function CreateRoomDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { name: '', description: '', isPrivate: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const room = await createRoom({
        name: values.name,
        description: values.description || undefined,
        type: values.isPrivate ? 'PRIVATE' : 'PUBLIC',
      });
      queryClient.setQueryData<Room[]>(roomsKey, (rooms) => addRoom(rooms ?? [], room));
      useUiStore.getState().closeDrawers();
      onClose();
      router.push(`/rooms/${room.id}`);
      toast.success('Room created', `#${room.name} is ready. Invite your team.`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409)
        setError('name', { message: 'This room name is already taken' });
      else setFormError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  });

  return (
    <Modal onClose={onClose} labelledBy="create-title" describedBy="create-desc">
      <ModalHeader
        id="create-title"
        title="Create a room"
        description="Rooms are where conversations happen around a topic."
        onClose={onClose}
      />
      {formError && <FormAlert className="mt-4">{formError}</FormAlert>}
      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="room-name">Name</Label>
          <div className="relative">
            <Hash
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="room-name"
              placeholder="design-reviews"
              maxLength={50}
              aria-invalid={!!errors.name || undefined}
              className="pl-9"
              data-autofocus
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="room-desc">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <textarea
            id="room-desc"
            rows={3}
            maxLength={500}
            placeholder="Weekly critique of new screens and prototypes"
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('description')}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <div className="min-w-0">
            <p id="private-label" className="flex items-center gap-1.5 text-sm font-medium">
              <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
              Private room
            </p>
            <p id="private-desc" className="text-xs text-muted-foreground">
              Only people you add can find and read it. Public rooms can be found by everyone.
            </p>
          </div>
          <Controller
            control={control}
            name="isPrivate"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-labelledby="private-label"
                aria-describedby="private-desc"
              />
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create room
          </Button>
        </div>
      </form>
    </Modal>
  );
}
