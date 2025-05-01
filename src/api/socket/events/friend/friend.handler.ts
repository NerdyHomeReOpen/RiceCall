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

// Socket
import SocketServer from '@/api/socket';

export class CreateFriendHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, targetId, friend } = await new DataValidator(
        CreateFriendSchema,
        'CREATEFRIEND',
      ).validate(data);

      const targetSocket = SocketServer.getSocket(userId);

      const { userFriendAdd, targetFriendAdd } = await new CreateFriendService(
        operatorId,
        userId,
        targetId,
        friend,
      ).use();

      this.socket.emit('friendAdd', userFriendAdd);
      if (targetSocket) {
        targetSocket.emit('friendAdd', targetFriendAdd);
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

      await new UpdateFriendService(operatorId, userId, targetId, friend).use();

      this.socket.emit('friendUpdate', userId, targetId, friend);
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

      const targetSocket = SocketServer.getSocket(userId);

      await new DeleteFriendService(operatorId, userId, targetId).use();

      this.socket.emit('friendDelete', userId, targetId);
      if (targetSocket) {
        targetSocket.emit('friendDelete', userId, targetId);
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
