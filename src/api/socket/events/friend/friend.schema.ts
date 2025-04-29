import { z } from 'zod';

export const CreateFriendSchema = z
  .object({
    userId: z.string(),
    targetId: z.string(),
    friend: z.any(), // TODO: change friend schema
  })
  .strict();

export const UpdateFriendSchema = z
  .object({
    userId: z.string(),
    targetId: z.string(),
    friend: z.any(), // TODO: change friend schema
  })
  .strict();

export const DeleteFriendSchema = z
  .object({
    userId: z.string(),
    targetId: z.string(),
  })
  .strict();
