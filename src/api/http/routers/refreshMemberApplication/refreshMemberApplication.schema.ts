import { z } from 'zod';

export const RefreshMemberApplicationSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
  })
  .strict();
