// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';

// Schemas
import {
  SearchServerSchema,
  CreateServerSchema,
  UpdateServerSchema,
  ConnectServerSchema,
  DisconnectServerSchema,
} from '@/api/socket/events/server/server.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  SearchServerService,
  CreateServerService,
  UpdateServerService,
  ConnectServerService,
  DisconnectServerService,
} from '@/api/socket/events/server/server.service';

export class SearchServerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      // const operatorId = this.socket.data.userId;

      const { query } = await new DataValidator(
        SearchServerSchema,
        'SEARCHSERVER',
      ).validate(data);

      const result = await new SearchServerService(query).use();

      this.socket.emit('serverSearch', result.serverSearch);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `搜尋群組時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('User').error(error);
    }
  }
}

export class ConnectServerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, serverId } = await new DataValidator(
        ConnectServerSchema,
        'CONNECTSERVER',
      ).validate(data);

      const targetSocket = SocketServer.getSocket(this.io, userId);

      const result = await new ConnectServerService(
        operatorId,
        userId,
        serverId,
      ).use();

      if (targetSocket) {
        targetSocket.join(`server_${serverId}`);
        targetSocket.emit('userUpdate', result.userUpdate);
        targetSocket.emit('serverUpdate', result.serverUpdate);
        targetSocket.emit('memberUpdate', result.memberUpdate);
        targetSocket.emit('userServersUpdate', result.userServersUpdate);
        targetSocket.emit('serverChannelsUpdate', result.serverChannelsUpdate);
      }

      if (result.actions) {
        for (const action of result.actions) {
          await action(this.io, this.socket);
        }
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `連接群組時發生無法預期的錯誤: ${error.message}`,
          part: 'CONNECTSERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('User').error(error);
    }
  }
}

export class DisconnectServerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, serverId } = await new DataValidator(
        DisconnectServerSchema,
        'DISCONNECTSERVER',
      ).validate(data);

      const targetSocket = SocketServer.getSocket(this.io, userId);

      const result = await new DisconnectServerService(
        operatorId,
        userId,
        serverId,
      ).use();

      if (targetSocket) {
        targetSocket.leave(`server_${serverId}`);
        targetSocket.emit('userUpdate', result.userUpdate);
        targetSocket.emit('serverUpdate', result.serverUpdate);
        targetSocket.emit('memberUpdate', result.memberUpdate);
        targetSocket.emit('serverChannelsUpdate', result.serverChannelsUpdate);
      }

      if (result.actions) {
        for (const action of result.actions) {
          await action(this.io, this.socket);
        }
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `斷開群組時發生無法預期的錯誤: ${error.message}`,
          part: 'DISCONNECTSERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('User').error(error);
    }
  }
}

export class CreateServerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { server } = await new DataValidator(
        CreateServerSchema,
        'CREATESERVER',
      ).validate(data);

      await new CreateServerService(operatorId, server).use();
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `建立群組時發生無法預期的錯誤: ${error.message}`,
          part: 'CREATESERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('User').error(error);
    }
  }
}

export class UpdateServerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { serverId, server } = await new DataValidator(
        UpdateServerSchema,
        'UPDATESERVER',
      ).validate(data);

      const result = await new UpdateServerService(
        operatorId,
        serverId,
        server,
      ).use();

      this.io
        .to(`server-${serverId}`)
        .emit('serverUpdate', result.serverUpdate);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新群組時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATESERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('User').error(error);
    }
  }
}
