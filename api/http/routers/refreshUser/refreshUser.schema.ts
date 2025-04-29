import { z } from 'zod';

export const RefreshUserSchema = z
  .object({
    userId: z.string(),
  })
  .strict();
