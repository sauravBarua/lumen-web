import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().trim().min(3, 'Use at least 3 characters').max(50, 'Use at most 50 characters'),
  description: z.string().trim().max(500, 'Use at most 500 characters'),
  isPrivate: z.boolean(),
});

export type CreateRoomValues = z.infer<typeof createRoomSchema>;
