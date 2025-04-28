import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export class SearchUserValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const searchUserSchema = z
        .object({
          query: z.string(),
        })
        .strict();

      const result = searchUserSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'SEARCHUSER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'SEARCHUSER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class UpdateUserValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const updateUserSchema = z
        .object({
          userId: z.string(),
          user: z.any(), // TODO: implement schema
        })
        .strict();

      const result = updateUserSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'UPDATEUSER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'UPDATEUSER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
