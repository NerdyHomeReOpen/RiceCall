// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import { SocketHandler } from '@/api/socket';

// Schemas
import {
  CreateFriendGroupSchema,
  UpdateFriendGroupSchema,
  DeleteFriendGroupSchema,
} from '@/api/socket/events/friendGroup/friendGroup.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  CreateFriendGroupService,
  UpdateFriendGroupService,
  DeleteFriendGroupService,
} from '@/api/socket/events/friendGroup/friendGroup.service';

export class CreateFriendGroupHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, group } = await new DataValidator(
        CreateFriendGroupSchema,
        'CREATEFRIENDGROUP',
      ).validate(data);

      const result = await new CreateFriendGroupService(
        operatorId,
        userId,
        group,
      ).use();

      this.socket.emit('friendGroupsUpdate', result.friendGroupsUpdate);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `新增好友群組時發生無法預期的錯誤: ${error.message}`,
          part: 'CREATEFRIENDGROUP',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('FriendGroup').error(error);
    }
  }
}

export class UpdateFriendGroupHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, friendGroupId, group } = await new DataValidator(
        UpdateFriendGroupSchema,
        'UPDATEFRIENDGROUP',
      ).validate(data);

      const result = await new UpdateFriendGroupService(
        operatorId,
        userId,
        friendGroupId,
        group,
      ).use();

      this.socket.emit('friendGroupsUpdate', result.friendGroupsUpdate);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新好友群組時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATEFRIENDGROUP',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('FriendGroup').error(error);
    }
  }
}

export class DeleteFriendGroupHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, friendGroupId } = await new DataValidator(
        DeleteFriendGroupSchema,
        'DELETEFRIENDGROUP',
      ).validate(data);

      const result = await new DeleteFriendGroupService(
        operatorId,
        userId,
        friendGroupId,
      ).use();

      this.socket.emit('friendGroupsUpdate', result.friendGroupsUpdate);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除好友群組時發生無法預期的錯誤: ${error.message}`,
          part: 'DELETEFRIENDGROUP',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('FriendGroup').error(error);
    }
  }
}
