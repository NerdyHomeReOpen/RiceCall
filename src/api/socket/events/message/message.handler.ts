import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';
import { SocketRequestHandler } from '@/handler';

// Database
import { database } from '@/index';

// Schemas
import {
  SendDirectMessageSchema,
  SendActionMessageSchema,
  SendMessageSchema,
  ShakeWindowSchema,
} from '@/api/socket/events/message/message.schemas';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const SendMessageHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'SENDMESSAGE';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        userId,
        serverId,
        channelId,
        message: preset,
      } = await DataValidator.validate(SendMessageSchema, data, part);

      const channel = await database.get.channel(channelId);

      const operator = await database.get.user(operatorId);
      const operatorMember = await database.get.member(operatorId, serverId);

      // if (operatorId !== userId) {
      //   reason = 'Cannot send non-self message';
      // }

      if (reason) {
        new Logger('SendMessage').warn(
          `User(${operatorId}) failed to send message to channel(${channelId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      if (channel.forbidGuestUrl && operatorMember.permissionLevel === 1) {
        preset.content = preset.content.replace(
          /https?:\/\/[^\s]+/g,
          '{{GUEST_SEND_AN_EXTERNAL_LINK}}',
        );
      }

      // Create new message
      const message = {
        ...preset,
        sender: {
          ...operatorMember,
          ...operator,
        },
        receiver: null, // Channel message does not have receiver
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

      /* ========== End of Handling ========== */

      new Logger('SendMessage').info(
        `User(${operatorId}) sent message to channel(${channelId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('SendMessage').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送訊息失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const SendActionMessageHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'SENDACTIONMESSAGE';
    try {
      /* ========== Start of Handling ========== */
      
      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        serverId,
        channelId,
        message: preset,
      } = await DataValidator.validate(SendActionMessageSchema, data, part);

      const channel = channelId === null ? null : await database.get.channel(channelId);
      const serverChannels = await database.get.serverChannels(serverId);

      // Operator
      const operator = await database.get.user(operatorId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorMember.permissionLevel < 3) {
        reason = 'Cannot sent alert message without high permissionLevel';
      }

      if (reason) {
        new Logger('SendActionMessage').warn(
          `User(${operatorId}) failed to send action message to server(${serverId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      const categoryId = channel?.categoryId ?? null;
      const channelChildren = categoryId === null ? [] : serverChannels?.filter(
        (ch) => ch.categoryId === categoryId,
      );

      // Create new message
      const message = {
        ...preset,
        sender: {
          ...operatorMember,
          ...operator,
        },
        receiver: null,
        serverId: serverId,
        channelId: channelId,
        timestamp: Date.now().valueOf(),
      };

      // Send socket event
      if (channelId) { // Channel Alert
        for (const child of channelChildren) {
          io.to(`channel_${child.channelId}`).emit('onActionMessage', message);
        }

      } else { // Server Alert
        io.to(`server_${serverId}`).emit('onActionMessage', message);
      }

      /* ========== End of Handling ========== */

      new Logger('SendActionMessage').info(
        `User(${operatorId}) sent action message to server(${serverId})`,
      );

    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('SendActionMessage').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送訊息失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const SendDirectMessageHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'SENDDIRECTMESSAGE';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        userId,
        targetId,
        directMessage: preset,
      } = await DataValidator.validate(SendDirectMessageSchema, data, part);

      if (operatorId !== userId) {
        reason = 'Cannot send non-self direct message';
      }

      if (reason) {
        new Logger('SendDirectMessage').warn(
          `User(${operatorId}) failed to send direct message to User(${userId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

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

      /* ========== End of Handling ========== */

      new Logger('SendDirectMessage').info(
        `User(${operatorId}) sent direct message to User(${userId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('SendDirectMessage').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送私訊失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const ShakeWindowHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'SHAKEWINDOW';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, targetId } = await DataValidator.validate(ShakeWindowSchema, data, part);

      const friend = await database.get.userFriend(targetId, userId);

      if (operatorId !== userId) {
        reason = 'Cannot shake non-self window';
      }

      if (!friend) {
        reason = 'Cannot shake non-friend window';
      }

      if (reason) {
        new Logger('ShakeWindow').warn(
          `User(${operatorId}) failed to shake window to User(${userId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      const targetSocket = SocketServer.getSocket(targetId);

      // Send socket event
      if (targetSocket) {
        targetSocket.emit('onShakeWindow', friend);
      }

      /* ========== End of Handling ========== */

      new Logger('ShakeWindow').info(
        `User(${operatorId}) shook window to User(${userId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('ShakeWindow').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `搖動視窗失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};
