/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');

// Utils
const { Logger, Func } = require('../utils');

// Database
const DB = require('../../database');

// Systems
const xpSystem = require('../../systems/xp');

// StandardizedError
const StandardizedError = require('../../error');

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
      const channelUsers = await DB.get.channelUsers(channelId);
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
          ) {
            throw new StandardizedError(
              '你需要成為該群組的會員才能加入該頻道',
              'ValidationError',
              'CONNECTCHANNEL',
              'PERMISSION_DENIED',
              403,
            );
          }
          if (
            channel.password &&
            password !== channel.password &&
            operatorMember.permissionLevel < 3
          ) {
            throw new StandardizedError(
              '你需要輸入正確的密碼才能加入該頻道',
              'ValidationError',
              'CONNECTCHANNEL',
              'PASSWORD_INCORRECT',
              403,
            );
          }
          if (
            channel.userLimit &&
            channelUsers.length >= channel.userLimit &&
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
          if (operatorMember.permissionLevel < 5) {
            throw new StandardizedError(
              '你沒有足夠的權限移動其他用戶',
              'ValidationError',
              'CONNECTCHANNEL',
              'PERMISSION_DENIED',
              403,
            );
          }
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
            server.visibility === 'private' ||
            channel.visibility === 'member'
          ) {
            throw new StandardizedError(
              '你沒有足夠的權限移動其他用戶到該頻道',
              'ValidationError',
              'CONNECTCHANNEL',
              'PERMISSION_DENIED',
              403,
            );
          }
          if (channel.visibility === 'private') {
            throw new StandardizedError(
              '你沒有足夠的權限移動其他用戶到該頻道',
              'ValidationError',
              'CONNECTCHANNEL',
              'PERMISSION_DENIED',
              403,
            );
          }
          if (user.currentServerId !== serverId) {
            throw new StandardizedError(
              '用戶不在該語音群中',
              'ValidationError',
              'CONNECTCHANNEL',
              'PERMISSION_DENIED',
              403,
            );
          }
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
      await xpSystem.create(userId);

      // Join RTC channel
      await rtcHandler.join(io, userSocket, { channelId: channelId });

      // Join channel
      userSocket.join(`channel_${channelId}`);

      // Play sound
      io.to(`channel_${channelId}`).emit('playSound', 'join');

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', updatedUser);
      io.to(userSocket.id).emit(
        'channelUpdate',
        await DB.get.channel(channelId),
      );

      // Emit updated data (to all users in the server)
      io.to(`server_${serverId}`).emit(
        'serverMembersUpdate',
        await DB.get.serverMembers(serverId),
      );

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
      const userMember = await DB.get.member(userId, serverId);
      const channel = await DB.get.channel(channelId);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === userId) {
          userSocket = _socket;
        }
      });

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
      await xpSystem.delete(userId);

      // Leave RTC channel
      await rtcHandler.leave(io, userSocket, { channelId: channelId });

      // Play sound
      io.to(`channel_${channelId}`).emit('playSound', 'leave');

      // Leave channel
      userSocket.leave(`channel_${channelId}`);

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', updatedUser);
      io.to(userSocket.id).emit('channelUpdate', null);

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit(
        'serverMembersUpdate',
        await DB.get.serverMembers(channel.serverId),
      );

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
      const serverChannels = await DB.get.serverChannels(serverId);
      const category = await DB.get.channel(newChannel.categoryId);

      // Validate operation
      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError(
          '你沒有足夠的權限創建頻道',
          'ValidationError',
          'CREATECHANNEL',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (category && category.categoryId) {
        throw new StandardizedError(
          '無法在二級頻道下創建頻道',
          'ValidationError',
          'CREATECHANNEL',
          'PERMISSION_DENIED',
          403,
        );
      }

      if (category && !category.categoryId) {
        await DB.set.channel(category.channelId, {
          type: 'category',
        });
      }

      // Create new channel
      const channelId = uuidv4();
      await DB.set.channel(channelId, {
        ...newChannel,
        serverId: serverId,
        order: serverChannels.filter((ch) =>
          newChannel.categoryId
            ? ch.categoryId === newChannel.categoryId
            : !ch.categoryId,
        ).length,
        createdAt: Date.now(),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${serverId}`).emit(
        'serverChannelsUpdate',
        await DB.get.serverChannels(serverId),
      );

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

  updateChannels: async (io, socket, data) => {
    try {
      // data = {
      //   serverId: string
      //   channels: {
      //     channelId: string
      //     ...
      //   }[],
      // };

      // Validate data
      const { channels: _editedChannels, serverId } = data;
      if (!_editedChannels || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATECHANNEL',
          'DATA_INVALID',
          400,
        );
      }
      const editedChannels = _editedChannels.map((ch) =>
        Func.validate.channel(ch),
      );

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operatorMember = await DB.get.member(operatorId, serverId);

      await Promise.all(
        editedChannels.map(async (editedChannel) => {
          const channelId = editedChannel.channelId;
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
        }),
      );

      // Emit updated data (to all users in the server)
      io.to(`server_${serverId}`).emit(
        'serverChannelsUpdate',
        await DB.get.serverChannels(serverId),
      );

      new Logger('Channel').success(
        `Multiple channels updated in server(${serverId}) by User(${operatorId})`,
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
      const channelUsers = await DB.get.channelUsers(channelId);
      const channelChildren = await DB.get.channelChildren(channelId);

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

      if (channel.categoryId) {
        const categoryChildren = await DB.get.channelChildren(
          channel.categoryId,
        );
        if (categoryChildren.length <= 1) {
          await DB.set.channel(channel.categoryId, {
            type: 'channel',
          });
        }
      }

      if (channelChildren.length) {
        const serverChannels = await DB.get.serverChannels(serverId);
        await Promise.all(
          channelChildren.map(
            async (child, index) =>
              await DB.set.channel(child.channelId, {
                categoryId: null,
                order: serverChannels.length + index,
              }),
          ),
        );
      }

      if (channelUsers.length) {
        const server = await DB.get.server(serverId);
        await Promise.all(
          channelUsers.map(
            async (user) =>
              await channelHandler.connectChannel(io, socket, {
                userId: user.userId,
                channelId: server.lobbyId,
                serverId: serverId,
              }),
          ),
        );
      }

      // Update channel
      await DB.delete.channel(channelId);

      // Emit updated data (to all users in the server)
      io.to(`server_${serverId}`).emit(
        'serverChannelsUpdate',
        await DB.get.serverChannels(serverId),
      );

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
