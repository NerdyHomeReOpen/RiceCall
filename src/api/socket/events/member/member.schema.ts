import { z } from 'zod';

export const MemberSchema = z.object({
  userId: z.string().length(36),
  serverId: z.string().length(36),
  nickname: z.string().min(0).max(32).nullable(),
  permissionLevel: z.number().min(1).max(8),
  isBlocked: z.number().min(-1),
});

export const CreateMemberSchema = z
  .object({
    userId: z.string().length(36),
    serverId: z.string().length(36),
    member: MemberSchema.partial(),
  })
  .strict();

export const UpdateMemberSchema = z
  .object({
    userId: z.string().length(36),
    serverId: z.string().length(36),
    member: MemberSchema.partial(),
  })
  .strict();

export const DeleteMemberSchema = z
  .object({
    userId: z.string().length(36),
    serverId: z.string().length(36),
  })
  .strict();
