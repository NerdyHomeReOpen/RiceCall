// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import { SocketHandler } from '@/api/socket';

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

export class CreateMemberHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, serverId, member } = await new DataValidator(
        CreateMemberSchema,
        'CREATEMEMBER',
      ).validate(data);

      const targetSocket = this.io.sockets.sockets.get(userId);

      const result = await new CreateMemberService(
        operatorId,
        userId,
        serverId,
        member,
      ).use();

      this.io
        .to(`server_${serverId}`)
        .emit('serverMembersUpdate', result.serverMembersUpdate);

      if (targetSocket && targetSocket.rooms.has(`server_${serverId}`)) {
        targetSocket.emit('memberUpdate', result.memberUpdate);
      }
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
      new Logger('Member').error(error);
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

      const targetSocket = this.io.sockets.sockets.get(userId);

      const result = await new UpdateMemberService(
        operatorId,
        userId,
        serverId,
        member,
      ).use();

      this.io
        .to(`server_${serverId}`)
        .emit('serverMembersUpdate', result.serverMembersUpdate);

      if (targetSocket && targetSocket.rooms.has(`server_${serverId}`)) {
        targetSocket.emit('memberUpdate', result.memberUpdate);
      }
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
      new Logger('Member').error(error);
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

      const targetSocket = this.io.sockets.sockets.get(userId);

      const result = await new DeleteMemberService(
        operatorId,
        userId,
        serverId,
      ).use();

      this.io
        .to(`server_${serverId}`)
        .emit('serverMembersUpdate', result.serverMembersUpdate);

      if (targetSocket && targetSocket.rooms.has(`server_${serverId}`)) {
        targetSocket.emit('memberUpdate', result.memberUpdate);
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
      new Logger('Member').error(error);
    }
  }
}
