import { Server, Socket } from 'socket.io';

// Utils
import Logger from '@/utils/logger';

// Error
import StandardizedError from '@/error';

// Handler
import { ConnectServerHandler } from '@/api/socket/events/server/server.handler';
import { DisconnectServerHandler } from '@/api/socket/events/server/server.handler';
import { DisconnectChannelHandler } from '@/api/socket/events/channel/channel.handler';

// Schemas
import {
  SearchUserSchema,
  UpdateUserSchema,
} from '@/api/socket/events/user/user.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const SearchUserHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      // const operatorId = this.socket.data.userId;

      const { query } = await DataValidator.validate(
        SearchUserSchema,
        data,
        'SEARCHUSER',
      );

      const result = await database.get.searchUser(query);

      socket.emit('userSearch', result);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `搜尋使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('User').error(error.message);
    }
  },
};

export const ConnectUserHandler = {
  async handle(io: Server, socket: Socket) {
    try {
      const operatorId = socket.data.userId;

      const user = await database.get.user(operatorId);

      // Reconnect user to server
      if (user.currentServerId) {
        await ConnectServerHandler.handle(io, socket, {
          userId: operatorId,
          serverId: user.currentServerId,
        });
      }

      // Update user
      await database.set.user(operatorId, {
        lastActiveAt: Date.now(),
      });

      socket.emit('userUpdate', await database.get.user(operatorId));
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `連接使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'CONNECTUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('User').error(error.message);
    }
  },
};

export const DisconnectUserHandler = {
  async handle(io: Server, socket: Socket) {
    try {
      const operatorId = socket.data.userId;

      const user = await database.get.user(operatorId);

      // Disconnect user from server and channel
      if (user.currentServerId) {
        await DisconnectServerHandler.handle(io, socket, {
          userId: operatorId,
          serverId: user.currentServerId,
        });
      } else if (user.currentChannelId) {
        await DisconnectChannelHandler.handle(io, socket, {
          userId: operatorId,
          channelId: user.currentChannelId,
          serverId: user.currentServerId,
        });
      }

      // Update user
      await database.set.user(operatorId, {
        lastActiveAt: Date.now(),
      });

      socket.emit('userUpdate', null);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `斷開使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'DISCONNECTUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('User').error(error.message);
    }
  },
};

export const UpdateUserHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { userId, user: update } = await DataValidator.validate(
        UpdateUserSchema,
        data,
        'UPDATEUSER',
      );

      if (operatorId !== userId) {
        throw new StandardizedError({
          name: 'ServerError',
          message: '無法更新其他使用者的資料',
          part: 'UPDATEUSER',
          tag: 'PERMISSION_ERROR',
          statusCode: 403,
        });
      }

      await database.set.user(userId, update);

      socket.emit('userUpdate', update);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATEUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('User').error(error.message);
    }
  },
};
