import { z } from 'zod';

export const RefreshFriendSchema = z
  .object({
    userId: z.string(),
    targetId: z.string(),
  })
  .strict();
