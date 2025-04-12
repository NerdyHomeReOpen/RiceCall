/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');
// Utils
const utils = require('../utils');
const { Logger, Func } = utils;

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

// Handlers
const channelHandler = require('./channel');
const memberHandler = require('./member');

const serverHandler = {
  searchServer: async (io, socket, data) => {
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
          'SEARCHSERVER',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
      await Func.validate.socket(socket);

      io.to(socket.id).emit('serverSearch', await DB.get.searchServer(query));
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `搜尋群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SEARCHSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error searching servers: ${error.error_message}`,
      );
    }
  },

  connectServer: async (io, socket, data) => {
    try {
      // data = {
      //   userId:
      //   serverId:
      // }

      // Validate data
      const { userId, serverId } = data;
      if (!userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CONNECTSERVER',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operatorMember = await DB.get.member(operatorId, serverId);
      const user = await DB.get.user(userId);
      const server = await DB.get.server(serverId);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === userId) {
          userSocket = _socket;
        }
      });

      // Validate operation
      if (operatorId !== userId) {
        throw new StandardizedError(
          '無法移動其他用戶的群組',
          'ValidationError',
          'CONNECTSERVER',
          'PERMISSION_DENIED',
          403,
        );
      } else {
        if (
          server.visibility === 'invisible' &&
          operatorMember &&
          operatorMember.permissionLevel < 2
        ) {
          io.to(userSocket.id).emit('openPopup', {
            popupType: 'applyMember',
            initialData: {
              serverId: serverId,
              userId: userId,
            },
          });

          // Emit data (to the user)
          io.to(userSocket.id).emit('serverUpdate', null);

          new Logger('Server').warn(
            `User(${userId}) tried to connect to server(${serverId}) but was denied because of non-member`,
          );
          return;
        }
      }

      // Create new membership if there isn't one
      if (!operatorMember) {
        await memberHandler.createMember(io, socket, {
          userId: userId,
          serverId: serverId,
          member: {
            permissionLevel:
              specialUsers.getSpecialPermissionLevel(userId) || 1,
          },
        });
      }

      // Leave prev server
      if (user.currentServerId) {
        await serverHandler.disconnectServer(io, socket, {
          serverId: user.currentServerId,
          userId: userId,
        });
      }

      // Update user-server
      await DB.set.userServer(userId, serverId, {
        recent: true,
        timestamp: Date.now(),
      });

      // Update user
      const updatedUser = {
        currentServerId: serverId,
        lastActiveAt: Date.now(),
      };
      await DB.set.user(userId, updatedUser);

      // Join the server
      userSocket.join(`server_${serverId}`);

      // Emit data (only to the user)
      io.to(userSocket.id).emit('userUpdate', user_update);
      io.to(userSocket.id).emit('serverUpdate', await Get.server(server.id));

      // Connect to the server's lobby channel
      await channelHandler.connectChannel(io, socket, {
        userId: userId,
        serverId: serverId,
        channelId: server.lobbyId,
      });

      // Emit data (only to the user)
      io.to(userSocket.id).emit('userUpdate', updatedUser);
      io.to(userSocket.id).emit('serverUpdate', server);

      new Logger('Server').success(
        `User(${userId}) connected to server(${serverId}) by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `連接群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CONNECTSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('serverUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error connecting server: ${error.error_message}`,
      );
    }
  },

  disconnectServer: async (io, socket, data) => {
    try {
      // data = {
      //   userId:
      //   serverId:
      // }

      // Validate data
      const { userId, serverId } = data;
      if (!userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DISCONNECTSERVER',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const user = await DB.get.user(userId);
      const userMember = await DB.get.member(userId, serverId);
      const operatorMember = await DB.get.member(operatorId, serverId);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === userId) {
          userSocket = _socket;
        }
      });

      // Validate operation
      if (operatorId !== userId) {
        if (serverId !== user.currentServerId) {
          throw new StandardizedError(
            '無法踢出不在該群組的用戶',
            'ValidationError',
            'DISCONNECTSERVER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError(
            '你沒有足夠的權限踢出其他用戶',
            'ValidationError',
            'DISCONNECTSERVER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (operatorMember.permissionLevel <= userMember.permissionLevel) {
          throw new StandardizedError(
            '你沒有足夠的權限踢出該用戶',
            'ValidationError',
            'DISCONNECTSERVER',
            'PERMISSION_DENIED',
            403,
          );
        }
      }

      // Leave prev channel
      if (user.currentChannelId) {
        await channelHandler.disconnectChannel(io, socket, {
          channelId: user.currentChannelId,
          userId: user.id,
        });
      }

      // Update user presence
      const updatedUser = {
        currentServerId: null,
        lastActiveAt: Date.now(),
      };
      await DB.set.user(userId, updatedUser);

      // Leave the server
      userSocket.leave(`server_${serverId}`);

      // Emit data (only to the user)
      io.to(userSocket.id).emit('userUpdate', updatedUser);
      io.to(userSocket.id).emit('serverUpdate', null);

      new Logger('Server').success(
        `User(${userId}) disconnected from server(${serverId}) by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `斷開群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DISCONNECTSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('serverUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error disconnecting from server: ${error.error_message}`,
      );
    }
  },

  createServer: async (io, socket, data) => {
    try {
      // data = {
      //   server: {
      //     ...
      //   }
      // }

      // Validate data
      const { server: _newServer } = data;
      if (!_newServer) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATESERVER',
          'DATA_INVALID',
          401,
        );
      }
      const newServer = await Func.validate.server(_newServer);

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await DB.get.user(operatorId);
      const operatorServer = await DB.get.userServers(operatorId);

      // Validate operation
      if (
        operatorServer.filter((s) => s.owned).length >=
        Math.min(3 + operator.level / 5, 10)
      ) {
        throw new StandardizedError(
          '可擁有群組數量已達上限',
          'ValidationError',
          'CREATESERVER',
          'LIMIT_REACHED',
          403,
        );
      }

      // Create server
      const serverId = uuidv4();
      await DB.set.server(serverId, {
        ...newServer,
        name: newServer.name?.trim() || '',
        slogan: newServer.slogan?.trim() || '',
        displayId: await Func.generateUniqueDisplayId(),
        ownerId: operatorId,
        createdAt: Date.now(),
      });

      // Create member
      await memberHandler.createMember(io, socket, {
        userId: operatorId,
        serverId: serverId,
        member: {
          permissionLevel: 6,
        },
      });

      // Create channel (lobby)
      await channelHandler.createChannel(io, socket, {
        serverId: serverId,
        channel: {
          name: '大廳',
          isLobby: true,
          isRoot: true,
        },
      });

      // Update Server (lobby)
      const serverChannels = await DB.get.serverChannels(serverId);
      await DB.set.server(serverId, {
        lobbyId: serverChannels[0].channelId,
        ownerId: operatorId,
      });

      // Create user-server
      await DB.set.userServer(operatorId, serverId, {
        recent: true,
        owned: true,
        timestamp: Date.now(),
      });

      // Join the server
      await serverHandler.connectServer(io, socket, {
        serverId: serverId,
        userId: operatorId,
      });

      new Logger('Server').success(
        `Server(${serverId}) created by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `創建群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATESERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error creating server: ${error.error_message}`,
      );
    }
  },

  updateServer: async (io, socket, data) => {
    try {
      // data = {
      //   serverId:
      //   server: {
      //     ...
      //   }
      // }

      // Validate data
      const { server: _editedServer, serverId } = data;
      if (!_editedServer || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATESERVER',
          'DATA_INVALID',
          401,
        );
      }
      const editedServer = await Func.validate.server(_editedServer);

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operatorMember = await DB.get.member(operatorId, serverId);

      // Validate operation
      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError(
          '你沒有足夠的權限更新該群組',
          'ValidationError',
          'UPDATESERVER',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update server
      await DB.set.server(serverId, editedServer);

      // Emit updated data to all users in the server
      io.to(`server_${serverId}`).emit('serverUpdate', editedServer);

      new Logger('Server').success(
        `Server(${serverId}) updated by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATESERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error updating server: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...serverHandler };
