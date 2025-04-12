/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');
// Utils
const utils = require('../utils');
const { Logger, Func } = utils;

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

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
          'SENDMESSAGE',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const newMessage = await Func.validate.message(_newMessage);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const channel = await DB.get.channel(channelId);
      const operatorMember = await DB.get.member(operatorId, serverId);

      // Validate operation
      if (operatorId !== userId) {
        throw new StandardizedError(
          '無法傳送非自己的訊息',
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
      await DB.set.message(messageId, {
        ...newMessage,
        senderId: userId,
        serverId: serverId,
        channelId: channelId,
        timestamp: Date.now().valueOf(),
      });

      // Update member
      const member_update = {
        lastMessageTime: Date.now().valueOf(),
      };
      await DB.set.member(operatorId, serverId, member_update);

      // Play sound
      io.to(`channel_${channelId}`).emit('playSound', 'recieveChannelMessage');

      // Emit updated data (to the operator)
      io.to(socket.id).emit('memberUpdate', member_update);

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channelId}`).emit('channelMessagesUpdate', [
        ...(await DB.get.channelMessages(channelId)),
        ...(await DB.get.channelInfoMessages(channelId)),
      ]);

      // Will be removed in the future
      io.to(`channel_${channelId}`).emit('channelUpdate', {
        messages: [
          ...(await DB.get.channelMessages(channelId)),
          ...(await DB.get.channelInfoMessages(channelId)),
        ],
      });

      new Logger('Message').success(
        `User(${operatorId}) sent ${newMessage.content} to channel(${channelId})`,
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
          'SENDDIRECTMESSAGE',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const newDirectMessage = await Func.validate.message(_newDirectMessage);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === userId) {
          userSocket = _socket;
        }
      });
      let targetSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === targetId) {
          targetSocket = _socket;
        }
      });

      // Validate operation
      if (operatorId !== userId) {
        throw new StandardizedError(
          '無法傳送非自己的私訊',
          'SENDDIRECTMESSAGE',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Create new message
      const directMessageId = uuidv4();
      await DB.set.directMessage(directMessageId, {
        ...newDirectMessage,
        senderId: userId,
        userId1: userId.localeCompare(targetId) < 0 ? userId : targetId,
        userId2: userId.localeCompare(targetId) < 0 ? targetId : userId,
        timestamp: Date.now().valueOf(),
      });

      // Emit updated data (to user and target *if online*)
      io.to(userSocket.id).emit(
        'directMessageUpdate',
        await DB.get.directMessages(userId, targetId),
      );
      if (targetSocket) {
        io.to(targetSocket.id).emit(
          'directMessageUpdate',
          await DB.get.directMessages(userId, targetId),
        );
      }

      new Logger('Message').success(
        `User(${userId}) sent ${newDirectMessage.content} to User(${targetId})`,
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
