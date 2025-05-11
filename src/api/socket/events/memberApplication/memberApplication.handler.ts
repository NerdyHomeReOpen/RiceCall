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
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無法創建非自己的會員申請',
          part: 'CREATEMEMBERAPPLICATION',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      } else {
        if (operatorMember && operatorMember.permissionLevel !== 1) {
          throw new StandardizedError({
            name: 'ValidationError',
            message: '非遊客無法創建會員申請',
            part: 'CREATEMEMBERAPPLICATION',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Create member application
      await database.set.memberApplication(userId, serverId, {
        ...preset,
        createdAt: Date.now(),
      });

      io.to(`server_${serverId}`).emit(
        'serverMemberApplicationAdd',
        await database.get.serverMemberApplication(serverId, userId),
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `創建成員申請時發生無法預期的錯誤: ${error.message}`,
          part: 'CREATEMEMBERAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('MemberApplication').error(error.message);
    }
  },
};

export const UpdateMemberApplicationHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
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
          throw new StandardizedError({
            name: 'ValidationError',
            message: '你沒有足夠的權限更新其他成員的會員申請',
            part: 'UPDATEMEMBERAPPLICATION',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Update member application
      await database.set.memberApplication(userId, serverId, update);

      io.to(`server_${serverId}`).emit(
        'serverMemberApplicationUpdate',
        userId,
        serverId,
        update,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新成員申請時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATEMEMBERAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('MemberApplication').error(error.message);
    }
  },
};

export const DeleteMemberApplicationHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { userId, serverId } = await DataValidator.validate(
        DeleteMemberApplicationSchema,
        data,
        'DELETEMEMBERAPPLICATION',
      );

      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError({
            name: 'ValidationError',
            message: '你沒有足夠的權限刪除其他成員的會員申請',
            part: 'DELETEMEMBERAPPLICATION',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Delete member application
      await database.delete.memberApplication(userId, serverId);

      io.to(`server_${serverId}`).emit(
        'serverMemberApplicationDelete',
        userId,
        serverId,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除成員申請時發生無法預期的錯誤: ${error.message}`,
          part: 'DELETEMEMBERAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('MemberApplication').error(error.message);
    }
  },
};
