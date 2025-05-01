// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';

// Schemas
import {
  CreateMemberApplicationSchema,
  UpdateMemberApplicationSchema,
  DeleteMemberApplicationSchema,
} from '@/api/socket/events/memberApplication/memberApplication.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  CreateMemberApplicationService,
  UpdateMemberApplicationService,
  DeleteMemberApplicationService,
} from '@/api/socket/events/memberApplication/memberApplication.service';

export class CreateMemberApplicationHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, serverId, memberApplication } = await new DataValidator(
        CreateMemberApplicationSchema,
        'CREATEMEMBERAPPLICATION',
      ).validate(data);

      const { memberApplicationAdd } = await new CreateMemberApplicationService(
        operatorId,
        userId,
        serverId,
        memberApplication,
      ).use();

      this.io
        .to(`server_${serverId}`)
        .emit('memberApplicationAdd', memberApplicationAdd);
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

      this.socket.emit('error', error);
      new Logger('MemberApplication').error(error.message);
    }
  }
}

export class UpdateMemberApplicationHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, serverId, memberApplication } = await new DataValidator(
        UpdateMemberApplicationSchema,
        'UPDATEMEMBERAPPLICATION',
      ).validate(data);

      await new UpdateMemberApplicationService(
        operatorId,
        userId,
        serverId,
        memberApplication,
      ).use();

      this.io
        .to(`server_${serverId}`)
        .emit('memberApplicationUpdate', userId, serverId, memberApplication);
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

      this.socket.emit('error', error);
      new Logger('MemberApplication').error(error.message);
    }
  }
}

export class DeleteMemberApplicationHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, serverId } = await new DataValidator(
        DeleteMemberApplicationSchema,
        'DELETEMEMBERAPPLICATION',
      ).validate(data);

      await new DeleteMemberApplicationService(
        operatorId,
        userId,
        serverId,
      ).use();

      this.io
        .to(`server_${serverId}`)
        .emit('memberApplicationDelete', userId, serverId);
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

      this.socket.emit('error', error);
      new Logger('MemberApplication').error(error.message);
    }
  }
}
