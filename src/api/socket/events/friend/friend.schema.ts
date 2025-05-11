import { z } from 'zod';

export const FriendSchema = z.object({
  userId: z.string().length(36),
  targetId: z.string().length(36),
  isBlocked: z.boolean(),
  friendGroupId: z.string().length(36).nullable(),
});

export const CreateFriendSchema = z
  .object({
    userId: z.string().length(36),
    targetId: z.string().length(36),
    friend: FriendSchema.partial(),
  })
  .strict();

export const UpdateFriendSchema = z
  .object({
    userId: z.string().length(36),
    targetId: z.string().length(36),
    friend: FriendSchema.partial(),
  })
  .strict();

export const DeleteFriendSchema = z
  .object({
    userId: z.string().length(36),
    targetId: z.string().length(36),
  })
  .strict();
