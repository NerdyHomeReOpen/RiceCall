import { z } from 'zod';

export const RefreshServerMembersSchema = z
  .object({
    serverId: z.string(),
  })
  .strict();
