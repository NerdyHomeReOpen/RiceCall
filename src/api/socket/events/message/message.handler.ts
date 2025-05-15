import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Schemas
import {
  SendDirectMessageSchema,
  SendMessageSchema,
  ShakeWindowSchema,
} from '@/api/socket/events/message/message.schemas';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const SendMessageHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const {
        userId,
        serverId,
        channelId,
        message: preset,
      } = await DataValidator.validate(SendMessageSchema, data, 'SENDMESSAGE');

      const channel = await database.get.channel(channelId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法傳送非自己的訊息',
          part: 'SENDMESSAGE',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      /* Start of Main Logic */

      if (channel.forbidGuestUrl && operatorMember.permissionLevel === 1) {
        preset.content = preset.content.replace(
          /https?:\/\/[^\s]+/g,
          '{{GUEST_SEND_AN_EXTERNAL_LINK}}',
        );
      }

      // Create new message
      const message = {
        ...preset,
        ...(await database.get.member(userId, serverId)),
        ...(await database.get.user(userId)),
        senderId: userId,
        serverId: serverId,
        channelId: channelId,
        timestamp: Date.now().valueOf(),
      };

      // Update member
      const memberUpdate = {
        lastMessageTime: Date.now().valueOf(),
      };
      await database.set.member(operatorId, serverId, memberUpdate);

      // Send socket event
      socket.emit('serverUpdate', serverId, memberUpdate);
      socket
        .to(`channel_${channelId}`)
        .emit('playSound', 'recieveChannelMessage');

      io.to(`channel_${channelId}`).emit('onMessage', message);

      /* End of Main Logic */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送訊息時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('SendMessage').error(error.message);
    }
  },
};

export const SendDirectMessageHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const {
        userId,
        targetId,
        directMessage: preset,
      } = await DataValidator.validate(
        SendDirectMessageSchema,
        data,
        'SENDDIRECTMESSAGE',
      );

      if (operatorId !== userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法傳送非自己的私訊',
          part: 'SENDDIRECTMESSAGE',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      /* Start of Main Logic */

      // Create new message
      const directMessage = {
        ...preset,
        ...(await database.get.user(userId)),
        senderId: userId,
        user1Id: userId.localeCompare(targetId) < 0 ? userId : targetId,
        user2Id: userId.localeCompare(targetId) < 0 ? targetId : userId,
        timestamp: Date.now().valueOf(),
      };

      // Send socket event
      const targetSocket = SocketServer.getSocket(targetId);

      socket.emit('onDirectMessage', directMessage);
      if (targetSocket) {
        targetSocket.emit('onDirectMessage', directMessage);
      }

      /* End of Main Logic */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送私訊時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('SendDirectMessage').error(error.message);
    }
  },
};

export const ShakeWindowHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { userId, targetId } = await DataValidator.validate(
        ShakeWindowSchema,
        data,
        'SHAKEWINDOW',
      );

      const friend = await database.get.userFriend(targetId, userId);

      if (operatorId !== userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法搖動非自己的視窗',
          part: 'SHAKEWINDOW',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (!friend) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法搖動非好友的視窗',
          part: 'SHAKEWINDOW',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      /* Start of Main Logic */
      const targetSocket = SocketServer.getSocket(targetId);

      // Send socket event
      if (targetSocket) {
        targetSocket.emit('onShakeWindow', friend);
      }

      /* End of Main Logic */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `搖動視窗時發生無法預期的錯誤: ${error.message}`,
          part: 'SHAKEWINDOW',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('ShakeWindow').error(error.message);
    }
  },
};
