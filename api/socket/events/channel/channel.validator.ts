import { z } from 'zod';

// Error
import StandardizedError from '@/error';

export class ConnectChannelValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const ConnectChannelSchema = z.object({
        userId: z.string(),
        channelId: z.string(),
        serverId: z.string(),
        password: z.string().optional(),
      });

      const result = ConnectChannelSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'CONNECTCHANNEL',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'CONNECTCHANNEL',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class DisconnectChannelValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const DisconnectChannelSchema = z.object({
        userId: z.string(),
        channelId: z.string(),
        serverId: z.string(),
      });

      const result = DisconnectChannelSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'DISCONNECTCHANNEL',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'DISCONNECTCHANNEL',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class CreateChannelValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const CreateChannelSchema = z.object({
        serverId: z.string(),
        channel: z.any(), // TODO: implement schema
      });

      const result = CreateChannelSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'CREATECHANNEL',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'CREATECHANNEL',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class UpdateChannelValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const UpdateChannelSchema = z.object({
        channelId: z.string(),
        serverId: z.string(),
        channel: z.any(), // TODO: implement schema
      });

      const result = UpdateChannelSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'UPDATECHANNEL',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'UPDATECHANNEL',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class UpdateChannelsValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const UpdateChannelsSchema = z.object({
        serverId: z.string(),
        channels: z.array(z.any()), // TODO: implement schema
      });

      const result = UpdateChannelsSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'UPDATECHANNELS',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'UPDATECHANNELS',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class DeleteChannelValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const DeleteChannelSchema = z.object({
        channelId: z.string(),
        serverId: z.string(),
      });

      const result = DeleteChannelSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'DELETECHANNEL',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      return result.data;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'DELETECHANNEL',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
