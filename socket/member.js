/* eslint-disable @typescript-eslint/no-require-imports */
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
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const server = await Get.server(serverId);
      const operatorMember = await Get.member(operator.id, server.id);

      if (!user || !server){
        throw new StandardizedError(
          'user 或 server 不存在',
          'ValidationError',
          'UPDATEMEMBER',
          'DATA_INVALID',
          401,
        );
      }

      if (operator.id === user.id) {
        if (newMember.permissionLevel !== 1 && server.ownerId != operator.id) {
          throw new StandardizedError(
            '必須是遊客',
            'ValidationError',
            'CREATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (newMember.permissionLevel !== 6 && server.ownerId === operator.id) {
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
            'PERMISSION_TOO_HIGH',
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
      const memberId = `mb_${userId}-${serverId}`;
      const member = await Set.member(memberId, {
        ...newMember,
        userId: user.id,
        serverId: server.id,
        createdAt: Date.now(),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        members: await Get.serverMembers(server.id),
      });

      new Logger('Member').success(
        `Member(${member.id}) of User(${user.id}) in Server(${server.id}) created by User(${operator.id})`,
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
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const server = await Get.server(serverId);
      const member = await Get.member(userId, serverId);
      const operatorMember = await Get.member(operator.id, server.id);

      if (!user || !server || !member){
        throw new StandardizedError(
          'user 或 server 或 member 不存在',
          'ValidationError',
          'UPDATEMEMBER',
          'DATA_INVALID',
          401,
        );
      }

      if (!operatorMember){
        throw new StandardizedError(
          '你不是此伺服器成員',
          'ValidationError',
          'UPDATEMEMBER',
          'DATA_INVALID',
          401,
        );
      }

      if (operator.id === user.id) {
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
        if (member.permissionLevel > 5) {
          throw new StandardizedError(
            '無法更改群創建者的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (
          member.permissionLevel === 1 &&
          editedMember.permissionLevel &&
          !operatorMember.permissionLevel > 5
        ) {
          throw new StandardizedError(
            '你沒有足夠的權限更改非會員使用者的權限',
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
            '無法更改會員為非會員',
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
            '無法設置高於自己的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_TOO_HIGH',
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
      await Set.member(member.id, editedMember);

      // Emit updated data to all users in the server
      io.to(`server_${server.id}`).emit('serverUpdate', {
        members: await Get.serverMembers(server.id),
      });

      new Logger('Member').success(
        `Member(${member.id}) of User(${user.id}) in Server(${server.id}) updated by User(${operator.id})`,
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
