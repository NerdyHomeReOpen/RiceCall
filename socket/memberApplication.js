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

const memberApplicationHandler = {
  createMemberApplication: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string,
      //   serverId: string,
      //   memberApplication: {
      //     ...
      //   },
      // }

      // Validate data
      const { memberApplication: _newApplication, userId, serverId } = data;
      if (!_newApplication || !userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATEMEMBERAPPLICATION',
          'DATA_INVALID',
          401,
        );
      }
      const memberApplication = await Func.validate.memberApplication(
        _newApplication,
      );

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const server = await Get.server(serverId);

      // Validate operator
      if (operator.id !== user.id) {
        throw new StandardizedError(
          '無法創建非自己的會員申請',
          'ValidationError',
          'CREATEMEMBERAPPLICATION',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Create member application
      const applicationId = `ma_${user.id}-${server.id}`;
      await Set.memberApplications(applicationId, {
        ...memberApplication,
        userId: user.id,
        serverId: server.id,
        createdAt: Date.now(),
      });

      // Emit updated data to all users in the server
      io.to(`server_${server.id}`).emit('serverUpdate', {
        memberApplications: await Get.serverApplications(server.id),
      });

      new Logger('MemberApplication').success(
        `Member application(${applicationId}) of User(${user.id}) and server(${server.id}) created by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `創建申請時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATEMEMBERAPPLICATION',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('MemberApplication').error(
        `Error creating member application: ${error.error_message} (${socket.id})`,
      );
    }
  },

  updateMemberApplication: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string,
      //   serverId: string,
      //   memberApplication: {
      //     ...
      //   },
      // }

      // Validate data
      const { memberApplication: _editedApplication, userId, serverId } = data;
      if (!_editedApplication || !userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEMEMBERAPPLICATION',
          'DATA_INVALID',
          401,
        );
      }
      const editedApplication = await Func.validate.memberApplication(
        _editedApplication,
      );

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const server = await Get.server(serverId);
      const application = await Get.memberApplication(userId, serverId);
      const operatorMember = await Get.member(operator.id, server.id);

      if (!application) {
        throw new StandardizedError(
          '申請不存在',
          'ValidationError',
          'UPDATEMEMBERAPPLICATION',
          'APPLICATION_NOT_FOUND',
          404,
        );
      }
      // Validate operator
      if (operator.id === user.id) {
        if (application.applicationStatus !== 'pending') {
          throw new StandardizedError(
            '無法更新已經被處理過的申請',
            'ValidationError',
            'UPDATEMEMBERAPPLICATION',
            'APPLICATION_ALREADY_PROCESSED',
            403,
          );
        }
      } else {
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError(
            '你沒有足夠的權限更新其他成員的會員申請',
            'ValidationError',
            'UPDATEMEMBERAPPLICATION',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (application.applicationStatus !== 'pending') {
          throw new StandardizedError(
            '無法更新已經被處理過的申請',
            'ValidationError',
            'UPDATEMEMBERAPPLICATION',
            'APPLICATION_ALREADY_PROCESSED',
            403,
          );
        }
      }

      // Update member application
      await Set.memberApplications(application.id, editedApplication);

      // Emit updated data to all users in the server
      io.to(`server_${server.id}`).emit('serverUpdate', {
        memberApplications: await Get.serverApplications(server.id),
      });

      new Logger('MemberApplication').success(
        `Member application(${application.id}) of User(${user.id}) and server(${server.id}) updated by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新申請時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEMEMBERAPPLICATION',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('MemberApplication').error(
        `Error updating member application: ${error.error_message} (${socket.id})`,
      );
    }
  },

  deleteMemberApplication: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string,
      //   serverId: string,
      // }

      // Validate data
      const { userId, serverId } = data;
      if (!userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DELETEMEMBERAPPLICATION',
          'DATA_INVALID',
          401,
        );
      }

      // Validate operator
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const server = await Get.server(serverId);
      const application = await Get.memberApplication(userId, serverId);
      const operatorMember = await Get.member(operator.id, server.id);

      if (!application) {
        throw new StandardizedError(
          '申請不存在',
          'ValidationError',
          'DELETEMEMBERAPPLICATION',
          'APPLICATION_NOT_FOUND',
          404,
        );
      }

      // Validate operation
      if (operator.id === user.id) {
        if (application.applicationStatus !== 'pending') {
          throw new StandardizedError(
            '無法刪除已經被處理過的申請',
            'ValidationError',
            'DELETEMEMBERAPPLICATION',
            'APPLICATION_ALREADY_PROCESSED',
            403,
          );
        }
      } else {
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError(
            '你沒有足夠的權限刪除其他成員的會員申請',
            'ValidationError',
            'DELETEMEMBERAPPLICATION',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (application.applicationStatus !== 'pending') {
          throw new StandardizedError(
            '無法刪除已經被處理過的申請',
            'ValidationError',
            'DELETEMEMBERAPPLICATION',
            'APPLICATION_ALREADY_PROCESSED',
            403,
          );
        }
      }

      // Delete member application
      await db.delete(`memberApplications.${application.id}`);

      // Emit updated data to all users in the server
      io.to(`server_${server.id}`).emit('serverUpdate', {
        memberApplications: await Get.serverApplications(server.id),
      });

      new Logger('MemberApplication').success(
        `Member application(${application.id}) of User(${user.id}) and server(${server.id}) deleted by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刪除申請時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DELETEMEMBERAPPLICATION',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('MemberApplication').error(
        `Error deleting member application: ${error.error_message} (${socket.id})`,
      );
    }
  },
};
module.exports = { ...memberApplicationHandler };
