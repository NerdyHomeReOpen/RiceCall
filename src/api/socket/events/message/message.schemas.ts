import { z } from 'zod';

export const MessageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['general', 'info', 'warn', 'event', 'dm']),
});

export const ChannelMessageSchema = MessageSchema.extend({
  type: z.literal('general'),
});

export const DirectMessageSchema = MessageSchema.extend({
  type: z.literal('dm'),
});

export const SendMessageSchema = z
  .object({
    userId: z.string().length(36),
    serverId: z.string().length(36),
    channelId: z.string().length(36),
    message: MessageSchema.partial(),
  })
  .strict();

export const SendDirectMessageSchema = z
  .object({
    userId: z.string().length(36),
    targetId: z.string().length(36),
    directMessage: DirectMessageSchema.partial(),
  })
  .strict();

export const ShakeWindowSchema = z
  .object({
    userId: z.string().length(36),
    targetId: z.string().length(36),
  })
  .strict();
