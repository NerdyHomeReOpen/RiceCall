/* eslint-disable @typescript-eslint/no-require-imports */
// Utils
const utils = require('../utils');
const { Logger, Func } = utils;

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

const friendHandler = {
  createFriend: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string;
      //   targetId: string;
      //   friend: {
      //     ...
      //   },
      // }

      // Validate data
      const { friend: _newFriend, userId, targetId } = data;
      if (!_newFriend || !userId || !targetId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATEFRIEND',
          'DATA_INVALID',
          401,
        );
      }
      const newFriend = await Func.validate.friend(_newFriend);

      // Validate socket
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
          '無法新增非自己的好友',
          'ValidationError',
          'CREATEFRIEND',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (userId === targetId) {
        throw new StandardizedError(
          '無法將自己加入好友',
          'ValidationError',
          'CREATEFRIEND',
          'SELF_OPERATION',
          403,
        );
      }

      // Create friend
      await DB.set.friend(userId, targetId, {
        ...newFriend,
        createdAt: Date.now(),
      });

      // Create reverse friend
      await DB.set.friend(targetId, userId, {
        ...newFriend,
        createdAt: Date.now(),
      });

      // Emit data (to the user and target)
      io.to(userSocket.id).emit(
        'userFriendsUpdate',
        await DB.get.userFriends(userId),
      );
      if (targetSocket) {
        io.to(targetSocket.id).emit(
          'userFriendsUpdate',
          await DB.get.userFriends(targetId),
        );
      }

      // Will be removed in the future
      io.to(userSocket.id).emit('userUpdate', {
        friends: await DB.get.userFriends(userId),
      });
      if (targetSocket) {
        io.to(targetSocket.id).emit('userUpdate', {
          friends: await DB.get.userFriends(targetId),
        });
      }

      new Logger('Friend').success(
        `Friend(${userId}-${targetId}) and Friend(${targetId}-${userId}) of User(${userId}) and User(${targetId}) created by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `建立好友時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATEFRIEND',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Friend').error(
        `Error creating friend: ${error.error_message} (${socket.id})`,
      );
    }
  },

  updateFriend: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string
      //   targetId: string
      //   friend: {
      //     ...
      //   }
      // }

      // Validate data
      const { friend: _editedFriend, userId, targetId } = data;
      if (!_editedFriend || !userId || !targetId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEFRIEND',
          'DATA_INVALID',
          401,
        );
      }
      const editedFriend = await Func.validate.friend(_editedFriend);

      // Validate socket
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
          '無法修改非自己的好友',
          'ValidationError',
          'UPDATEFRIEND',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update friend
      await DB.set.friend(userId, targetId, editedFriend);

      // Emit data (to the user and target)
      io.to(userSocket.id).emit('friendUpdate', editedFriend);
      io.to(userSocket.id).emit(
        'userFriendsUpdate',
        await DB.get.userFriends(userId),
      );
      if (targetSocket) {
        io.to(targetSocket.id).emit('friendUpdate', editedFriend);
        io.to(targetSocket.id).emit(
          'userFriendsUpdate',
          await DB.get.userFriends(targetId),
        );
      }

      // Will be removed in the future
      io.to(userSocket.id).emit('userUpdate', {
        friends: await DB.get.userFriends(userId),
      });
      if (targetSocket) {
        io.to(targetSocket.id).emit('userUpdate', {
          friends: await DB.get.userFriends(targetId),
        });
      }

      new Logger('Friend').success(
        `Friend(${userId}-${targetId}) and Friend(${targetId}-${userId}) of User(${userId}) and User(${targetId}) updated by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新好友時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEFRIEND',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Friend').error(
        `Error updating friend: ${error.error_message} (${socket.id})`,
      );
    }
  },
  deleteFriend: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string
      //   targetId: string
      // }

      // Validate data
      const { userId, targetId } = data;
      if (!userId || !targetId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DELETEFRIEND',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
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
          '無法刪除非自己的好友',
          'ValidationError',
          'DELETEFRIEND',
          'PERMISSION_DENIED',
          403,
        );
      }

      await DB.delete.friend(userId, targetId);
      await DB.delete.friend(targetId, userId);

      // Emit data (to the user and target)
      io.to(userSocket.id).emit(
        'userFriendsUpdate',
        await DB.get.userFriends(userId),
      );
      if (targetSocket) {
        io.to(targetSocket.id).emit(
          'userFriendsUpdate',
          await DB.get.userFriends(targetId),
        );
      }

      // Will be removed in the future
      io.to(userSocket.id).emit('userUpdate', {
        friends: await DB.get.userFriends(userId),
      });
      if (targetSocket) {
        io.to(targetSocket.id).emit('userUpdate', {
          friends: await DB.get.userFriends(targetId),
        });
      }

      new Logger('Friend').success(
        `Friend(${userId}-${targetId}) and Friend(${targetId}-${userId}) of User(${userId}) and User(${targetId}) deleted by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刪除好友時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DELETEFRIEND',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Friend').error(
        `Error deleting friend: ${error.error_message} (${socket.id})`,
      );
    }
  },
};

module.exports = { ...friendHandler };
