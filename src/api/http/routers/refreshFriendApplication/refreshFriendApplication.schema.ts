import { z } from 'zod';

export const RefreshFriendApplicationSchema = z
  .object({
    senderId: z.string(),
    receiverId: z.string(),
  })
  .strict();
