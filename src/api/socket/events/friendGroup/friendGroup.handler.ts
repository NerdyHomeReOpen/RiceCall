import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';
import { UpdateFriendHandler } from '@/api/socket/events/friend/friend.handler';

// Schemas
import {
  CreateFriendGroupSchema,
  UpdateFriendGroupSchema,
  DeleteFriendGroupSchema,
} from '@/api/socket/events/friendGroup/friendGroup.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export class CreateFriendGroupHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, group: preset } = await new DataValidator(
        CreateFriendGroupSchema,
        'CREATEFRIENDGROUP',
      ).validate(data);

      if (operatorId !== userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法新增非自己的好友群組',
          part: 'CREATEFRIENDGROUP',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Create friend group
      const friendGroupId = uuidv4();
      await database.set.friendGroup(friendGroupId, {
        ...preset,
        userId: userId,
        createdAt: Date.now(),
      });

      this.socket.emit(
        'friendGroupAdd',
        await database.get.friendGroup(friendGroupId),
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `新增好友群組時發生無法預期的錯誤: ${error.message}`,
          part: 'CREATEFRIENDGROUP',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('FriendGroup').error(error.message);
    }
  }
}

export class UpdateFriendGroupHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const {
        userId,
        friendGroupId,
        group: update,
      } = await new DataValidator(
        UpdateFriendGroupSchema,
        'UPDATEFRIENDGROUP',
      ).validate(data);

      if (operatorId !== userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法更新非自己的好友群組',
          part: 'UPDATEFRIENDGROUP',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Update friend group
      await database.set.friendGroup(friendGroupId, update);

      this.socket.emit('friendGroupUpdate', friendGroupId, update);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新好友群組時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATEFRIENDGROUP',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('FriendGroup').error(error.message);
    }
  }
}

export class DeleteFriendGroupHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, friendGroupId } = await new DataValidator(
        DeleteFriendGroupSchema,
        'DELETEFRIENDGROUP',
      ).validate(data);

      const friendGroupFriends = await database.get.friendGroupFriends(
        friendGroupId,
      );

      if (operatorId !== userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法刪除非自己的好友群組',
          part: 'DELETEFRIENDGROUP',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (friendGroupFriends && friendGroupFriends.length > 0) {
        await Promise.all(
          friendGroupFriends.map(async (friend) => {
            await new UpdateFriendHandler(this.io, this.socket).handle({
              userId: friend.userId,
              targetId: friend.targetId,
              friend: {
                friendGroupId: null,
              },
            });
          }),
        );
      }

      // Delete friend group
      await database.delete.friendGroup(friendGroupId);

      this.socket.emit('friendGroupDelete', friendGroupId);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除好友群組時發生無法預期的錯誤: ${error.message}`,
          part: 'DELETEFRIENDGROUP',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('FriendGroup').error(error.message);
    }
  }
}
