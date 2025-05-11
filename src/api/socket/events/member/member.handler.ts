import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Schemas
import {
  CreateMemberSchema,
  UpdateMemberSchema,
  DeleteMemberSchema,
} from '@/api/socket/events/member/member.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const CreateMemberHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const {
        userId,
        serverId,
        member: preset,
      } = await new DataValidator(CreateMemberSchema, 'CREATEMEMBER').validate(
        data,
      );

      const server = await database.get.server(serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限新增成員',
            part: 'CREATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
        if (preset.permissionLevel >= operatorMember.permissionLevel) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '無法給予高於自己的權限',
            part: 'CREATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
        if (preset.permissionLevel > 5) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '權限等級過高',
            part: 'CREATEMEMBER',
            tag: 'PERMISSION_TOO_HIGH',
            statusCode: 403,
          });
        }
      } else {
        if (preset.permissionLevel !== 1 && server.ownerId !== operatorId) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '必須是遊客',
            part: 'CREATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
        if (preset.permissionLevel !== 6 && server.ownerId === operatorId) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '必須是群組創建者',
            part: 'CREATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Create member
      await database.set.member(userId, serverId, {
        ...preset,
        createdAt: Date.now(),
      });

      io.to(`server_${serverId}`).emit(
        'serverMemberAdd',
        await database.get.serverMember(serverId, userId),
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `建立成員時發生預期外的錯誤: ${error.message}`,
          part: 'CREATEMEMBER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('Member').error(error.message);
    }
  },
};

export const UpdateMemberHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const {
        userId,
        serverId,
        member: update,
      } = await new DataValidator(UpdateMemberSchema, 'UPDATEMEMBER').validate(
        data,
      );

      const userMember = await database.get.member(userId, serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 3) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限更改其他成員',
            part: 'UPDATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (operatorMember.permissionLevel <= userMember.permissionLevel) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限編輯權限高於自己的成員',
            part: 'UPDATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (userMember.permissionLevel > 5) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '無法更改群組創建者的權限',
            part: 'UPDATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (
          userMember.permissionLevel === 1 &&
          update.permissionLevel &&
          operatorMember.permissionLevel < 5
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限更改遊客的權限',
            part: 'UPDATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (
          update.permissionLevel === 1 &&
          operatorMember.permissionLevel < 5
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限更改會員至遊客',
            part: 'UPDATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (update.nickname && operatorMember.permissionLevel < 5) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限更改其他成員的暱稱',
            part: 'UPDATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (update.permissionLevel >= operatorMember.permissionLevel) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '無法給予高於自己的權限',
            part: 'UPDATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (update.permissionLevel > 5) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '權限等級過高',
            part: 'UPDATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      } else {
        if (update.permissionLevel) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '無法更改自己的權限',
            part: 'UPDATEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Update member
      await database.set.member(userId, serverId, update);

      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        targetSocket.emit('serverUpdate', serverId, update);
      }

      io.to(`server_${serverId}`).emit(
        'serverMemberUpdate',
        userId,
        serverId,
        update,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新成員時發生預期外的錯誤: ${error.message}`,
          part: 'UPDATEMEMBER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('Member').error(error.message);
    }
  },
};

export const DeleteMemberHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { userId, serverId } = await new DataValidator(
        DeleteMemberSchema,
        'DELETEMEMBER',
      ).validate(data);

      const userMember = await database.get.member(userId, serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 3) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限刪除其他成員',
            part: 'DELETEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (operatorMember.permissionLevel <= userMember.permissionLevel) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限刪除權限高於自己的成員',
            part: 'DELETEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (userMember.permissionLevel > 5) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '無法刪除群組創建者',
            part: 'DELETEMEMBER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      } else {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法刪除自己的成員',
          part: 'DELETEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Delete member
      await database.delete.member(userId, serverId);

      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      io.to(`server_${serverId}`).emit('serverMemberDelete', userId, serverId);

      if (targetSocket) {
        targetSocket.emit('serverDelete', serverId); // TODO: Need to kick user from server
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除成員時發生預期外的錯誤: ${error.message}`,
          part: 'DELETEMEMBER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('Member').error(error.message);
    }
  },
};
