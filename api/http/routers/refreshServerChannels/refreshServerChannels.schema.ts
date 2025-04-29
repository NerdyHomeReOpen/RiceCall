import { z } from 'zod';

export const RefreshServerChannelsSchema = z
  .object({
    serverId: z.string(),
  })
  .strict();
