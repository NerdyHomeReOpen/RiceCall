import { z } from 'zod';

export const SearchServerSchema = z
  .object({
    query: z.string(),
  })
  .strict();

export const CreateServerSchema = z
  .object({
    server: z.any(), // TODO: implement schema
  })
  .strict();

export const UpdateServerSchema = z
  .object({
    serverId: z.string(),
    server: z.any(), // TODO: implement schema
  })
  .strict();

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
