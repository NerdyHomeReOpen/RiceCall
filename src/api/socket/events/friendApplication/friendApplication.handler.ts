// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import { SocketHandler } from '@/api/socket';

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

export class CreateFriendApplicationHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { friendApplication, senderId, receiverId } =
        await new DataValidator(
          CreateFriendApplicationSchema,
          'CREATEFRIENDAPPLICATION',
        ).validate(data);

      const targetSocket = this.io.sockets.sockets.get(receiverId);

      const result = await new CreateFriendApplicationService(
        operatorId,
        senderId,
        receiverId,
        friendApplication,
      ).use();

      if (targetSocket) {
        targetSocket.emit(
          'friendApplicationsUpdate',
          result.friendApplicationsUpdate,
        );
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
      new Logger('FriendApplication').error(error);
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

      const result = await new UpdateFriendApplicationService(
        operatorId,
        senderId,
        receiverId,
        friendApplication,
      ).use();

      const targetSocket = this.io.sockets.sockets.get(receiverId);

      if (targetSocket) {
        targetSocket.emit(
          'friendApplicationsUpdate',
          result.friendApplicationsUpdate,
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
      new Logger('FriendApplication').error(error);
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

      const result = await new DeleteFriendApplicationService(
        operatorId,
        senderId,
        receiverId,
      ).use();

      const targetSocket = this.io.sockets.sockets.get(receiverId);

      if (targetSocket) {
        targetSocket.emit(
          'friendApplicationsUpdate',
          result.friendApplicationsUpdate,
        );
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
      new Logger('FriendApplication').error(error);
    }
  }
}
