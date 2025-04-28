import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export class SendMessageValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const SendMessageSchema = z
        .object({
          userId: z.string(),
          serverId: z.string(),
          channelId: z.string(),
          message: z.any(),
        })
        .strict();

      const result = SendMessageSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'SEARCHSERVER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'SEARCHSERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class SendDirectMessageValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const SendDirectMessageSchema = z.object({
        userId: z.string(),
        targetId: z.string(),
        directMessage: z.any(),
      });

      const result = SendDirectMessageSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'SEARCHSERVER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'SEARCHSERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
