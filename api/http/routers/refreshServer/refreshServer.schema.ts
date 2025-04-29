import { z } from 'zod';

export const RefreshServerSchema = z
  .object({
    serverId: z.string(),
  })
  .strict();
