import { z } from 'zod';

export const ConnectChannelSchema = z
  .object({
    userId: z.string(),
    channelId: z.string(),
    serverId: z.string(),
    password: z.string().optional(),
  })
  .strict();

export const DisconnectChannelSchema = z
  .object({
    userId: z.string(),
    channelId: z.string(),
    serverId: z.string(),
  })
  .strict();

export const CreateChannelSchema = z
  .object({
    serverId: z.string(),
    channel: z.any(), // TODO: implement schema
  })
  .strict();

export const UpdateChannelSchema = z
  .object({
    channelId: z.string(),
    serverId: z.string(),
    channel: z.any(), // TODO: implement schema
  })
  .strict();

export const UpdateChannelsSchema = z
  .object({
    serverId: z.string(),
    channels: z.array(z.any()), // TODO: implement schema
  })
  .strict();

export const DeleteChannelSchema = z
  .object({
    channelId: z.string(),
    serverId: z.string(),
  })
  .strict();
