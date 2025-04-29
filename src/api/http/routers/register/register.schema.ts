import { z } from 'zod';

export const RegisterSchema = z
  .object({
    account: z.string().min(4).max(16),
    password: z
      .string()
      .min(8)
      .max(20)
      .regex(/^[a-zA-Z0-9@$!%*#?&]+$/),
    username: z
      .string()
      .min(1)
      .max(32)
      .regex(/^[A-Za-z0-9\u4e00-\u9fa5]+$/),
  })
  .strict();
