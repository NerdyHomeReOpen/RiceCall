/* eslint-disable @typescript-eslint/no-require-imports */
// Utils
const utils = require('../utils');
const { Logger, Session, Func, Xp } = utils;

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

// Handlers
const rtcHandler = require('./rtc');
const serverHandler = require('./server');
const channelHandler = require('./channel');

const userHandler = {
  searchUser: async (io, socket, data) => {
    try {
      // data = {
      //   query:
      // }

      // Validate data
      const { query } = data;
      if (!query) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'SEARCHUSER',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
      await Func.validate.socket(socket);

      // Emit data (to the operator)
      io.to(socket.id).emit('userSearch', await DB.get.searchUser(query));
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `搜尋使用者時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SEARCHUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error searching user: ${error.error_message} (${socket.id})`,
      );
    }
  },

  connectUser: async (io, socket) => {
    try {
      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await DB.get.user(operatorId);

      // Check if user is already connected
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === operator.id && _socket.id !== socket.id) {
          io.to(_socket.id).emit('openPopup', {
            popupType: 'anotherDeviceLogin',
          });
          _socket.disconnect();
        }
      });

      // Check if user is already connected to a server
      if (operator.currentServerId) {
        await serverHandler.connectServer(io, socket, {
          serverId: operator.currentServerId,
          userId: operator.userId,
        });
      }
      if (operator.currentChannelId) {
        await channelHandler.connectChannel(io, socket, {
          channelId: operator.currentChannelId,
          serverId: operator.currentServerId,
          userId: operator.userId,
        });
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('userUpdate', operator);

      new Logger('WebSocket').success(
        `User(${operatorId}) connected with socket(${socket.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `連接使用者時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CONNECTUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('userUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error connecting user: ${error.error_message} (${socket.id})`,
      );
    }
  },

  disconnectUser: async (io, socket) => {
    try {
      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await DB.get.user(operatorId);

      // Disconnect server or channel
      const serverId = operator.currentServerId;
      if (serverId) {
        // Update user
        const updatedUser = {
          currentServerId: null,
          lastActiveAt: Date.now(),
        };
        await DB.set.user(operatorId, updatedUser);

        // Leave the server
        socket.leave(`server_${serverId}`);
      }

      const channelId = operator.currentChannelId;
      if (channelId) {
        // Update user
        const updatedUser = {
          currentChannelId: null,
          lastActiveAt: Date.now(),
        };
        await DB.set.user(operatorId, updatedUser);

        // Clear user contribution interval
        Xp.delete(operatorId);

        // Leave RTC channel
        await rtcHandler.leave(io, socket, {
          channelId: channelId,
        });

        // Leave channel
        socket.leave(`channel_${channelId}`);

        // Play sound
        io.to(`channel_${channelId}`).emit('playSound', 'leave');

        // Emit updated data (to all users in the server)
        io.to(`server_${serverId}`).emit('serverUpdate', {
          members: await DB.get.serverMembers(serverId),
          users: await DB.get.serverUsers(serverId),
        });
      }

      // Remove maps
      Session.deleteUserIdSessionIdMap(operator.id, socket.sessionId);

      // Update user
      const updatedUser = {
        lastActiveAt: Date.now(),
      };
      await DB.set.user(operatorId, updatedUser);

      // Emit data (to the operator)
      io.to(socket.id).emit('userUpdate', updatedUser);

      new Logger('WebSocket').success(`User(${operatorId}) disconnected`);
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `斷開使用者時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DISCONNECTUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('userUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error disconnecting user: ${error.error_message} (${socket.id})`,
      );
    }
  },

  updateUser: async (io, socket, data) => {
    try {
      // Validate data
      const { user: _editedUser, userId } = data;
      if (!_editedUser || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEUSER',
          'DATA_INVALID',
          401,
        );
      }
      const editedUser = await Func.validate.user(_editedUser);

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === userId) {
          userSocket = _socket;
        }
      });

      // Validate operation
      if (operatorId !== userId) {
        throw new StandardizedError(
          '無法更新其他使用者的資料',
          'ValidationError',
          'UPDATEUSER',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (editedUser.vip) {
        throw new StandardizedError(
          '無法更新自己的 VIP 資料',
          'ValidationError',
          'UPDATEUSER',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (editedUser.level > 1) {
        throw new StandardizedError(
          '無法更新自己的等級資料',
          'ValidationError',
          'UPDATEUSER',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (editedUser.xp) {
        throw new StandardizedError(
          '無法更新自己的經驗值資料',
          'ValidationError',
          'UPDATEUSER',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update user data
      await DB.set.user(userId, editedUser);

      // Emit data (to the operator)
      io.to(userSocket.id).emit('userUpdate', editedUser);

      new Logger('WebSocket').success(
        `User(${userId}) updated by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新使用者時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error updating user: ${error.error_message} (${socket.id})`,
      );
    }
  },
};

module.exports = { ...userHandler };
