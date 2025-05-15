import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Schemas
import {
  CreateFriendSchema,
  UpdateFriendSchema,
  DeleteFriendSchema,
} from '@/api/socket/events/friend/friend.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const CreateFriendHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        userId,
        targetId,
        friend: preset,
      } = await DataValidator.validate(
        CreateFriendSchema,
        data,
        'CREATEFRIEND',
      );

      const friend = await database.get.friend(userId, targetId);

      if (friend) reason = 'Already friends';

      if (operatorId !== userId) reason = 'Cannot add non-self friends';

      if (userId === targetId) reason = 'Cannot add self as a friend';

      if (reason) {
        new Logger('CreateFriend').warn(
          `User(${userId}) failed to add friend(${targetId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Create friend
      await database.set.friend(userId, targetId, {
        ...preset,
        createdAt: Date.now(),
      });

      // Create friend (reverse)
      await database.set.friend(targetId, userId, {
        ...preset,
        createdAt: Date.now(),
      });

      const targetSocket = SocketServer.getSocket(targetId);

      // Send socket event
      socket.emit('friendAdd', await database.get.userFriend(userId, targetId));
      if (targetSocket) {
        targetSocket.emit(
          'friendAdd',
          await database.get.userFriend(targetId, userId),
        );
      }

      /* ========== End of Handling ========== */

      new Logger('CreateFriend').info(
        `User(${userId}) added friend(${targetId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `建立好友時發生無法預期的錯誤，請稍後再試`,
          part: 'CREATEFRIEND',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('CreateFriend').error(error.message);
    }
  },
};

export const UpdateFriendHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, targetId, friend } = await DataValidator.validate(
        UpdateFriendSchema,
        data,
        'UPDATEFRIEND',
      );

      if (operatorId !== userId) reason = 'Cannot modify non-self friends';

      if (reason) {
        new Logger('UpdateFriend').warn(
          `User(${userId}) failed to update friend(${targetId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Update friend
      await database.set.friend(userId, targetId, friend);

      // Send socket event
      socket.emit('friendUpdate', userId, targetId, friend);

      /* ========== End of Handling ========== */

      new Logger('UpdateFriend').info(
        `User(${userId}) updated friend(${targetId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新好友時發生無法預期的錯誤，請稍後再試`,
          part: 'UPDATEFRIEND',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('UpdateFriend').error(error.message);
    }
  },
};

export const DeleteFriendHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, targetId } = await DataValidator.validate(
        DeleteFriendSchema,
        data,
        'DELETEFRIEND',
      );

      if (operatorId !== userId) reason = 'Cannot delete non-self friends';

      if (reason) {
        new Logger('DeleteFriend').warn(
          `User(${userId}) failed to delete friend(${targetId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Delete friend
      await database.delete.friend(userId, targetId);

      // Delete friend (reverse)
      await database.delete.friend(targetId, userId);

      // Send socket event
      const targetSocket = SocketServer.getSocket(targetId);

      socket.emit('friendDelete', userId, targetId);
      if (targetSocket) {
        targetSocket.emit('friendDelete', targetId, userId);
      }

      /* ========== End of Handling ========== */

      new Logger('DeleteFriend').info(
        `User(${userId}) deleted friend(${targetId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除好友時發生無法預期的錯誤，請稍後再試`,
          part: 'DELETEFRIEND',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('DeleteFriend').error(error.message);
    }
  },
};
