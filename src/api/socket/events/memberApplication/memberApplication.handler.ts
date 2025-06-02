import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';
import MemberApplicationNotFoundError from '@/errors/MemberApplicationNotFoundError';
import AlreadyMemberError from '@/errors/AlreadyMemberError';

// Utils
import Logger from '@/utils/logger';

// Socket
import { SocketRequestHandler } from '@/handler';

// Database
import { database } from '@/index';

// Schemas
import {
  CreateMemberApplicationSchema,
  UpdateMemberApplicationSchema,
  DeleteMemberApplicationSchema,
  ApproveMemberApplicationSchema,
} from '@/api/socket/events/memberApplication/memberApplication.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

import { MemberHandlerServerSide } from '../member/memberHandlerServerSide';
import { MemberApplicationHandlerServerSide } from './memberApplicationHandlerServerSide';
import SocketServer from '../..';

export const CreateMemberApplicationHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'CREATEMEMBERAPPLICATION';
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
        part,
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
      io.to(`serverManager_${serverId}`).emit(
        'serverMemberApplicationAdd',
        await database.get.serverMemberApplication(serverId, userId),
      );
      
      /* ========== End of Handling ========== */

      new Logger('CreateMemberApplication').info(
        `User(${operatorId}) created member application(${userId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('CreateMemberApplication').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `創建成員申請失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const UpdateMemberApplicationHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'UPDATEMEMBERAPPLICATION';
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
        part,
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
      io.to(`serverManager_${serverId}`).emit(
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
        new Logger('UpdateMemberApplication').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `更新成員申請失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const DeleteMemberApplicationHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'DELETEMEMBERAPPLICATION';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, serverId } = await DataValidator.validate(
        DeleteMemberApplicationSchema,
        data,
        part,
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

      // await MemberApplicationHandlerServerSide.deleteMemberApplication(userId, serverId);

      await database.delete.memberApplication(userId, serverId);

      // Send socket event
      io.to(`serverManager_${serverId}`).emit('serverMemberApplicationDelete', userId, serverId);
      
      /* ========== End of Handling ========== */

      new Logger('DeleteMemberApplication').info(
        `User(${operatorId}) deleted member application(${userId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('DeleteMemberApplication').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除成員申請失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const ApproveMemberApplicationHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'APPROVEMEMBERAPPLICATION';
    try {
      const operatorId = socket.data.userId;

      const { userId, serverId, member: preset } = await DataValidator.validate(
        ApproveMemberApplicationSchema,
        data,
        part,
      );
      // Target User
      const user = await database.get.user(userId);
      const userMember = await database.get.member(userId, serverId);

      // Operator
      const operator = await database.get.user(operatorId);
      const operatorMember = await database.get.member(operatorId, serverId);
      

      new Logger('ApproveMemberApplication').info(
        `User(${operatorId}) approve member application for User(${userId}) to Server(${serverId})`,
      );

      const memberApplication = await database.get.memberApplication(
        userId,
        serverId,
      );
      if (!memberApplication) throw new MemberApplicationNotFoundError(userId, serverId);

      // Member should already exist when joining the server
      await MemberApplicationHandlerServerSide.deleteMemberApplication(userId, serverId);
      await MemberHandlerServerSide.updateMember(userId, serverId, { permissionLevel: 2 });

      const targetSocket = SocketServer.getSocket(userId);

      const updatedUserMember = {
        ...userMember,
        ...{ permissionLevel: 2 },
      };

      io.to(`server_${serverId}`).emit('onMessage', {
        serverId: serverId,
        channelId: null,
        sender: {
          ...operatorMember,
          ...operator
        },
        receiver: {
          ...updatedUserMember,
          ...user
        },
        type: 'event',
        content: 'updateMemberMessage',
        timestamp: Date.now().valueOf(),
      });

      if (targetSocket) {
        targetSocket.emit('onActionMessage', {
          serverId: serverId,
          channelId: null,
          sender: {
            ...operatorMember,
            ...operator
          },
          receiver: {
            ...updatedUserMember,
            ...user
          },
          type: 'info',
          content: 'upgradeMemberMessage',
          timestamp: Date.now().valueOf(),
        });
      }

      socket.emit('memberApproval', {
        userId,
        serverId,
      });
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('ApproveMemberApplication').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `處理成員申請失敗，請稍後再試`,
          part: part,
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};
