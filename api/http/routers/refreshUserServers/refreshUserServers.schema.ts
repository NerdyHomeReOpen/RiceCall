import { z } from 'zod';

export const RefreshUserServersSchema = z
  .object({
    userId: z.string(),
  })
  .strict();
