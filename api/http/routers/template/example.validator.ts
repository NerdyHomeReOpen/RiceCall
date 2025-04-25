import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export default class ExampleValidator {
  // TODO: change validator name
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const exampleSchema = z // TODO: change schema name
        .object({
          example: z.string(), // TODO: implement schema
        })
        .strict();

      const result = exampleSchema.safeParse(this.data); // TODO: change schema

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: '', // TODO: implement part
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: '', // TODO: implement part
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
