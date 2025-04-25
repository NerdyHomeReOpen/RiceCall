import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export default class RefreshFriendValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const refreshFriendSchema = z
        .object({
          userId: z.string(),
          targetId: z.string(),
        })
        .strict();

      const result = refreshFriendSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'REFRESHFRIEND',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHFRIEND',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
