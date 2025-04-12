/* eslint-disable @typescript-eslint/no-require-imports */
// Utils
const utils = require('../utils');
const { Logger, Func } = utils;

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

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
      const operatorMember = await DB.get.member(operatorId, serverId);

      // Validate operator
      if (operatorId === userId) {
        if (operatorMember.permissionLevel !== 1) {
          throw new StandardizedError(
            '非遊客無法創建會員申請',
            'ValidationError',
            'CREATEMEMBERAPPLICATION',
            'PERMISSION_DENIED',
            403,
          );
        }
      } else {
        throw new StandardizedError(
          '無法創建非自己的會員申請',
          'ValidationError',
          'CREATEMEMBERAPPLICATION',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Create member application
      await DB.set.memberApplication(userId, serverId, {
        ...memberApplication,
        createdAt: Date.now(),
      });

      // Emit updated data to all users in the server
      io.to(`server_${serverId}`).emit(
        'serverMemberApplicationsUpdate',
        await DB.get.serverMemberApplications(serverId),
      );

      // Will be removed in the future
      io.to(`server_${serverId}`).emit('serverUpdate', {
        memberApplications: await DB.get.serverMemberApplications(serverId),
      });

      new Logger('MemberApplication').success(
        `Member application(${userId}-${serverId}) of User(${userId}) and server(${serverId}) created by User(${operatorId})`,
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
      const operatorMember = await DB.get.member(operatorId, serverId);

      // Validate operator
      if (operatorId === userId) {
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
      }

      // Update member application
      await DB.set.memberApplication(userId, serverId, editedApplication);

      // Emit updated data to all users in the server
      io.to(`server_${serverId}`).emit(
        'serverMemberApplicationsUpdate',
        await DB.get.serverMemberApplications(serverId),
      );

      // Will be removed in the future
      io.to(`server_${serverId}`).emit('serverUpdate', {
        memberApplications: await DB.get.serverMemberApplications(serverId),
      });

      new Logger('MemberApplication').success(
        `Member application(${userId}-${serverId}) of User(${userId}) and server(${serverId}) updated by User(${operatorId})`,
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
      const operatorMember = await DB.get.member(operatorId, serverId);

      // Validate operation
      if (operatorId === userId) {
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
      }

      // Delete member application
      await DB.delete.memberApplication(userId, serverId);

      // Emit updated data to all users in the server
      io.to(`server_${serverId}`).emit(
        'serverMemberApplicationsUpdate',
        await DB.get.serverMemberApplications(serverId),
      );

      // Will be removed in the future
      io.to(`server_${serverId}`).emit('serverUpdate', {
        memberApplications: await DB.get.serverMemberApplications(serverId),
      });

      new Logger('MemberApplication').success(
        `Member application(${userId}-${serverId}) of User(${userId}) and server(${serverId}) deleted by User(${operatorId})`,
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
