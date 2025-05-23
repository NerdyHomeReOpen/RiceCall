import { z } from 'zod';
import { MemberSchema } from '../member/member.schema';

export const MemberApplicationSchema = z.object({
  userId: z.string().length(36),
  serverId: z.string().length(36),
  description: z.string().min(0).max(200),
});

export const CreateMemberApplicationSchema = z
  .object({
    userId: z.string().length(36),
    serverId: z.string().length(36),
    memberApplication: MemberApplicationSchema.partial(),
  })
  .strict();

export const UpdateMemberApplicationSchema = z
  .object({
    userId: z.string().length(36),
    serverId: z.string().length(36),
    memberApplication: MemberApplicationSchema.partial(),
  })
  .strict();

export const DeleteMemberApplicationSchema = z
  .object({
    userId: z.string().length(36),
    serverId: z.string().length(36),
  })
  .strict();

export const ApproveMemberApplicationSchema = z
  .object({
    userId: z.string().length(36),
    serverId: z.string().length(36),
    member: MemberSchema.partial().optional(),
  })
  .strict();
