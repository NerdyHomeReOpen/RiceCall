import { z } from 'zod';

export const requestAccountRecoverSchema = z.object({
  account: z.string().min(1).max(100),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1).max(36),
  resetToken: z.string().min(1).max(300),
  newPassword: z.string().min(6).max(100),
});
