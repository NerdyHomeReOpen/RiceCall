import { z } from 'zod';

export const DataValidator = {
  validate: async (schema: z.ZodSchema, data: any, part: string) => {
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new Error(
        `Zod validation error: ${result.error.errors
          .map(
            (error) =>
              `[${error.code}] ${error.path.join('.')}: ${error.message}`,
          )
          .join(', ')}`,
      );
    }

    return result.data;
  },
};
