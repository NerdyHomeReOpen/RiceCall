// Utils
import Logger from '@/utils/logger';

// Error
import StandardizedError from '@/error';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';

// Schemas
import {
  SearchUserSchema,
  UpdateUserSchema,
} from '@/api/socket/events/user/user.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  SearchUserService,
  ConnectUserService,
  DisconnectUserService,
  UpdateUserService,
} from '@/api/socket/events/user/user.service';

// Socket
import SocketServer from '@/api/socket';

export class SearchUserHandler extends SocketHandler {
  async handle(data: any) {
    try {
      // const operatorId = this.socket.data.userId;

      const { query } = await new DataValidator(
        SearchUserSchema,
        'SEARCHUSER',
      ).validate(data);

      const { userSearch } = await new SearchUserService(query).use();

      this.socket.emit('userSearch', userSearch);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `搜尋使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('User').error(error.message);
    }
  }
}

export class ConnectUserHandler extends SocketHandler {
  async handle() {
    try {
      const operatorId = this.socket.data.userId;

      const { userUpdate, actions } = await new ConnectUserService(
        operatorId,
      ).use();

      this.socket.emit('userUpdate', userUpdate);

      if (actions.length > 0) {
        for (const action of actions) {
          await action.handler(this.io, this.socket).handle(action.data);
        }
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `連接使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'CONNECTUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('User').error(error.message);
    }
  }
}

export class DisconnectUserHandler extends SocketHandler {
  async handle() {
    try {
      const operatorId = this.socket.data.userId;

      const { userUpdate, actions } = await new DisconnectUserService(
        operatorId,
      ).use();

      this.socket.emit('userUpdate', userUpdate);

      if (actions.length > 0) {
        for (const action of actions) {
          await action.handler(this.io, this.socket).handle(action.data);
        }
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `斷開使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'DISCONNECTUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('User').error(error.message);
    }
  }
}

export class UpdateUserHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, user } = await new DataValidator(
        UpdateUserSchema,
        'UPDATEUSER',
      ).validate(data);

      const targetSocket = SocketServer.getSocket(userId);

      const { userUpdate } = await new UpdateUserService(
        operatorId,
        userId,
        user,
      ).use();

      if (targetSocket) {
        targetSocket.emit('userUpdate', userUpdate);
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATEUSER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('User').error(error.message);
    }
  }
}
