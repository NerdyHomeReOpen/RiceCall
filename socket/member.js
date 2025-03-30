/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const {
  standardizedError: StandardizedError,
  logger: Logger,
  get: Get,
  set: Set,
  func: Func,
} = utils;

const memberHandler = {
  createMember: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};

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
      const operator = await Func.validate.user(users[operatorId]);

      // Create member
      const memberId = `mb_${userId}-${serverId}`;
      const member = await Set.member(memberId, {
        ...newMember,
        userId: userId,
        serverId: serverId,
        createdAt: Date.now(),
      });

      // Emit updated data to all users in the server
      io.to(`server_${serverId}`).emit('serverUpdate', {
        members: await Get.serverMembers(serverId),
      });

      new Logger('Server').success(
        `Member(${member.id}) of server(${serverId}) created by User(${operator.id})`,
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

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error creating member: ${error.error_message}`,
      );
    }
  },

  updateMember: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const members = (await db.get('members')) || {};

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
      const member = await Func.validate.member(
        members[`mb_${userId}-${serverId}`],
      );

      // Validate operation
      const operatorId = await Func.validate.socket(socket);
      const operator = await Func.validate.user(users[operatorId]);
      // TODO: Add validation for operator

      const operatorMember = await Get.member(operatorId, serverId);
      const operatorPermission = operatorMember.permissionLevel;

      if (operatorId === userId) {
        if (editedMember.permissionLevel) {
          throw new StandardizedError(
            '你沒有權限更改自己的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
      } else {
        if (!operatorPermission || operatorPermission < 3) {
          throw new StandardizedError(
            '無足夠的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'USER_PERMISSION',
            403,
          );
        }
        if (editedMember.nickname && operatorPermission < 5) {
          throw new StandardizedError(
            '你沒有權限更改其他成員的暱稱',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (operatorPermission < member.permissionLevel) {
          throw new StandardizedError(
            '你沒有權限更改此成員的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (operatorPermission < editedMember.permissionLevel) {
          throw new StandardizedError(
            '你無法設置高於自己的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_TOO_HIGH',
            403,
          );
        }
        if (editedMember.permissionLevel && member.permissionLevel === 6) {
          throw new StandardizedError(
            '你無法更改群創建者的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
      }

      // Update member
      await Set.member(member.id, editedMember);

      // Emit updated data to all users in the server
      io.to(`server_${serverId}`).emit('serverUpdate', {
        members: await Get.serverMembers(serverId),
      });

      new Logger('Server').success(
        `Member(${member.id}) of server(${serverId}) updated by User(${operator.id})`,
      );
    } catch (error) {
      console.log(error);
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新成員時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEMEMBER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error updating member: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...memberHandler };
