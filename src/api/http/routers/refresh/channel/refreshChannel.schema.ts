import { z } from 'zod';

export const RefreshChannelSchema = z
  .object({
    channelId: z.string(),
  })
  .strict();
