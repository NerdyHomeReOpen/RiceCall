// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';

// Schemas
import {
  CreateFriendSchema,
  UpdateFriendSchema,
  DeleteFriendSchema,
} from '@/api/socket/events/friend/friend.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  CreateFriendService,
  DeleteFriendService,
  UpdateFriendService,
} from '@/api/socket/events/friend/friend.service';

export class CreateFriendHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, targetId, friend } = await new DataValidator(
        CreateFriendSchema,
        'CREATEFRIEND',
      ).validate(data);

      const targetSocket = this.io.sockets.sockets.get(userId);

      const result = await new CreateFriendService(
        operatorId,
        userId,
        targetId,
        friend,
      ).use();

      this.socket.emit('friendsUpdate', result.userFriendsUpdate);
      if (targetSocket) {
        targetSocket.emit('friendsUpdate', result.targetFriendsUpdate);
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `建立好友時發生無法預期的錯誤: ${error.message}`,
          part: 'CREATEFRIEND',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('Friend').error(error.message);
    }
  }
}

export class UpdateFriendHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, targetId, friend } = await new DataValidator(
        UpdateFriendSchema,
        'UPDATEFRIEND',
      ).validate(data);

      const result = await new UpdateFriendService(
        operatorId,
        userId,
        targetId,
        friend,
      ).use();

      this.socket.emit('friendsUpdate', result.userFriendsUpdate);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新好友時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATEFRIEND',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('Friend').error(error.message);
    }
  }
}

export class DeleteFriendHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, targetId } = await new DataValidator(
        DeleteFriendSchema,
        'DELETEFRIEND',
      ).validate(data);

      const targetSocket = this.io.sockets.sockets.get(userId);

      const result = await new DeleteFriendService(
        operatorId,
        userId,
        targetId,
      ).use();

      this.socket.emit('friendsUpdate', result.userFriendsUpdate);
      if (targetSocket) {
        targetSocket.emit('friendsUpdate', result.targetFriendsUpdate);
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除好友時發生無法預期的錯誤: ${error.message}`,
          part: 'DELETEFRIEND',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('Friend').error(error.message);
    }
  }
}
