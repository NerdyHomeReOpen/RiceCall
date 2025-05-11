import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export const DataValidator = {
  validate: async (schema: z.ZodSchema, data: any, part: string) => {
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new StandardizedError({
        name: 'ValidationError',
        message: `驗證資料失敗: ${result.error.errors
          .map(
            (error) =>
              `[${error.code}] ${error.path.join('.')}: ${error.message}`,
          )
          .join(', ')}`,
        part: part,
        tag: 'INVALID_DATA',
        statusCode: 401,
      });
    }

    return result.data;
  },
};
