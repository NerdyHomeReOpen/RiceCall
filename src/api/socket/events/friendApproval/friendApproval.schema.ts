import { z } from 'zod';

export const FriendApprovalSchema = z.object({
  targetId: z.string().length(36),
  friendGroupId: z.string().length(36).nullable()
}).strict();