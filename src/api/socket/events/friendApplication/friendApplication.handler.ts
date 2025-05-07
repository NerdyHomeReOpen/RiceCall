// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

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

// Database
import { database } from '@/index';

export class CreateFriendApplicationHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const {
        senderId,
        receiverId,
        friendApplication: preset,
      } = await new DataValidator(
        CreateFriendApplicationSchema,
        'CREATEFRIENDAPPLICATION',
      ).validate(data);

      const friendApplication = await database.get.friendApplication(
        senderId,
        receiverId,
      );

      if (friendApplication) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你已經發送過好友申請',
          part: 'CREATEFRIENDAPPLICATION',
          tag: 'FRIENDAPPLICATION_EXISTS',
          statusCode: 400,
        });
      }

      if (operatorId !== senderId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法新增非自己的好友',
          part: 'CREATEFRIEND',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (senderId === receiverId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法將自己加入好友',
          part: 'CREATEFRIEND',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Create friend application
      await database.set.friendApplication(senderId, receiverId, {
        ...preset,
        createdAt: Date.now(),
      });

      const targetSocket = SocketServer.getSocket(receiverId);

      if (targetSocket) {
        targetSocket.emit(
          'friendApplicationAdd',
          await database.get.userFriendApplication(receiverId, senderId),
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
      new Logger('FriendApplication').error(error.message);
    }
  }
}

export class UpdateFriendApplicationHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const {
        senderId,
        receiverId,
        friendApplication: update,
      } = await new DataValidator(
        UpdateFriendApplicationSchema,
        'UPDATEFRIENDAPPLICATION',
      ).validate(data);

      if (operatorId !== senderId && operatorId !== receiverId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法修改非自己的好友申請',
          part: 'UPDATEFRIENDAPPLICATION',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Update friend application
      await database.set.friendApplication(senderId, receiverId, update);

      const targetSocket = SocketServer.getSocket(receiverId);

      if (targetSocket) {
        targetSocket.emit(
          'friendApplicationUpdate',
          senderId,
          receiverId,
          update,
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

      if (operatorId !== senderId && operatorId !== receiverId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法刪除非自己的好友申請',
          part: 'DELETEFRIENDAPPLICATION',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Delete friend application
      await database.delete.friendApplication(senderId, receiverId);

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
