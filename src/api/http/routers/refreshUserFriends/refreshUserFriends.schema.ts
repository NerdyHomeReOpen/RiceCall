import { z } from 'zod';

export const RefreshUserFriendsSchema = z
  .object({
    userId: z.string(),
  })
  .strict();
