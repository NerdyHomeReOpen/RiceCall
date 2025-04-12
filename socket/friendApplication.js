/* eslint-disable @typescript-eslint/no-require-imports */
// Utils
const utils = require('../utils');
const { Logger, Func } = utils;

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

const friendApplicationHandler = {
  createFriendApplication: async (io, socket, data) => {
    try {
      // data = {
      //   senderId: string,
      //   receiverId: string,
      //   friendApplication: {
      //     ...
      //   },
      // }

      // Validate data
      const { friendApplication: _newApplication, senderId, receiverId } = data;
      if (!_newApplication || !senderId || !receiverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATEFRIENDAPPLICATION',
          'DATA_INVALID',
          401,
        );
      }
      const newApplication = await Func.validate.friendApplication(
        _newApplication,
      );

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      let receiverSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === receiverId) {
          receiverSocket = _socket;
        }
      });

      // Validate operation
      if (operatorId !== senderId) {
        throw new StandardizedError(
          '無法創建非自己的好友申請',
          'ValidationError',
          'CREATEFRIENDAPPLICATION',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (senderId === receiverId) {
        throw new StandardizedError(
          '無法發送好友申請給自己',
          'ValidationError',
          'CREATEFRIENDAPPLICATION',
          'SELF_OPERATION',
          403,
        );
      }

      // Create friend application
      await DB.set.friendApplication(senderId, receiverId, {
        ...newApplication,
        createdAt: Date.now(),
      });

      // Emit updated data (to the receiver)
      if (receiverSocket) {
        io.to(receiverSocket.id).emit(
          'userFriendApplicationsUpdate',
          await DB.get.userFriendApplications(receiverId),
        );

        // Will be removed in the future
        io.to(receiverSocket.id).emit('userUpdate', {
          friendApplications: await DB.get.userFriendApplications(receiverId),
        });
      }

      new Logger('FriendApplication').success(
        `Friend application(${senderId}-${receiverId}) of User(${senderId}) and User(${receiverId}) created by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `創建申請時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATEFRIENDAPPLICATION',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendApplication').error(
        `Error creating friend application: ${error.error_message} (${socket.id})`,
      );
    }
  },

  updateFriendApplication: async (io, socket, data) => {
    try {
      // data = {
      //   senderId: string,
      //   receiverId: string,
      //   friendApplication: {
      //     ...
      //   },
      // }

      // Validate data
      const {
        friendApplication: _editedApplication,
        senderId,
        receiverId,
      } = data;
      if (!_editedApplication || !senderId || !receiverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEFRIENDAPPLICATION',
          'DATA_INVALID',
          401,
        );
      }
      const editedApplication = await Func.validate.friendApplication(
        _editedApplication,
      );

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      let receiverSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === receiverId) {
          receiverSocket = _socket;
        }
      });

      // Validate operation
      if (operatorId !== senderId && operatorId !== receiverId) {
        throw new StandardizedError(
          '無法修改非自己的好友申請',
          'ValidationError',
          'UPDATEFRIENDAPPLICATION',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update friend application
      await DB.set.friendApplication(senderId, receiverId, editedApplication);

      // Emit updated data (to the receiver)
      if (receiverSocket) {
        io.to(receiverSocket.id).emit(
          'userFriendApplicationsUpdate',
          await DB.get.userFriendApplications(receiverId),
        );

        // Will be removed in the future
        io.to(receiverSocket.id).emit('userUpdate', {
          friendApplications: await DB.get.userFriendApplications(receiverId),
        });
      }

      new Logger('FriendApplication').success(
        `Friend application(${senderId}-${receiverId}) of User(${senderId}) and User(${receiverId}) updated by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新申請時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEFRIENDAPPLICATION',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendApplication').error(
        `Error updating friend application: ${error.error_message} (${socket.id})`,
      );
    }
  },
  deleteFriendApplication: async (io, socket, data) => {
    try {
      // data = {
      //   senderId: string,
      //   receiverId: string,
      // }

      // Validate data
      const { senderId, receiverId } = data;
      if (!senderId || !receiverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DELETEFRIENDAPPLICATION',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      let receiverSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === receiverId) {
          receiverSocket = _socket;
        }
      });

      // Validate operation
      if (operatorId !== senderId && operatorId !== receiverId) {
        throw new StandardizedError(
          '無法刪除非自己的好友申請',
          'ValidationError',
          'DELETEFRIENDAPPLICATION',
          'PERMISSION_DENIED',
          403,
        );
      }

      await DB.delete.friendApplication(senderId, receiverId);

      if (receiverSocket) {
        io.to(receiverSocket.id).emit(
          'userFriendApplicationsUpdate',
          await DB.get.userFriendApplications(receiverId),
        );

        // Will be removed in the future
        io.to(receiverSocket.id).emit('userUpdate', {
          friendApplications: await DB.get.userFriendApplications(receiverId),
        });
      }
      new Logger('FriendApplication').success(
        `Friend application(${senderId}-${receiverId}) of User(${senderId}) and User(${receiverId}) deleted by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刪除好友申請時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DELETEFRIENDAPPLICATION',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendApplication').error(
        `Error deleting friend application: ${error.error_message} (${socket.id})`,
      );
    }
  },
};

module.exports = { ...friendApplicationHandler };
