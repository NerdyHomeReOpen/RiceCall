// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';

// Schemas
import {
  CreateFriendApplicationSchema,
  UpdateFriendApplicationSchema,
  DeleteFriendApplicationSchema,
} from '@/api/socket/events/friendApplication/friendApplication.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  CreateFriendApplicationService,
  UpdateFriendApplicationService,
  DeleteFriendApplicationService,
} from '@/api/socket/events/friendApplication/friendApplication.service';

// Socket
import SocketServer from '@/api/socket';

export class CreateFriendApplicationHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { friendApplication, senderId, receiverId } =
        await new DataValidator(
          CreateFriendApplicationSchema,
          'CREATEFRIENDAPPLICATION',
        ).validate(data);

      const targetSocket = SocketServer.getSocket(receiverId);

      const { friendApplicationAdd } = await new CreateFriendApplicationService(
        operatorId,
        senderId,
        receiverId,
        friendApplication,
      ).use();

      if (targetSocket) {
        targetSocket.emit('friendApplicationAdd', friendApplicationAdd);
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `創建好友申請時發生預期外的錯誤: ${error.message}`,
          part: 'CREATEFRIENDAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('FriendApplication').error(error.message);
    }
  }
}

export class UpdateFriendApplicationHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { friendApplication, senderId, receiverId } =
        await new DataValidator(
          UpdateFriendApplicationSchema,
          'UPDATEFRIENDAPPLICATION',
        ).validate(data);

      await new UpdateFriendApplicationService(
        operatorId,
        senderId,
        receiverId,
        friendApplication,
      ).use();

      const targetSocket = SocketServer.getSocket(receiverId);

      if (targetSocket) {
        targetSocket.emit(
          'friendApplicationUpdate',
          senderId,
          receiverId,
          friendApplication,
        );
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新好友申請時發生預期外的錯誤: ${error.message}`,
          part: 'UPDATEFRIENDAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('FriendApplication').error(error.message);
    }
  }
}

export class DeleteFriendApplicationHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { senderId, receiverId } = await new DataValidator(
        DeleteFriendApplicationSchema,
        'DELETEFRIENDAPPLICATION',
      ).validate(data);

      await new DeleteFriendApplicationService(
        operatorId,
        senderId,
        receiverId,
      ).use();

      const targetSocket = SocketServer.getSocket(receiverId);

      if (targetSocket) {
        targetSocket.emit('friendApplicationDelete', senderId, receiverId);
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除好友申請時發生預期外的錯誤: ${error.message}`,
          part: 'DELETEFRIENDAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('FriendApplication').error(error.message);
    }
  }
}
