import { z } from 'zod';

export const FriendApprovalSchema = z.object({
  targetId: z.string().length(36),
}).strict();