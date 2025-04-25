import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export default class RefreshFriendGroupValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const refreshFriendGroupSchema = z
        .object({
          friendGroupId: z.string(),
        })
        .strict();

      const result = refreshFriendGroupSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'REFRESHFRIENDGROUP',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHFRIENDGROUP',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
