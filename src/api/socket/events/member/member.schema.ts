import { z } from 'zod';

export const CreateMemberSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
    member: z.any(),
  })
  .strict();

export const UpdateMemberSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
    member: z.any(),
  })
  .strict();

export const DeleteMemberSchema = z
  .object({
    userId: z.string(),
    serverId: z.string(),
  })
  .strict();
