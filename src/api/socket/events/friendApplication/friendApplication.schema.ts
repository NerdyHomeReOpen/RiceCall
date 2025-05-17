import { z } from 'zod';

export const FriendApplicationSchema = z.object({
  senderId: z.string().length(36),
  receiverId: z.string().length(36),
  description: z.string().min(0).max(200),
});

export const CreateFriendApplicationSchema = z
  .object({
    senderId: z.string().length(36),
    receiverId: z.string().length(36),
    friendApplication: FriendApplicationSchema.partial(),
  })
  .strict();

export const UpdateFriendApplicationSchema = z
  .object({
    senderId: z.string().length(36),
    receiverId: z.string().length(36),
    friendApplication: FriendApplicationSchema.partial(),
  })
  .strict();

export const DeleteFriendApplicationSchema = z
  .object({
    senderId: z.string().length(36),
    receiverId: z.string().length(36),
  })
  .strict();

export const ApproveFriendApplicationSchema = z
  .object({
    userId: z.string().length(36),
    targetId: z.string().length(36),
    friendGroupId: z.string().length(36).nullable(),
  })
  .strict();
