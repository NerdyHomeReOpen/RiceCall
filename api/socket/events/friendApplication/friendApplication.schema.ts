import { z } from 'zod';

export const CreateFriendApplicationSchema = z
  .object({
    senderId: z.string(),
    receiverId: z.string(),
    friendApplication: z.any(), // TODO: change friend schema
  })
  .strict();

export const UpdateFriendApplicationSchema = z
  .object({
    senderId: z.string(),
    receiverId: z.string(),
    friendApplication: z.any(), // TODO: change friend schema
  })
  .strict();

export const DeleteFriendApplicationSchema = z
  .object({
    senderId: z.string(),
    receiverId: z.string(),
  })
  .strict();
