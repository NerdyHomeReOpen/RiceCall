/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');

// Utils
const utils = require('../utils');
const { Logger, Func, Xp } = utils;

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

// Handlers
const rtcHandler = require('./rtc');
const messageHandler = require('./message');

const channelHandler = {
  connectChannel: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string
      //   channelId: string
      //   serverId: string
      //   password?: string
      // }

      // Validate data
      const { userId, channelId, serverId, password } = data;
      if (!userId || !channelId || !serverId) {
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
      const operatorMember = await DB.get.member(operatorId, serverId);
      const user = await DB.get.user(userId);
      const channel = await DB.get.channel(channelId);
      const channelMembers = await DB.get.channelMembers(channelId);
      const server = await DB.get.server(serverId);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === userId) {
          userSocket = _socket;
        }
      });

      // Validate operation
      if (!channel.isLobby) {
        if (operatorId === userId) {
          if (channel.visibility === 'readonly') {
            throw new StandardizedError(
              '該頻道為唯獨頻道',
              'ValidationError',
              'CONNECTCHANNEL',
              'CHANNEL_IS_READONLY',
              403,
            );
          }
          if (
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
            channel.password &&
            password !== channel.password &&
            operatorMember.permissionLevel < 3
          )
            throw new StandardizedError(
              '你需要輸入正確的密碼才能加入該頻道',
              'ValidationError',
              'CONNECTCHANNEL',
              'PASSWORD_INCORRECT',
              403,
            );
          if (
            channel.userLimit > 0 &&
            channelMembers.length >= channel.userLimit &&
            operatorMember.permissionLevel < 5
          ) {
            throw new StandardizedError(
              '該頻道已達人數上限',
              'ValidationError',
              'CONNECTCHANNEL',
              'CHANNEL_USER_LIMIT_REACHED',
              403,
            );
          }
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
      }

      // Disconnect previous channel
      if (user.currentChannelId) {
        await channelHandler.disconnectChannel(io, socket, {
          userId: userId,
          channelId: user.currentChannelId,
          serverId: user.currentServerId,
        });
      }

      // Update user
      const updatedUser = {
        currentChannelId: channelId,
        lastActiveAt: Date.now(),
      };
      await DB.set.user(userId, updatedUser);

      // Update Member
      const updatedMember = {
        lastJoinChannelTime: Date.now(),
      };
      await DB.set.member(userId, serverId, updatedMember);

      // Setup user interval for accumulate contribution
      await Xp.create(userId);

      // Join RTC channel
      rtcHandler.join(io, userSocket, { channelId: channelId });

      // Join channel
      userSocket.join(`channel_${channelId}`);

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'join');

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', updatedUser);
      io.to(userSocket.id).emit('memberUpdate', updatedMember);
      io.to(userSocket.id).emit('channelUpdate', channel);

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit(
        'serverActiveMembersUpdate',
        await DB.get.serverUsers(channel.serverId),
      );

      // Will be removed in the future
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        members: await DB.get.serverMembers(channel.serverId),
        users: await DB.get.serverUsers(channel.serverId),
      });

      new Logger('Channel').success(
        `User(${userId}) connected to channel(${channelId}) by User(${operatorId})`,
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
      //   serverId: string
      // }

      // Validate data
      const { userId, channelId, serverId } = data;
      if (!userId || !channelId || !serverId) {
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
      const operatorMember = await DB.get.member(operatorId, serverId);
      const user = await DB.get.user(userId);
      const userMember = await DB.get.member(userId, serverId);
      const channel = await DB.get.channel(channelId);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === userId) {
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
      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 5)
          throw new StandardizedError(
            '你沒有足夠的權限踢除其他用戶',
            'ValidationError',
            'DISCONNECTCHANNEL',
            'PERMISSION_DENIED',
            403,
          );
        if (operatorMember.permissionLevel <= userMember.permissionLevel)
          throw new StandardizedError(
            '你沒有足夠的權限踢除該用戶',
            'ValidationError',
            'DISCONNECTCHANNEL',
            'PERMISSION_DENIED',
            403,
          );
      }

      // Update user
      const updatedUser = {
        currentChannelId: null,
        lastActiveAt: Date.now(),
      };
      await DB.set.user(userId, updatedUser);

      // Clear user contribution interval
      await Xp.delete(userId);

      // Leave RTC channel
      await rtcHandler.leave(io, userSocket, { channelId: channelId });

      // Play sound
      io.to(`channel_${channelId}`).emit('playSound', 'leave');

      // Leave channel
      userSocket.leave(`channel_${channel.id}`);

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', updatedUser);
      io.to(userSocket.id).emit('channelUpdate', null);

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit(
        'serverActiveMembersUpdate',
        await DB.get.serverUsers(channel.serverId),
      );

      // Will be removed in the future
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        members: await DB.get.serverMembers(channel.serverId),
        users: await DB.get.serverUsers(channel.serverId),
      });

      new Logger('Channel').success(
        `User(${userId}) disconnected from channel(${channelId}) by User(${operatorId})`,
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
      const operatorMember = await DB.get.member(operatorId, serverId);

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
      await DB.set.channel(channelId, {
        ...newChannel,
        serverId: serverId,
        order: (await DB.get.serverChannels(serverId)).length,
        createdAt: Date.now().valueOf(),
      });

      if (newChannel.categoryId) {
        const parentChannel = await DB.get.channel(newChannel.categoryId);
        if (parentChannel) {
          await DB.set.channel(parentChannel.channelId, {
            isRoot: true,
            type: 'category',
          });
        }
      }

      // Emit updated data (to all users in the server)
      io.to(`server_${serverId}`).emit(
        'serverChannelsUpdate',
        await DB.get.serverChannels(serverId),
      );

      // Will be removed in the future
      io.to(`server_${serverId}`).emit('serverUpdate', {
        channels: await DB.get.serverChannels(serverId),
      });

      new Logger('Channel').success(
        `Channel(${channelId}) created in server(${serverId}) by User(${operatorId})`,
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
      console.log(data);

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
      const operatorMember = await DB.get.member(operatorId, serverId);
      const channel = await DB.get.channel(channelId);

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
          userId: operatorId,
          serverId,
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
          userId: operatorId,
          serverId,
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
          userId: operatorId,
          serverId,
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
          userId: operatorId,
          serverId,
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
          userId: operatorId,
          serverId,
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
          userId: operatorId,
          serverId,
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
          userId: operatorId,
          serverId,
          channelId,
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Update channel
      await DB.set.channel(channelId, editedChannel);

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channelId}`).emit('channelUpdate', editedChannel);

      // Emit updated data (to all users in the server)
      io.to(`server_${serverId}`).emit(
        'serverChannelsUpdate',
        await DB.get.serverChannels(serverId),
      );

      // Will be removed in the future
      io.to(`server_${serverId}`).emit('serverUpdate', {
        channels: await DB.get.serverChannels(serverId),
      });

      new Logger('Channel').success(
        `Channel(${channelId}) updated in server(${serverId}) by User(${operatorId})`,
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
      const operatorMember = await DB.get.member(operatorId, serverId);
      const channel = await DB.get.channel(channelId);

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
      await DB.set.channel(channelId, { serverId: null });

      // If the deleted channel has a parent channel, update the parent channel status
      if (channel.categoryId) {
        const serverChannels = await DB.get.serverChannels(serverId);
        const parentChannel = await DB.get.channel(channel.categoryId);
        const parentChannelHasChildren = serverChannels.some(
          (c) =>
            c.categoryId === parentChannel.channelId &&
            c.channelId !== channelId,
        );

        if (!parentChannelHasChildren) {
          await DB.set.channel(parentChannel.channelId, {
            isRoot: true,
            type: 'channel',
            categoryId: null,
            order: parentChannel.order,
          });
        }
      }

      // Emit updated data (to all users in the server)
      io.to(`server_${serverId}`).emit(
        'serverChannelsUpdate',
        await DB.get.serverChannels(serverId),
      );

      // Will be removed in the future
      io.to(`server_${serverId}`).emit('serverUpdate', {
        channels: await DB.get.serverChannels(serverId),
      });

      new Logger('Channel').info(
        `Channel(${channelId}) deleted in server(${serverId}) by User(${operatorId})`,
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
