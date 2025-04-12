/* eslint-disable @typescript-eslint/no-require-imports */
// Utils
const utils = require('../utils');
const { Logger, Func } = utils;

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

const memberHandler = {
  createMember: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string;
      //   serverId: string;
      //   member: {
      //     ...
      //   },
      // }

      // Validate data
      const { member: _newMember, userId, serverId } = data;
      if (!_newMember || !userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATEMEMBER',
          'DATA_INVALID',
          401,
        );
      }
      const newMember = await Func.validate.member(_newMember);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const server = await DB.get.server(serverId);
      const operatorMember = await DB.get.member(operatorId, serverId);

      if (operatorId === userId) {
        if (newMember.permissionLevel !== 1 && server.ownerId !== operatorId) {
          throw new StandardizedError(
            '必須是遊客',
            'ValidationError',
            'CREATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (newMember.permissionLevel !== 6 && server.ownerId === operatorId) {
          throw new StandardizedError(
            '必須是群組創建者',
            'ValidationError',
            'CREATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
      } else {
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError(
            '你沒有足夠的權限新增成員',
            'ValidationError',
            'CREATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (newMember.permissionLevel >= operatorMember.permissionLevel) {
          throw new StandardizedError(
            '無法新增權限高於自己的成員',
            'ValidationError',
            'CREATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (newMember.permissionLevel > 5) {
          throw new StandardizedError(
            '權限等級過高',
            'ValidationError',
            'CREATEMEMBER',
            'PERMISSION_TOO_HIGH',
            403,
          );
        }
      }

      // Create member
      await DB.set.member(userId, serverId, {
        ...newMember,
        createdAt: Date.now(),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${serverId}`).emit(
        'serverMembersUpdate',
        await DB.get.serverMembers(serverId),
      );
      io.to(`server_${serverId}`).emit(
        'serverActiveMembersUpdate',
        await DB.get.serverUsers(serverId),
      );

      // Will be removed in the future
      io.to(`server_${serverId}`).emit('serverUpdate', {
        members: await DB.get.serverMembers(serverId),
      });

      new Logger('Member').success(
        `Member(${userId}-${serverId}) of User(${userId}) in Server(${serverId}) created by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `建立成員時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATEMEMBER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Member').error(
        `Error creating member: ${error.error_message} (${socket.id})`,
      );
    }
  },

  updateMember: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string;
      //   serverId: string;
      //   member: {
      //     ...
      //   },
      // }

      // Validate data
      const { member: _editedMember, userId, serverId } = data;
      if (!_editedMember || !userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEMEMBER',
          'DATA_INVALID',
          401,
        );
      }
      const editedMember = await Func.validate.member(_editedMember);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operatorMember = await DB.get.member(operatorId, serverId);
      const userMember = await DB.get.member(userId, serverId);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === userId) {
          userSocket = _socket;
        }
      });

      if (operatorId === userId) {
        if (editedMember.permissionLevel) {
          throw new StandardizedError(
            '無法更改自己的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
      } else {
        if (operatorMember.permissionLevel < 3) {
          throw new StandardizedError(
            '你沒有足夠的權限更改其他成員',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (userMember.permissionLevel > 5) {
          throw new StandardizedError(
            '無法更改群創建者的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (
          userMember.permissionLevel === 1 &&
          editedMember.permissionLevel &&
          !operatorMember.permissionLevel > 5
        ) {
          throw new StandardizedError(
            '你沒有足夠的權限更改遊客的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (
          editedMember.permissionLevel === 1 &&
          !operatorMember.permissionLevel > 5
        ) {
          throw new StandardizedError(
            '你沒有足夠的權限更改會員至遊客',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (editedMember.nickname && operatorMember.permissionLevel < 5) {
          throw new StandardizedError(
            '你沒有足夠的權限更改其他成員的暱稱',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (editedMember.permissionLevel >= operatorMember.permissionLevel) {
          throw new StandardizedError(
            '無法更改高於自己權限的成員',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (editedMember.permissionLevel > 5) {
          throw new StandardizedError(
            '權限等級過高',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_TOO_HIGH',
            403,
          );
        }
      }

      // Update member
      await DB.set.member(userId, serverId, editedMember);

      // Emit updated data (to all users in the server)
      io.to(`server_${serverId}`).emit(
        'serverMembersUpdate',
        await DB.get.serverMembers(serverId),
      );
      io.to(`server_${serverId}`).emit(
        'serverActiveMembersUpdate',
        await DB.get.serverUsers(serverId),
      );

      // Will be removed in the future
      io.to(`server_${serverId}`).emit('serverUpdate', {
        members: await DB.get.serverMembers(serverId),
      });

      // Emit updated data (to the user *if the user is in the server*)
      io.in(`server_${serverId}`)
        .fetchSockets()
        .then((sockets) => {
          sockets.forEach((socket) => {
            if (socket.id === userSocket.id) {
              socket.emit('memberUpdate', editedMember);
            }
          });
        });

      new Logger('Member').success(
        `Member(${userId}-${serverId}) of User(${userId}) in Server(${serverId}) updated by User(${operatorId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新成員時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEMEMBER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Member').error(
        `Error updating member: ${error.error_message} (${socket.id})`,
      );
    }
  },
};

module.exports = { ...memberHandler };
