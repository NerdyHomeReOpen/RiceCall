// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

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

// Socket
import SocketServer from '@/api/socket';

export class SearchServerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      // const operatorId = this.socket.data.userId;

      const { query } = await new DataValidator(
        SearchServerSchema,
        'SEARCHSERVER',
      ).validate(data);

      const { serverSearch } = await new SearchServerService(query).use();

      this.socket.emit('serverSearch', serverSearch);
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
      new Logger('User').error(error.message);
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

      const targetSocket = SocketServer.getSocket(userId);

      const {
        openPopup,
        serversUpdate,
        channelsUpdate,
        membersUpdate,
        actions,
      } = await new ConnectServerService(operatorId, userId, serverId).use();

      if (openPopup) {
        this.socket.emit('openPopup', openPopup);
        return;
      }

      if (targetSocket) {
        targetSocket.join(`server_${serverId}`);
        targetSocket.emit('serversUpdate', serversUpdate);
        targetSocket.emit('channelsUpdate', channelsUpdate);
        targetSocket.emit('membersUpdate', membersUpdate);
      }

      if (actions.length > 0) {
        for (const action of actions) {
          await action.handler(this.io, this.socket).handle(action.data);
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
      new Logger('User').error(error.message);
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

      const targetSocket = SocketServer.getSocket(userId);

      const { actions } = await new DisconnectServerService(
        operatorId,
        userId,
        serverId,
      ).use();

      if (targetSocket) {
        targetSocket.leave(`server_${serverId}`);
        targetSocket.emit('channelsUpdate', []);
        targetSocket.emit('membersUpdate', []);
      }

      if (actions.length > 0) {
        for (const action of actions) {
          await action.handler(this.io, this.socket).handle(action.data);
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
      new Logger('User').error(error.message);
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

      const { actions } = await new CreateServerService(
        operatorId,
        server,
      ).use();

      if (actions.length > 0) {
        for (const action of actions) {
          await action.handler(this.io, this.socket).handle(action.data);
        }
      }
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
      new Logger('User').error(error.message);
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

      await new UpdateServerService(operatorId, serverId, server).use();

      this.io.to(`server_${serverId}`).emit('serverUpdate', server);
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
      new Logger('User').error(error.message);
    }
  }
}
