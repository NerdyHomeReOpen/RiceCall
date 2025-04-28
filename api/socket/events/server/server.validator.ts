import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export class SearchServerValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const searchServerSchema = z
        .object({
          query: z.string(),
        })
        .strict();

      const result = searchServerSchema.safeParse(this.data);

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

export class CreateServerValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const createServerSchema = z
        .object({
          server: z.any(), // TODO: implement schema
        })
        .strict();

      const result = createServerSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'CREATESERVER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'CREATESERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class UpdateServerValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const updateServerSchema = z
        .object({
          serverId: z.string(),
          server: z.any(), // TODO: implement schema
        })
        .strict();

      const result = updateServerSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'UPDATESERVER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'UPDATESERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class ConnectServerValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const connectServerSchema = z
        .object({
          userId: z.string(),
          serverId: z.string(),
        })
        .strict();

      const result = connectServerSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'CONNECTSERVER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'CONNECTSERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class DisconnectServerValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const disconnectServerSchema = z
        .object({
          userId: z.string(),
          serverId: z.string(),
        })
        .strict();

      const result = disconnectServerSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'DISCONNECTSERVER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'DISCONNECTSERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
