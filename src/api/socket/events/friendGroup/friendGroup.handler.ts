import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import { SocketRequestHandler } from '@/handler';

// Database
import { database } from '@/index';

// Handler
import { UpdateFriendHandler } from '@/api/socket/events/friend/friend.handler';

// Schemas
import {
  CreateFriendGroupSchema,
  UpdateFriendGroupSchema,
  DeleteFriendGroupSchema,
} from '@/api/socket/events/friendGroup/friendGroup.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const CreateFriendGroupHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'CREATEFRIENDGROUP';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, group: preset } = await DataValidator.validate(
        CreateFriendGroupSchema,
        data,
        part,
      );

      if (operatorId !== userId) {
        reason = 'Cannot create non-self friend groups';
      }

      if (reason) {
        new Logger('CreateFriendGroup').warn(
          `User(${userId}) failed to create friend group: ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Create friend group
      const friendGroupId = uuidv4();
      await database.set.friendGroup(friendGroupId, {
        ...preset,
        userId: userId,
        createdAt: Date.now(),
      });

      // Send socket event
      socket.emit(
        'friendGroupAdd',
        await database.get.friendGroup(friendGroupId),
      );

      /* ========== End of Handling ========== */

      new Logger('CreateFriendGroup').info(
        `User(${userId}) created friend group(${friendGroupId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('CreateFriendGroup').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `建立好友群組失敗，請稍後再試`,
          part: part,
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const UpdateFriendGroupHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'UPDATEFRIENDGROUP';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        userId,
        friendGroupId,
        group: update,
      } = await DataValidator.validate(
        UpdateFriendGroupSchema,
        data,
        part,
      );

      if (operatorId !== userId) {
        reason = 'Cannot update non-self friend groups';
      }

      if (reason) {
        new Logger('UpdateFriendGroup').warn(
          `User(${userId}) failed to update friend group(${friendGroupId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Update friend group
      await database.set.friendGroup(friendGroupId, update);

      // Send socket event
      socket.emit('friendGroupUpdate', friendGroupId, update);

      /* ========== End of Handling ========== */

      new Logger('UpdateFriendGroup').info(
        `User(${userId}) updated friend group(${friendGroupId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('UpdateFriendGroup').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `更新好友群組失敗，請稍後再試`,
          part: part,
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const DeleteFriendGroupHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'DELETEFRIENDGROUP';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, friendGroupId } = await DataValidator.validate(
        DeleteFriendGroupSchema,
        data,
        part,
      );

      const friendGroupFriends = await database.get.friendGroupFriends(
        friendGroupId,
      );

      if (operatorId !== userId) {
        reason = 'Cannot delete non-self friend groups';
      }

      if (reason) {
        new Logger('DeleteFriendGroup').warn(
          `User(${userId}) failed to delete friend group(${friendGroupId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      if (friendGroupFriends && friendGroupFriends.length > 0) {
        for (const friend of friendGroupFriends) {
          await UpdateFriendHandler.handle(io, socket, {
            userId: friend.userId,
            targetId: friend.targetId,
            friend: {
              friendGroupId: null,
            },
          });

          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Delete friend group
      await database.delete.friendGroup(friendGroupId);

      // Send socket event
      socket.emit('friendGroupDelete', friendGroupId);

      /* ========== End of Handling ========== */

      new Logger('DeleteFriendGroup').info(
        `User(${userId}) deleted friend group(${friendGroupId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('DeleteFriendGroup').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除好友群組失敗，請稍後再試`,
          part: part,
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};
