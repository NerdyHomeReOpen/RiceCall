import { z } from 'zod';

export const SearchUserSchema = z
  .object({
    query: z.string(),
  })
  .strict();

export const UpdateUserSchema = z
  .object({
    userId: z.string(),
    user: z.any(), // TODO: implement schema
  })
  .strict();
