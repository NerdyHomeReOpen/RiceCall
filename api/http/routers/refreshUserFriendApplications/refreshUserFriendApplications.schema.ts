import { z } from 'zod';

export const RefreshUserFriendApplicationsSchema = z
  .object({
    userId: z.string(),
  })
  .strict();
