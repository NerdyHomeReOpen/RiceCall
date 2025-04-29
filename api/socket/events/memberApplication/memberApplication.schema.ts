import { z } from 'zod';

export const CreateMemberApplicationSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
    memberApplication: z.object({}),
  })
  .strict();

export const UpdateMemberApplicationSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
    memberApplication: z.object({}),
  })
  .strict();

export const DeleteMemberApplicationSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
  })
  .strict();
