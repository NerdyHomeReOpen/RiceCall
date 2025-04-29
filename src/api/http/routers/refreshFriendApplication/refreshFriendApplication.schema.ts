import { z } from 'zod';

export const RefreshFriendApplicationSchema = z
  .object({
    userId: z.string(),
    targetId: z.string(),
  })
  .strict();
