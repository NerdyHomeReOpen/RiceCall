import { z } from 'zod';

export const LoginSchema = z
  .object({
    account: z.string(),
    password: z.string(),
    rememberAccount: z.boolean().optional(),
    autoLogin: z.boolean().optional(),
  })
  .strict();
