import { Server, Socket } from 'socket.io';

// Utils
import Logger from '@/utils/logger';

// Error
import StandardizedError from '@/error';

// Socket
import { SocketRequestHandler } from '@/handler';

// Database
import { database } from '@/index';

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

// Socket
import SocketServer from '@/api/socket';

export const SearchUserHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'SEARCHUSER';
    try {
      /* ========== Start of Handling ========== */

      const { query } = await DataValidator.validate(
        SearchUserSchema,
        data,
        part,
      );

      /* ========== Start of Main Logic ========== */

      const operatorId = socket.data.userId;

      const result = await database.get.searchUser(query);

      if (result) {
        const friend = await database.get.friend(operatorId, result.userId);
        if (friend) {
          socket.emit('openPopup', {
          type: 'dialogAlert',
          id: 'alreadyFriend',
          initialData: {
            title: '已經是好友',
          },
          });
          return;
        }
      }

      socket.emit('userSearch', result);

      /* ========== End of Handling ========== */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('SearchUser').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `搜尋使用者失敗，請稍後再試`,
          part: part,
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const ConnectUserHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket) {
    const part = 'CONNECTUSER';
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

      const updatePayload = {
        status: 'online',
        lastActiveAt: Date.now(),
      };

      // Update user
      await database.set.user(operatorId, updatePayload);

      const updatedUser = {
        ...user,
        ...updatePayload,
      };

      socket.emit('userUpdate', updatedUser);

      // send edited data to all online friends
      const userFriends = await database.get.userFriends(operatorId);
      
      for(const friend of userFriends) {
        const targetSocket = SocketServer.getSocket(friend.targetId);
        if (targetSocket && friend.status !== 'offline') {
          targetSocket.emit('friendUpdate',
            friend.targetId, 
            operatorId, 
            updatedUser
          );
        }
      }

      /* ========== End of Handling ========== */

      new Logger('ConnectUser').info(`User(${operatorId}) connected`);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('ConnectUser').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `連接使用者失敗，請稍後再試`,
          part: part,
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const DisconnectUserHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket) {
    const part = 'DISCONNECTUSER';
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
      
      const updatePayload = {
        status: 'offline',
        lastActiveAt: Date.now(),
      };

      // Update user
      await database.set.user(operatorId, updatePayload);

      const updatedUser = {
        ...user,
        ...updatePayload
      };

      socket.emit('userUpdate', null);

      // send edited data to all online friends
      const userFriends = await database.get.userFriends(operatorId);
      
      for(const friend of userFriends) {
        const targetSocket = SocketServer.getSocket(friend.targetId);
        if (targetSocket && friend.status !== 'offline') {
          targetSocket.emit('friendUpdate',
            friend.targetId, 
            operatorId, 
            updatedUser
          );
        }
      }

      /* ========== End of Handling ========== */

      new Logger('DisconnectUser').info(`User(${operatorId}) disconnected`);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('DisconnectUser').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `斷開使用者失敗，請稍後再試`,
          part: part,
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const UpdateUserHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'UPDATEUSER';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, user: update } = await DataValidator.validate(
        UpdateUserSchema,
        data,
        part,
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

      // send edited data to all online friends
      const userFriends = await database.get.userFriends(userId);
      
      for(const friend of userFriends) {
        const targetSocket = SocketServer.getSocket(friend.targetId);
        if (targetSocket && friend.status !== 'offline') {
          targetSocket.emit('friendUpdate',
            friend.targetId, 
            userId, 
            update
          );
        }
      }

      /* ========== End of Handling ========== */

      new Logger('UpdateUser').info(`User(${operatorId}) updated`);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('UpdateUser').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `更新使用者失敗，請稍後再試`,
          part: part,
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};
