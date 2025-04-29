import { z } from 'zod';

export const CreateFriendGroupSchema = z
  .object({
    userId: z.string(),
    group: z.any(), // TODO: implement schema
  })
  .strict();

export const UpdateFriendGroupSchema = z
  .object({
    userId: z.string(),
    friendGroupId: z.string(),
    group: z.any(), // TODO: implement schema
  })
  .strict();

export const DeleteFriendGroupSchema = z
  .object({
    userId: z.string(),
    friendGroupId: z.string(),
  })
  .strict();
