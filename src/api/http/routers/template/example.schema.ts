import { z } from 'zod';

export const ExampleSchema = z
  .object({
    example: z.string(),
  })
  .strict();
