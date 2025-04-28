import { Server, Socket } from 'socket.io';

// Utils
import Logger from '@/utils/logger';

// Error
import StandardizedError from '@/error';

// Validators
import { SearchUserValidator, UpdateUserValidator } from './user.validator';

// Services
import {
  SearchUserService,
  ConnectUserService,
  DisconnectUserService,
  UpdateUserService,
} from './user.service';

// Socket
import SocketServer from '@/api/socket';

export class SearchUserHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle(data: any) {
    try {
      // const operatorId = this.socket.data.userId;

      const { query } = await new SearchUserValidator(data).validate();

      const result = await new SearchUserService(query).use();

      this.socket.emit('userSearch', result.userSearch);
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
      new Logger('User').error(error);
    }
  }
}

export class ConnectUserHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle() {
    try {
      const operatorId = this.socket.data.userId;

      const result = await new ConnectUserService(operatorId).use();

      this.socket.emit('userUpdate', result.userUpdate);

      if (result.actions) {
        for (const action of result.actions) {
          await action(this.io, this.socket);
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
      new Logger('User').error(error);
    }
  }
}

export class DisconnectUserHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle() {
    try {
      const operatorId = this.socket.data.userId;

      const result = await new DisconnectUserService(operatorId).use();

      this.socket.emit('userUpdate', result.userUpdate);

      if (result.actions) {
        for (const action of result.actions) {
          await action(this.io, this.socket);
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
      new Logger('User').error(error);
    }
  }
}

export class UpdateUserHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, user } = await new UpdateUserValidator(data).validate();

      const targetSocket = SocketServer.getSocket(this.io, userId);

      const result = await new UpdateUserService(
        operatorId,
        userId,
        user,
      ).use();

      if (targetSocket) {
        targetSocket.emit('userUpdate', result.userUpdate);
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
      new Logger('User').error(error);
    }
  }
}
