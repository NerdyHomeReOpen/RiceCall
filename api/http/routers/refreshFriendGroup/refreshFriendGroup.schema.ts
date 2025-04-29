import { z } from 'zod';

export const RefreshFriendGroupSchema = z
  .object({
    friendGroupId: z.string(),
  })
  .strict();
