import { z } from 'zod';

export const SendMessageSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
    channelId: z.string(),
    message: z.any(),
  })
  .strict();

export const SendDirectMessageSchema = z
  .object({
    userId: z.string(),
    targetId: z.string(),
    directMessage: z.any(),
  })
  .strict();
