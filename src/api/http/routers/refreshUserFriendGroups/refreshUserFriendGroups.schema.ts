import { z } from 'zod';

export const RefreshUserFriendGroupsSchema = z
  .object({
    userId: z.string(),
  })
  .strict();
