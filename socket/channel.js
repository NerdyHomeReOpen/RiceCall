/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');
// Utils
const utils = require('../utils');
const {
  standardizedError: StandardizedError,
  logger: Logger,
  get: Get,
  set: Set,
  func: Func,
  xp: XP,
} = utils;
// Handlers
const rtcHandler = require('./rtc');
const messageHandler = require('./message');

const channelHandler = {
  connectChannel: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string
      //   channelId: string
      // }

      // Validate data
      const { userId, channelId } = data;
      if (!userId || !channelId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CONNECTCHANNEL',
          'DATA_INVALID',
          400,
        );
      }

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const channel = await Get.channel(channelId);
      const server = await Get.server(channel.serverId);
      const operatorMember = await Get.member(operator.id, server.id);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === user.id) {
          userSocket = _socket;
        }
      });

      // Validate operation
      if (operator.id === user.id) {
        if (channel.visibility === 'readonly')
          throw new StandardizedError(
            '該頻道為唯獨頻道',
            'ValidationError',
            'CONNECTCHANNEL',
            'CHANNEL_IS_READONLY',
            403,
          );
        if (
          !channel.isLobby &&
          (server.visibility === 'private' ||
            channel.visibility === 'member') &&
          operatorMember.permissionLevel < 2
        )
          throw new StandardizedError(
            '你需要成為該群組的會員才能加入該頻道',
            'ValidationError',
            'CONNECTCHANNEL',
            'PERMISSION_DENIED',
            403,
          );
        if (
          !channel.isLobby &&
          channel.visibility === 'private' &&
          operatorMember.permissionLevel < 3
        )
          throw new StandardizedError(
            '你需要成為該群組的管理員才能加入該頻道',
            'ValidationError',
            'CONNECTCHANNEL',
            'PERMISSION_DENIED',
            403,
          );
      } else {
        if (channel.visibility === 'readonly')
          throw new StandardizedError(
            '該頻道為唯獨頻道',
            'ValidationError',
            'CONNECTCHANNEL',
            'CHANNEL_IS_READONLY',
            403,
          );
        if (operatorMember.permissionLevel < 5)
          throw new StandardizedError(
            '你沒有足夠的權限移動其他用戶到該頻道',
            'ValidationError',
            'CONNECTCHANNEL',
            'PERMISSION_DENIED',
            403,
          );
        if (
          !channel.isLobby &&
          (server.visibility === 'private' ||
            channel.visibility === 'member') &&
          operatorMember.permissionLevel < 2
        )
          throw new StandardizedError(
            '你沒有足夠的權限移動其他用戶到該頻道',
            'ValidationError',
            'CONNECTCHANNEL',
            'PERMISSION_DENIED',
            403,
          );
        if (
          !channel.isLobby &&
          channel.visibility === 'private' &&
          operatorMember.permissionLevel < 3
        )
          throw new StandardizedError(
            '你沒有足夠的權限移動其他用戶到該頻道',
            'ValidationError',
            'CONNECTCHANNEL',
            'PERMISSION_DENIED',
            403,
          );
      }
      // Check channel user limit
      // manager(>= 5) can join the channel even if it is full
      if (operatorMember.permissionLevel < 5 && channel.userLimit && channel.userLimit > 0) {
        // Get all users in the server
        const serverUsers = await Get.serverUsers(server.id);

        // Filter users who are currently in this channel
        const usersInChannel = serverUsers.filter(
          (u) => u.currentChannelId === channel.id,
        );

        // Check if channel is full
        if (usersInChannel.length >= channel.userLimit) {
          throw new StandardizedError(
            '該頻道已達人數上限',
            'ValidationError',
            'CONNECTCHANNEL',
            'CHANNEL_USER_LIMIT_REACHED',
            403,
          );
        }
      }

      if (user.currentChannelId) {
        // Disconnect the user from the current channel
        await channelHandler.disconnectChannel(io, socket, {
          channelId: user.currentChannelId,
          userId: user.id,
        });
      }

      // Update user
      const user_update = {
        currentChannelId: channel.id,
        lastActiveAt: Date.now(),
      };
      await Set.user(user.id, user_update);

      // Update Member
      const member_update = {
        lastJoinChannelTime: Date.now(),
      };
      await Set.member(operatorMember.id, member_update);

      // Setup user interval for accumulate contribution
      XP.create(userSocket);

      // Join RTC channel
      rtcHandler.join(io, userSocket, { channelId: channel.id });

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'join');

      // Join channel
      userSocket.join(`channel_${channel.id}`);

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', user_update);
      io.to(userSocket.id).emit('memberUpdate', member_update);
      io.to(userSocket.id).emit('channelUpdate', await Get.channel(channel.id));

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        members: await Get.serverMembers(server.id),
        users: await Get.serverUsers(server.id),
      });

      new Logger('Channel').success(
        `User(${user.id}) connected to channel(${channel.id}) by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `加入頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CONNECTCHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);
      io.to(socket.id).emit('channelUpdate', null);

      new Logger('Channel').error(
        `Error connecting to channel: ${error.error_message} (${socket.id})`,
      );
    }
  },

  disconnectChannel: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string
      //   channelId: string
      // }

      // Validate data
      const { userId, channelId } = data;
      if (!userId || !channelId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DISCONNECTCHANNEL',
          'DATA_INVALID',
          400,
        );
      }
      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const channel = await Get.channel(channelId);
      const server = await Get.server(channel.serverId);
      const operatorMember = await Get.member(operator.id, server.id);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === user.id) {
          userSocket = _socket;
        }
      });

      if (!userSocket) {
        throw new StandardizedError(
          '無法找到使用者的 Socket',
          'ValidationError',
          'DISCONNECTCHANNEL',
          'SOCKET_NOT_FOUND',
          404,
        );
      }

      // Validate operation
      if (operator.id === user.id) {
      } else {
        if (operatorMember.permissionLevel < 5)
          throw new StandardizedError(
            '你沒有足夠的權限踢除其他用戶',
            'ValidationError',
            'DISCONNECTCHANNEL',
            'PERMISSION_DENIED',
            403,
          );
      }

      // Update user
      const user_update = {
        currentChannelId: null,
        lastActiveAt: Date.now(),
      };
      await Set.user(userId, user_update);

      // Clear user contribution interval
      XP.delete(userSocket);

      // Leave RTC channel
      await rtcHandler.leave(io, userSocket, { channelId: channel.id });

      // Leave channel
      userSocket.leave(`channel_${channel.id}`);

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'leave');

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', user_update);
      io.to(userSocket.id).emit('channelUpdate', null);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        members: await Get.serverMembers(server.id),
        users: await Get.serverUsers(server.id),
      });

      new Logger('Channel').success(
        `User(${user.id}) disconnected from channel(${channel.id}) by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `離開頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DISCONNECTCHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);
      io.to(socket.id).emit('channelUpdate', null);

      new Logger('Channel').error(
        `Error disconnecting from channel: ${error.error_message} (${socket.id})`,
      );
    }
  },

  createChannel: async (io, socket, data) => {
    try {
      // data = {
      //   serverId: string
      //   channel: {
      //     ...
      //   },
      // }

      // Validate data
      const { channel: _newChannel, serverId } = data;
      if (!_newChannel || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATECHANNEL',
          'DATA_INVALID',
          400,
        );
      }
      const newChannel = await Func.validate.channel(_newChannel);

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const server = await Get.server(serverId);
      const operatorMember = await Get.member(operator.id, server.id);

      // Validate permission
      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError(
          '你沒有足夠的權限創建頻道',
          'ValidationError',
          'CREATECHANNEL',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Create new channel
      const channelId = uuidv4();
      const channel = await Set.channel(channelId, {
        ...newChannel,
        serverId: server.id,
        order: await Get.serverChannels(server.id).length,
        createdAt: Date.now().valueOf(),
      });

      if (newChannel.categoryId) {
        const parentChannel = await Get.channel(newChannel.categoryId);
        if (parentChannel) {
          await Set.channel(parentChannel.id, {
            isRoot: true,
            type: 'category',
          });
        }
      }

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('Channel').success(
        `Channel(${channel.id}) created in server(${server.id}) by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `新增頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATECHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Channel').error(
        `Error creating channel: ${error.error_message} (${socket.id})`,
      );
    }
  },

  updateChannel: async (io, socket, data) => {
    try {
      // data = {
      //   serverId: string
      //   channelId: string
      //   channel: {
      //     ...
      //   },
      // };

      // Validate data
      const { channel: _editedChannel, channelId, serverId } = data;
      if (!_editedChannel || !channelId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATECHANNEL',
          'DATA_INVALID',
          400,
        );
      }
      const editedChannel = await Func.validate.channel(_editedChannel);

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const server = await Get.server(serverId);
      const channel = await Get.channel(channelId);
      const operatorMember = await Get.member(operator.id, server.id);

      // Validate operation
      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError(
          '你沒有足夠的權限編輯頻道',
          'ValidationError',
          'UPDATECHANNEL',
          'PERMISSION_DENIED',
          403,
        );
      }

      if (
        editedChannel.voiceMode &&
        editedChannel.voiceMode !== channel.voiceMode
      ) {
        messageHandler.sendMessage(io, socket, {
          message: {
            type: 'info',
            content:
              editedChannel.voiceMode === 'free'
                ? 'VOICE_CHANGE_TO_FREE_SPEECH'
                : editedChannel.voiceMode === 'forbidden'
                ? 'VOICE_CHANGE_TO_FORBIDDEN_SPEECH'
                : 'VOICE_CHANGE_TO_QUEUE',
            timestamp: Date.now().valueOf(),
          },
          channelId,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (
        editedChannel.forbidText !== undefined &&
        editedChannel.forbidText !== channel.forbidText
      ) {
        messageHandler.sendMessage(io, socket, {
          message: {
            type: 'info',
            content: editedChannel.forbidText
              ? 'TEXT_CHANGE_TO_FORBIDDEN_SPEECH'
              : 'TEXT_CHANGE_TO_FREE_SPEECH',
            timestamp: Date.now().valueOf(),
          },
          channelId,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (
        editedChannel.forbidGuestText !== undefined &&
        editedChannel.forbidGuestText !== channel.forbidGuestText
      ) {
        messageHandler.sendMessage(io, socket, {
          message: {
            type: 'info',
            content: editedChannel.forbidGuestText
              ? 'TEXT_CHANGE_TO_FORBIDDEN_TEXT'
              : 'TEXT_CHANGE_TO_ALLOWED_TEXT',
            timestamp: Date.now().valueOf(),
          },
          channelId,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (
        editedChannel.forbidGuestUrl !== undefined &&
        editedChannel.forbidGuestUrl !== channel.forbidGuestUrl
      ) {
        messageHandler.sendMessage(io, socket, {
          message: {
            type: 'info',
            content: editedChannel.forbidGuestUrl
              ? 'TEXT_CHANGE_TO_FORBIDDEN_URL'
              : 'TEXT_CHANGE_TO_ALLOWED_URL',
            timestamp: Date.now().valueOf(),
          },
          channelId,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (
        editedChannel.guestTextMaxLength !== undefined &&
        editedChannel.guestTextMaxLength !== channel.guestTextMaxLength
      ) {
        messageHandler.sendMessage(io, socket, {
          message: {
            type: 'info',
            content: `TEXT_CHANGE_TO_MAX_LENGTH ${editedChannel.guestTextMaxLength}`,
            timestamp: Date.now().valueOf(),
          },
          channelId,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (
        editedChannel.guestTextWaitTime !== undefined &&
        editedChannel.guestTextWaitTime !== channel.guestTextWaitTime
      ) {
        messageHandler.sendMessage(io, socket, {
          message: {
            type: 'info',
            content: `TEXT_CHANGE_TO_WAIT_TIME ${editedChannel.guestTextWaitTime}`,
            timestamp: Date.now().valueOf(),
          },
          channelId,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (
        editedChannel.guestTextGapTime !== undefined &&
        editedChannel.guestTextGapTime !== channel.guestTextGapTime
      ) {
        messageHandler.sendMessage(io, socket, {
          message: {
            type: 'info',
            content: `TEXT_CHANGE_TO_GAP_TIME ${editedChannel.guestTextGapTime}`,
            timestamp: Date.now().valueOf(),
          },
          channelId,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Update channel
      await Set.channel(channel.id, editedChannel);

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', editedChannel);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('Channel').success(
        `Channel(${channel.id}) updated in server(${server.id}) by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `編輯頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATECHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Channel').error(
        `Error updating channel: ${error.error_message} (${socket.id})`,
      );
    }
  },

  deleteChannel: async (io, socket, data) => {
    try {
      // data = {
      //   serverId: string
      //   channelId: string
      // }

      // Validate data
      const { channelId, serverId } = data;
      if (!channelId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DELETECHANNEL',
          'DATA_INVALID',
          400,
        );
      }

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const channel = await Get.channel(channelId);
      const server = await Get.server(serverId);
      const operatorMember = await Get.member(operator.id, server.id);

      // Validate operation
      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError(
          '你沒有足夠的權限刪除頻道',
          'ValidationError',
          'DELETECHANNEL',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update channel
      await Set.channel(channelId, { serverId: null });

      // If the deleted channel has a parent channel, update the parent channel status
      if (channel.categoryId) {
        const serverChannels = await Get.serverChannels(server.id);
        const parentChannel = await Get.channel(channel.categoryId);
        const parentChannelHasChildren = serverChannels.some(
          (c) => c.categoryId === parentChannel.id && c.id !== channel.id,
        );

        if (!parentChannelHasChildren) {
          await Set.channel(parentChannel.id, {
            isRoot: true,
            type: 'channel',
            categoryId: null,
            order: parentChannel.order,
          });
        }
      }

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('Channel').info(
        `Channel(${channel.id}) deleted in server(${server.id}) by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刪除頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DELETECHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Channel').error(
        `Error deleting channel: ${error.error_message} (${socket.id})`,
      );
    }
  },
};

module.exports = { ...channelHandler };
