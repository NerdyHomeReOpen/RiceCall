/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const {
  standardizedError: StandardizedError,
  logger: Logger,
  get: Get,
  set: Set,
  func: Func,
} = utils;

const messageHandler = {
  sendMessage: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string,
      //   serverId: string,
      //   channelId: string,
      //   message: {
      //     ...
      //   }
      // };

      // Validate data
      const { message: _newMessage, userId, serverId, channelId } = data;
      if (!_newMessage || !userId || !serverId || !channelId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'SENDMESSAGE',
          'DATA_INVALID',
          401,
        );
      }
      const newMessage = await Func.validate.message(_newMessage);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const server = await Get.server(serverId);
      const channel = await Get.channel(channelId);
      const operatorMember = await Get.member(operator.id, server.id);

      // Validate operation
      if (operator.id !== user.id) {
        throw new StandardizedError(
          '無法傳送非自己的訊息',
          'ValidationError',
          'SENDMESSAGE',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (channel.forbidGuestUrl && operatorMember.permissionLevel === 1) {
        newMessage.content = newMessage.content.replace(
          /https?:\/\/[^\s]+/g,
          '{{GUEST_SEND_AN_EXTERNAL_LINK}}',
        );
      }

      // Create new message
      const messageId = uuidv4();
      await Set.message(messageId, {
        ...newMessage,
        senderId: user.id,
        serverId: server.id,
        channelId: channel.id,
        timestamp: Date.now().valueOf(),
      });

      // Update member
      const member_update = {
        lastMessageTime: Date.now().valueOf(),
      };
      await Set.member(operatorMember.id, member_update);

      // Emit updated data (to the operator)
      io.to(socket.id).emit('memberUpdate', member_update);

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', {
        messages: [
          ...(await Get.channelMessages(channel.id)),
          ...(await Get.channelInfoMessages(channel.id)),
        ],
      });

      new Logger('Message').success(
        `User(${operator.id}) sent ${newMessage.content} to channel(${channel.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `傳送訊息時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SENDMESSAGE',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Message').error(
        `Error sending message: ${error.error_message} (${socket.id})`,
      );
    }
  },

  sendDirectMessage: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string,
      //   targetId: string,
      //   directMessage: {
      //     ...
      //   }
      // };

      // Validate data
      const { directMessage: _newDirectMessage, userId, targetId } = data;
      if (!_newDirectMessage || !userId || !targetId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'SENDDIRECTMESSAGE',
          'DATA_INVALID',
          401,
        );
      }
      const newDirectMessage = await Func.validate.message(_newDirectMessage);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const target = await Get.user(targetId);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === user.id) {
          userSocket = _socket;
        }
      });
      let targetSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === target.id) {
          targetSocket = _socket;
        }
      });

      // Validate operation
      if (operator.id !== user.id) {
        throw new StandardizedError(
          '無法傳送非自己的私訊',
          'ValidationError',
          'SENDDIRECTMESSAGE',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Create new message
      const directMessageId = uuidv4();
      await Set.directMessage(directMessageId, {
        ...newDirectMessage,
        senderId: user.id,
        userId1: user.id.localeCompare(target.id) < 0 ? user.id : target.id,
        userId2: user.id.localeCompare(target.id) < 0 ? target.id : user.id,
        timestamp: Date.now().valueOf(),
      });

      // Emit updated data (to user and target (if online))
      io.to(userSocket.id).emit(
        'directMessageUpdate',
        await Get.directMessages(user.id, target.id),
      );
      if (targetSocket) {
        io.to(targetSocket.id).emit(
          'directMessageUpdate',
          await Get.directMessages(user.id, target.id),
        );
      }

      new Logger('Message').success(
        `User(${user.id}) sent ${newDirectMessage.content} to User(${target.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `傳送私訊時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SENDDIRECTMESSAGE',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Message').error(
        `Error sending direct message: ${error.error_message} (${socket.id})`,
      );
    }
  },
};

module.exports = { ...messageHandler };
