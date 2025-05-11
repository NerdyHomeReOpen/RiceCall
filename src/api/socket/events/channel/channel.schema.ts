import { z } from 'zod';

export const ChannelSchema = z.object({
  channelId: z.string().length(36),
  name: z.string().min(1).max(32),
  announcement: z.string().min(0).max(1000),
  password: z.string().min(0).max(4),
  order: z.number().min(0).max(9999),
  bitrate: z.number().min(1000).max(1000000),
  userLimit: z.number().min(0).max(999),
  guestTextGapTime: z.number().min(0).max(9999),
  guestTextWaitTime: z.number().min(0).max(9999),
  guestTextMaxLength: z.number().min(0).max(9999),
  forbidText: z.boolean(),
  forbidGuestText: z.boolean(),
  forbidGuestUrl: z.boolean(),
  type: z.enum(['category', 'channel']),
  voiceMode: z.enum(['free', 'queue', 'forbidden']),
  visibility: z.enum(['public', 'member', 'private', 'readonly']),
  categoryId: z.string().length(36).nullable(),
});

export const ConnectChannelSchema = z
  .object({
    userId: z.string().length(36),
    channelId: z.string().length(36),
    serverId: z.string().length(36),
    password: z.string().min(0).max(4).optional(),
  })
  .strict();

export const DisconnectChannelSchema = z
  .object({
    userId: z.string().length(36),
    channelId: z.string().length(36),
    serverId: z.string().length(36),
  })
  .strict();

export const CreateChannelSchema = z
  .object({
    serverId: z.string().length(36),
    channel: ChannelSchema.partial(),
  })
  .strict();

export const UpdateChannelSchema = z
  .object({
    channelId: z.string().length(36),
    serverId: z.string().length(36),
    channel: ChannelSchema.partial(),
  })
  .strict();

export const UpdateChannelsSchema = z
  .object({
    serverId: z.string().length(36),
    channels: z.array(ChannelSchema.partial()),
  })
  .strict();

export const DeleteChannelSchema = z
  .object({
    channelId: z.string().length(36),
    serverId: z.string().length(36),
  })
  .strict();
