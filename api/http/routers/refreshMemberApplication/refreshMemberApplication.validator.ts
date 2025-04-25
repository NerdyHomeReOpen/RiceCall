import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export default class RefreshMemberApplicationValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const refreshMemberApplicationSchema = z
        .object({
          userId: z.string(),
          serverId: z.string(),
        })
        .strict();

      const result = refreshMemberApplicationSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'REFRESHMEMBERAPPLICATION',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHMEMBERAPPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
