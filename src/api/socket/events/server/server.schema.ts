import { z } from 'zod';

export const ServerSchema = z.object({
  serverId: z.string().length(36),
  name: z.string().min(1).max(32),
  avatar: z.string().min(0).max(255),
  avatarUrl: z.string().min(0).max(255),
  announcement: z.string().min(0).max(1000),
  applyNotice: z.string().min(0).max(200),
  description: z.string().min(0).max(200),
  slogan: z.string().min(0).max(100),
  receiveApply: z.boolean(),
  type: z.enum(['game', 'entertainment', 'other']),
  visibility: z.enum(['public', 'private', 'invisible']),
  receptionLobbyId: z.string().length(36),
});

export const ConnectServerSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
  })
  .strict();

export const DisconnectServerSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
  })
  .strict();

export const SearchServerSchema = z
  .object({
    query: z.string(),
  })
  .strict();

export const CreateServerSchema = z
  .object({
    server: ServerSchema.partial(),
  })
  .strict();

export const UpdateServerSchema = z
  .object({
    serverId: z.string(),
    server: ServerSchema.partial(),
  })
  .strict();
