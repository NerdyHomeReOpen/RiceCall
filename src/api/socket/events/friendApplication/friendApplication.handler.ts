import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Schemas
import {
  CreateFriendApplicationSchema,
  UpdateFriendApplicationSchema,
  DeleteFriendApplicationSchema,
} from '@/api/socket/events/friendApplication/friendApplication.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const CreateFriendApplicationHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const {
        senderId,
        receiverId,
        friendApplication: preset,
      } = await DataValidator.validate(
        CreateFriendApplicationSchema,
        data,
        'CREATEFRIENDAPPLICATION',
      );

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

      /* Start of Main Logic */

      // Create friend application
      await database.set.friendApplication(senderId, receiverId, {
        ...preset,
        createdAt: Date.now(),
      });

      // Send socket event
      const targetSocket = SocketServer.getSocket(receiverId);

      if (targetSocket) {
        targetSocket.emit(
          'friendApplicationAdd',
          await database.get.userFriendApplication(receiverId, senderId),
        );
      }

      /* End of Main Logic */
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

      socket.emit('error', error);
      new Logger('FriendApplication').error(error.message);
    }
  },
};

export const UpdateFriendApplicationHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const {
        senderId,
        receiverId,
        friendApplication: update,
      } = await DataValidator.validate(
        UpdateFriendApplicationSchema,
        data,
        'UPDATEFRIENDAPPLICATION',
      );

      if (operatorId !== senderId && operatorId !== receiverId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法修改非自己的好友申請',
          part: 'UPDATEFRIENDAPPLICATION',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      /* Start of Main Logic */

      // Update friend application
      await database.set.friendApplication(senderId, receiverId, update);

      // Send socket event
      const targetSocket = SocketServer.getSocket(receiverId);

      if (targetSocket) {
        targetSocket.emit(
          'friendApplicationUpdate',
          senderId,
          receiverId,
          update,
        );
      }

      /* End of Main Logic */
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

      socket.emit('error', error);
      new Logger('FriendApplication').error(error.message);
    }
  },
};

export const DeleteFriendApplicationHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { senderId, receiverId } = await DataValidator.validate(
        DeleteFriendApplicationSchema,
        data,
        'DELETEFRIENDAPPLICATION',
      );

      if (operatorId !== senderId && operatorId !== receiverId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法刪除非自己的好友申請',
          part: 'DELETEFRIENDAPPLICATION',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      /* Start of Main Logic */

      // Delete friend application
      await database.delete.friendApplication(senderId, receiverId);

      // Send socket event
      const targetSocket = SocketServer.getSocket(receiverId);

      if (targetSocket) {
        targetSocket.emit('friendApplicationDelete', senderId, receiverId);
      }

      /* End of Main Logic */
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

      socket.emit('error', error);
      new Logger('FriendApplication').error(error.message);
    }
  },
};
