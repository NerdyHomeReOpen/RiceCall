import { z } from 'zod';

export const RefreshMemberSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
  })
  .strict();
