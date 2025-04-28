import { any, z } from 'zod';

// Error
import StandardizedError from '@/error';

export class RTCOfferValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const RTCOfferSchema = z
        .object({
          to: z.string(),
          offer: z.any(),
        })
        .strict();

      const result = RTCOfferSchema.safeParse(this.data);

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

export class RTCAnswerValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const RTCAnswerSchema = z
        .object({
          to: z.string(),
          answer: z.any(),
        })
        .strict();

      const result = RTCAnswerSchema.safeParse(this.data);

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

export class RTCCandidateValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const RTCAnswerSchema = z
        .object({
          to: z.string(),
          candidate: z.any(),
        })
        .strict();

      const result = RTCAnswerSchema.safeParse(this.data);

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

export class RTCJoinValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const RTCJoinSchema = z.object({
        channelId: z.string(),
      });

      const result = RTCJoinSchema.safeParse(this.data);

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

export class RTCLeaveValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const RTCLeaveSchema = z.object({
        channelId: z.string(),
      });

      const result = RTCLeaveSchema.safeParse(this.data);

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
