import { Server, Socket } from 'socket.io';

// Utils
import Logger from '@/utils/logger';

// Error
import StandardizedError from '@/error';

// Handler
import { ConnectServerHandler } from '@/api/socket/events/server/server.handler';
import { DisconnectServerHandler } from '@/api/socket/events/server/server.handler';

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
      /* ========== Start of Handling ========== */

      const { query } = await DataValidator.validate(
        SearchUserSchema,
        data,
        'SEARCHUSER',
      );

      /* ========== Start of Main Logic ========== */

      const result = await database.get.searchUser(query);

      socket.emit('userSearch', result);

      /* ========== End of Handling ========== */
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

      new Logger('SearchUser').error(error.message);
    }
  },
};

export const ConnectUserHandler = {
  async handle(io: Server, socket: Socket) {
    try {
      /* ========== Start of Handling ========== */

      const operatorId = socket.data.userId;

      const user = await database.get.user(operatorId);

      /* ========== Start of Pre Main Logic ========== */

      // Reconnect user to server
      if (user.currentServerId) {
        await DisconnectServerHandler.handle(io, socket, {
          userId: operatorId,
          serverId: user.currentServerId,
        });

        await ConnectServerHandler.handle(io, socket, {
          userId: operatorId,
          serverId: user.currentServerId,
        });
      }

      /* ========== Start of Main Logic ========== */

      // Update user
      await database.set.user(operatorId, {
        lastActiveAt: Date.now(),
      });

      socket.emit('userUpdate', await database.get.user(operatorId));

      /* ========== End of Handling ========== */

      new Logger('ConnectUser').info(`User(${operatorId}) connected`);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `連接使用者時發生無法預期的錯誤，請稍後再試`,
          part: 'CONNECTUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('ConnectUser').error(error.message);
    }
  },
};

export const DisconnectUserHandler = {
  async handle(io: Server, socket: Socket) {
    try {
      /* ========== Start of Handling ========== */

      const operatorId = socket.data.userId;

      const user = await database.get.user(operatorId);

      /* ========== Start of Pre Main Logic ========== */

      // Disconnect user from server and channel
      if (user.currentServerId) {
        await DisconnectServerHandler.handle(io, socket, {
          userId: operatorId,
          serverId: user.currentServerId,
        });
      }

      /* ========== Start of Main Logic ========== */

      // Update user
      await database.set.user(operatorId, {
        lastActiveAt: Date.now(),
      });

      socket.emit('userUpdate', null);

      /* ========== End of Handling ========== */

      new Logger('DisconnectUser').info(`User(${operatorId}) disconnected`);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `斷開使用者時發生無法預期的錯誤，請稍後再試`,
          part: 'DISCONNECTUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('DisconnectUser').error(error.message);
    }
  },
};

export const UpdateUserHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, user: update } = await DataValidator.validate(
        UpdateUserSchema,
        data,
        'UPDATEUSER',
      );

      if (operatorId !== userId) {
        reason = 'Cannot update other user data';
      }

      if (reason) {
        new Logger('UpdateUser').warn(
          `User(${operatorId}) failed to update user(${userId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Update user
      await database.set.user(userId, update);

      // Send socket event
      socket.emit('userUpdate', update);

      /* ========== End of Handling ========== */

      new Logger('UpdateUser').info(`User(${operatorId}) updated`);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新使用者時發生無法預期的錯誤，請稍後再試`,
          part: 'UPDATEUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('UpdateUser').error(error.message);
    }
  },
};
