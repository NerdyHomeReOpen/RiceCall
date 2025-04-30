import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export default class DataValidator {
  constructor(private schema: z.ZodSchema, private part: string) {
    this.schema = schema;
    this.part = part;
  }

  async validate(data: any) {
    const result = this.schema.safeParse(data);

    if (!result.success) {
      throw new StandardizedError({
        name: 'ValidationError',
        message: `驗證資料失敗: ${result.error.message}`,
        part: this.part,
        tag: 'INVALID_DATA',
        statusCode: 401,
      });
    }

    return result.data;
  }
}
