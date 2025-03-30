/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const {
  standardizedError: StandardizedError,
  logger: Logger,
  map: Map,
  get: Get,
  set: Set,
  func: Func,
} = utils;
// Handlers
const serverHandler = require('./server');
const channelHandler = require('./channel');

const userHandler = {
  searchUser: async (io, socket, data) => {
    // const users = (await db.get('users')) || {};

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

      // Validate operation
      await Func.validate.socket(socket);
      // TODO: implement search results

      // Emit data (only to the user)
      io.to(socket.id).emit('userSearch', await Get.searchUser(query));
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

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error searching user: ${error.error_message}`,
      );
    }
  },

  connectUser: async (io, socket) => {
    const users = (await db.get('users')) || {};

    try {
      // Validate data
      const userId = await Func.validate.socket(socket);
      const user = await Func.validate.user(users[userId]);

      // Check if user is already connected
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === socket.userId && _socket.id !== socket.id) {
          _socket.disconnect();
        }
      });

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', await Get.user(user.id));

      new Logger('WebSocket').success(
        `User(${user.id}) connected with socket(${socket.id})`,
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

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error connecting user: ${error.error_message}`,
      );
    }
  },

  disconnectUser: async (io, socket) => {
    // Get database
    const users = (await db.get('users')) || {};

    try {
      // Validate data
      const userId = await Func.validate.socket(socket);
      const user = await Func.validate.user(users[userId]);

      // Disconnect server or channel
      if (user.currentServerId) {
        await serverHandler.disconnectServer(io, socket, {
          serverId: user.currentServerId,
          userId: user.id,
        });
      } else if (user.currentChannelId) {
        await channelHandler.disconnectChannel(io, socket, {
          channelId: user.currentChannelId,
          userId: user.id,
        });
      }

      // Remove maps
      Map.deleteUserIdSessionIdMap(userId, socket.sessionId);
      Map.deleteUserIdSocketIdMap(userId, socket.id);

      // Update user
      const user_update = {
        lastActiveAt: Date.now(),
      };
      await Set.user(userId, user_update);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', user_update);

      new Logger('WebSocket').success(`User(${userId}) disconnected`);
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

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error disconnecting user: ${error.error_message}`,
      );
    }
  },

  updateUser: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};

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
      const user = await Func.validate.user(users[userId]);
      const editedUser = await Func.validate.user(_editedUser);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);
      const operator = await Func.validate.user(users[operatorId]);

      // Handle favorite servers
      if (editedUser.favoriteServerId) {
        const userServer = await Get.server(editedUser.favoriteServerId);
        if (userServer) {
          const userServerId = `us_${userId}_${editedUser.favoriteServerId}`;
          const userFavoriteServers = await Get.userFavServers(userId);
          await Set.userServer(userServerId, {
            favorite: !userFavoriteServers.some(
              (server) => server.id === editedUser.favoriteServerId,
            ),
            userId: userId,
            serverId: editedUser.favoriteServerId,
            timestamp: Date.now(),
          });
        }
      }

      // Update user data
      await Set.user(user.id, editedUser);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', editedUser);

      new Logger('WebSocket').success(
        `User(${user.id}) updated by User(${operator.id})`,
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

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error updating user: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...userHandler };
