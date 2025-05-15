import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Schemas
import {
  CreateMemberApplicationSchema,
  UpdateMemberApplicationSchema,
  DeleteMemberApplicationSchema,
} from '@/api/socket/events/memberApplication/memberApplication.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const CreateMemberApplicationHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        userId,
        serverId,
        memberApplication: preset,
      } = await DataValidator.validate(
        CreateMemberApplicationSchema,
        data,
        'CREATEMEMBERAPPLICATION',
      );

      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        reason = 'Cannot create non-self member application';
      } else {
        if (operatorMember && operatorMember.permissionLevel !== 1) {
          reason = 'Cannot create member application as non-guest';
        }
      }

      if (reason) {
        new Logger('CreateMemberApplication').warn(
          `User(${operatorId}) failed to create member application(${userId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Create member application
      await database.set.memberApplication(userId, serverId, {
        ...preset,
        createdAt: Date.now(),
      });

      // Send socket event
      io.to(`server_${serverId}`).emit(
        'serverMemberApplicationAdd',
        await database.get.serverMemberApplication(serverId, userId),
      );

      /* ========== End of Handling ========== */

      new Logger('CreateMemberApplication').info(
        `User(${operatorId}) created member application(${userId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `創建成員申請時發生無法預期的錯誤，請稍後再試`,
          part: 'CREATEMEMBERAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('CreateMemberApplication').error(error.message);
    }
  },
};

export const UpdateMemberApplicationHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        userId,
        serverId,
        memberApplication: update,
      } = await DataValidator.validate(
        UpdateMemberApplicationSchema,
        data,
        'UPDATEMEMBERAPPLICATION',
      );

      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 5) {
          reason = 'Not enough permission';
        }
      }

      if (reason) {
        new Logger('UpdateMemberApplication').warn(
          `User(${operatorId}) failed to update member application(${userId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Update member application
      await database.set.memberApplication(userId, serverId, update);

      // Send socket event
      io.to(`server_${serverId}`).emit(
        'serverMemberApplicationUpdate',
        userId,
        serverId,
        update,
      );

      /* ========== End of Handling ========== */

      new Logger('UpdateMemberApplication').info(
        `User(${operatorId}) updated member application(${userId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新成員申請時發生無法預期的錯誤，請稍後再試`,
          part: 'UPDATEMEMBERAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('UpdateMemberApplication').error(error.message);
    }
  },
};

export const DeleteMemberApplicationHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, serverId } = await DataValidator.validate(
        DeleteMemberApplicationSchema,
        data,
        'DELETEMEMBERAPPLICATION',
      );

      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 5) {
          reason = 'Not enough permission';
        }
      }

      if (reason) {
        new Logger('DeleteMemberApplication').warn(
          `User(${operatorId}) failed to delete member application(${userId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Delete member application
      await database.delete.memberApplication(userId, serverId);

      // Send socket event
      io.to(`server_${serverId}`).emit(
        'serverMemberApplicationDelete',
        userId,
        serverId,
      );

      /* ========== End of Handling ========== */

      new Logger('DeleteMemberApplication').info(
        `User(${operatorId}) deleted member application(${userId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除成員申請時發生無法預期的錯誤，請稍後再試`,
          part: 'DELETEMEMBERAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('DeleteMemberApplication').error(error.message);
    }
  },
};
