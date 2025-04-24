import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export default class RefreshUserValidator {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async validate() {
    try {
      const refreshUserSchema = z
        .object({
          userId: z.string(),
        })
        .strict();

      const result = refreshUserSchema.safeParse({ userId: this.userId });

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'REFRESHUSER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHUSER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
