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
  ApproveFriendApplicationSchema,
} from '@/api/socket/events/friendApplication/friendApplication.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';
import { SocketRequestHandler } from '@/handler';
import { FriendHandlerServerSide } from '../friend/friend.handler';
import AlreadyFriendError from '@/errors/AlreadyFriendError';
import FriendApplicationNotFoundError from '@/errors/FriendApplicationNotFoundError';

export const CreateFriendApplicationHandler : SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

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

      const reverseFriendApplication = await database.get.friendApplication(
        receiverId,
        senderId,
      );
      if (reverseFriendApplication) {
        new Logger('CreateFriendApplication').info(
          `User(${senderId}) and User(${receiverId}) are already friends, creating friend application...`
        );
        await FriendHandlerServerSide.createFriend(senderId, receiverId);
        return;
      }

      const friendApplication = await database.get.friendApplication(
        senderId,
        receiverId,
      );

      if (friendApplication) {
        reason = 'Already sent friend application';
      }

      if (operatorId !== senderId)
        reason = 'Cannot send non-self friend applications';

      if (senderId === receiverId)
        reason = 'Cannot send friend application to self';

      if (reason) {
        new Logger('CreateFriendApplication').warn(
          `User(${senderId}) failed to send friend application(${receiverId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ==========   */

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

      /* ========== End of Handling ========== */

      new Logger('CreateFriendApplication').info(
        `User(${senderId}) sent friend application(${receiverId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('CreateFriendApplication').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `發送好友申請失敗，請稍後再試`,
          part: 'CREATEFRIENDAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const UpdateFriendApplicationHandler : SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

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
        reason = 'Cannot modify non-self friend applications';
      }

      if (reason) {
        new Logger('UpdateFriendApplication').warn(
          `User(${senderId}) failed to update friend application(${receiverId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

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

      /* ========== End of Handling ========== */

      new Logger('UpdateFriendApplication').info(
        `User(${senderId}) updated friend application(${receiverId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('UpdateFriendApplication').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `更新好友申請失敗，請稍後再試`,
          part: 'UPDATEFRIENDAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const DeleteFriendApplicationHandler : SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { senderId, receiverId } = await DataValidator.validate(
        DeleteFriendApplicationSchema,
        data,
        'DELETEFRIENDAPPLICATION',
      );

      if (operatorId !== senderId && operatorId !== receiverId) {
        reason = 'Cannot delete non-self friend applications';
      }

      if (reason) {
        new Logger('DeleteFriendApplication').warn(
          `User(${senderId}) failed to delete friend application(${receiverId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Delete friend application
      await database.delete.friendApplication(senderId, receiverId);

      // Send socket event
      const targetSocket = SocketServer.getSocket(receiverId);

      if (targetSocket) {
        targetSocket.emit('friendApplicationDelete', senderId, receiverId);
      }

      /* ========== End of Handling ========== */

      new Logger('DeleteFriendApplication').info(
        `User(${senderId}) deleted friend application(${receiverId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('DeleteFriendApplication').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除好友申請失敗，請稍後再試`,
          part: 'DELETEFRIENDAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const ApproveFriendApplicationHandler: SocketRequestHandler = {
    async handle(io: Server, socket: Socket, data: any) {
        try {
            const operatorId = socket.data.userId;

            const {
                targetId,
                friendGroupId,
            } = await DataValidator.validate(
                ApproveFriendApplicationSchema,
                data,
                'APPROVEFRIENDAPPLICATION',
            );

            new Logger('ApproveFriendApplication').info(
                `User(${operatorId}) approve friend application(${targetId})`,
            );

            const friendApplication = await database.get.friendApplication(
                targetId,
                operatorId,
            );
            if (!friendApplication) throw new FriendApplicationNotFoundError(targetId, operatorId);

            const friend = await database.get.friend(operatorId, targetId);
            if (friend) throw new AlreadyFriendError(targetId, operatorId);

            await FriendHandlerServerSide.createFriend(operatorId, targetId);
            await database.delete.friendApplication(targetId, operatorId);

            if (friendGroupId) await FriendHandlerServerSide.updateFriendGroup(operatorId, targetId, friendGroupId);

            socket.emit('friendApproval', {
                targetId
            });
        }
        catch (error: any) {
            if (!(error instanceof StandardizedError)) {
                new Logger('FriendApproval').error(error.message);

                error = new StandardizedError({
                    name: 'ServerError',
                    message: `處理好友申請失敗，請稍後再試`,
                    part: 'FRIENDAPPROVAL',
                    tag: 'EXCEPTION_ERROR',
                    statusCode: 500,
                });
            }

            socket.emit('error', error);
        }
        
    }
}
