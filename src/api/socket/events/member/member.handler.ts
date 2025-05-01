// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';

// Schemas
import {
  CreateMemberSchema,
  UpdateMemberSchema,
  DeleteMemberSchema,
} from '@/api/socket/events/member/member.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  CreateMemberService,
  UpdateMemberService,
  DeleteMemberService,
} from '@/api/socket/events/member/member.service';

// Socket
import SocketServer from '@/api/socket';

export class CreateMemberHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, serverId, member } = await new DataValidator(
        CreateMemberSchema,
        'CREATEMEMBER',
      ).validate(data);

      const targetSocket = SocketServer.getSocket(userId);

      const { serverUpdate, memberAdd } = await new CreateMemberService(
        operatorId,
        userId,
        serverId,
        member,
      ).use();

      if (targetSocket && targetSocket.rooms.has(`server_${serverId}`)) {
        targetSocket.emit('serverUpdate', serverUpdate);
      }

      this.io.to(`server_${serverId}`).emit('memberAdd', memberAdd);
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

      this.socket.emit('error', error);
      new Logger('Member').error(error.message);
    }
  }
}

export class UpdateMemberHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { member, userId, serverId } = await new DataValidator(
        UpdateMemberSchema,
        'UPDATEMEMBER',
      ).validate(data);

      const targetSocket = SocketServer.getSocket(userId);

      await new UpdateMemberService(operatorId, userId, serverId, member).use();

      if (targetSocket && targetSocket.rooms.has(`server_${serverId}`)) {
        targetSocket.emit('serverUpdate', member);
      }

      this.io
        .to(`server_${serverId}`)
        .emit('memberUpdate', userId, serverId, member);
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

      this.socket.emit('error', error);
      new Logger('Member').error(error.message);
    }
  }
}

export class DeleteMemberHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, serverId } = await new DataValidator(
        DeleteMemberSchema,
        'DELETEMEMBER',
      ).validate(data);

      const targetSocket = SocketServer.getSocket(userId);

      await new DeleteMemberService(operatorId, userId, serverId).use();

      this.io.to(`server_${serverId}`).emit('memberDelete', userId, serverId);

      if (targetSocket && targetSocket.rooms.has(`server_${serverId}`)) {
        targetSocket.emit('serverUpdate', {}); // TODO: Need to kick user from server
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

      this.socket.emit('error', error);
      new Logger('Member').error(error.message);
    }
  }
}
