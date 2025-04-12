const { v4: uuidv4 } = require('uuid');
// Utils
const utils = require('../utils');
const { Logger, Func } = utils;

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

const friendGroupHandler = {
  createFriendGroup: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string,
      //   group: {
      //     ...
      //   },
      // }

      // Validate data
      const { group: _newFriendGroup, userId } = data;
      if (!_newFriendGroup || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATEFRIENDGROUP',
          'DATA_INVALID',
          401,
        );
      }
      const newFriendGroup = await Func.validate.friendGroup(_newFriendGroup);

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
          '無法新增非自己的好友群組',
          'ValidationError',
          'CREATEFRIENDGROUP',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Create friend group
      const friendGroupId = uuidv4();
      await DB.set.friendGroup(friendGroupId, {
        ...newFriendGroup,
        userId: userId,
        createdAt: Date.now(),
      });

      // Emit updated data (to the user)
      io.to(userSocket.id).emit(
        'userFriendGroupsUpdate',
        await DB.get.userFriendGroups(userId),
      );

      // Will be removed in the future
      io.to(userSocket.id).emit('userUpdate', {
        friendGroups: await DB.get.userFriendGroups(userId),
      });

      new Logger('FriendGroup').success(
        `FriendGroup(${friendGroupId}) of User(${userId}) created by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `新增好友群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATEFRIENDGROUP',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendGroup').error(
        `Error creating friend group: ${error.error_message} (${socket.id})`,
      );
    }
  },

  updateFriendGroup: async (io, socket, data) => {
    try {
      // data = {
      //   friendGroupId: string,
      //   userId: string,
      //   group: {
      //     ...
      //   },
      // }

      // Validate data
      const { friendGroupId, group: _editedFriendGroup, userId } = data;
      if (!friendGroupId || !_editedFriendGroup || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEFRIENDGROUP',
          'DATA_INVALID',
          401,
        );
      }
      const editedFriendGroup = await Func.validate.friendGroup(
        _editedFriendGroup,
      );

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
          '無法修改非自己的好友群組',
          'ValidationError',
          'UPDATEFRIENDGROUP',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update friend group
      await DB.set.friendGroup(friendGroupId, editedFriendGroup);

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', {
        friendGroups: await DB.get.userFriendGroups(userId),
      });

      // Will be removed in the future
      io.to(userSocket.id).emit(
        'userFriendGroupsUpdate',
        await DB.get.userFriendGroups(userId),
      );

      new Logger('FriendGroup').success(
        `FriendGroup(${friendGroupId}) of User(${userId}) updated by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新好友群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEFRIENDGROUP',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendGroup').error(
        `Error updating friend group: ${error.error_message} (${socket.id})`,
      );
    }
  },

  deleteFriendGroup: async (io, socket, data) => {
    try {
      // data = {
      //   friendGroupId: string,
      //   userId: string,
      // }

      // Validate data
      const { friendGroupId, userId } = data;
      if (!friendGroupId || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DELETEFRIENDGROUP',
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

      // Validate operation
      if (operatorId !== userId) {
        throw new StandardizedError(
          '無法刪除非自己的好友群組',
          'ValidationError',
          'DELETEFRIENDGROUP',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Delete friend group
      await DB.delete.friendGroup(friendGroupId);

      // Emit updated data (to the user)
      io.to(userSocket.id).emit(
        'userFriendGroupsUpdate',
        await DB.get.userFriendGroups(userId),
      );

      // Will be removed in the future
      io.to(userSocket.id).emit('userUpdate', {
        friendGroups: await DB.get.userFriendGroups(userId),
      });

      new Logger('FriendGroup').success(
        `FriendGroup(${friendGroupId}) of User(${userId}) deleted by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刪除好友群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DELETEFRIENDGROUP',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendGroup').error(
        `Error deleting friend group: ${error.error_message} (${socket.id})`,
      );
    }
  },
};

module.exports = { ...friendGroupHandler };
