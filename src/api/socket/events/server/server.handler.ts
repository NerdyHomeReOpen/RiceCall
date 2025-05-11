import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';
import { generateUniqueDisplayId } from '@/utils';

// Socket
import SocketServer from '@/api/socket';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';
import { ConnectChannelHandler } from '@/api/socket/events/channel/channel.handler';
import { DisconnectChannelHandler } from '@/api/socket/events/channel/channel.handler';

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

// Database
import { database } from '@/index';

export class SearchServerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      // const operatorId = this.socket.data.userId;

      const { query } = await new DataValidator(
        SearchServerSchema,
        'SEARCHSERVER',
      ).validate(data);

      const result = await database.get.searchServer(query);

      this.socket.emit('serverSearch', result);
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

      const user = await database.get.user(userId);
      const server = await database.get.server(serverId);
      const userMember = await database.get.member(userId, serverId);

      // Create new membership if there isn't one
      if (!userMember) {
        await database.set.member(userId, serverId, {
          permissionLevel: 1,
        });
      }

      if (operatorId !== userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法移動其他用戶的群組',
          part: 'CONNECTSERVER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      } else {
        if (
          server.visibility === 'invisible' &&
          (!userMember || userMember.permissionLevel < 2)
        ) {
          this.socket.emit('openPopup', {
            type: 'applyMember',
            id: 'applyMember',
            initialData: {
              serverId: serverId,
              userId: userId,
            },
          });
          return;
        }
        if (
          userMember &&
          (userMember.isBlocked > Date.now() || userMember.isBlocked === -1)
        ) {
          this.socket.emit('openPopup', {
            type: 'dialogError',
            id: 'errorDialog',
            initialData: {
              title:
                userMember.isBlocked === -1
                  ? '你已被該語音群封鎖，無法加入群組'
                  : '你已被該語音群踢出，無法加入群組，直到：' +
                    new Date(userMember.isBlocked).toLocaleString(),
            },
          });
          return;
        }
      }

      // Update user-server
      await database.set.userServer(userId, serverId, {
        recent: true,
        timestamp: Date.now(),
      });

      // Join lobby
      await new ConnectChannelHandler(this.io, this.socket).handle({
        channelId: server.receptionLobbyId || server.lobbyId,
        serverId: serverId,
        userId: userId,
      });

      const targetSocket =
        operatorId === userId ? this.socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        if (user.currentServerId) {
          targetSocket.leave(`server_${user.currentServerId}`);
        }

        targetSocket.join(`server_${serverId}`);
        targetSocket.emit(
          'serversUpdate',
          await database.get.userServers(userId),
        );
        targetSocket.emit(
          'serverChannelsUpdate',
          await database.get.serverChannels(serverId),
        );
        targetSocket.emit(
          'serverMembersUpdate',
          await database.get.serverMembers(serverId),
        );
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
      new Logger('Server').error(error.message);
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

      const user = await database.get.user(userId);
      const userMember = await database.get.member(userId, serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (serverId !== user.currentServerId) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '無法踢出不在該群組的用戶',
            part: 'DISCONNECTSERVER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限踢出其他用戶',
            part: 'DISCONNECTSERVER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
        if (operatorMember.permissionLevel <= userMember.permissionLevel) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限踢出該用戶',
            part: 'DISCONNECTSERVER',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Leave current channel
      if (user.currentChannelId) {
        await new DisconnectChannelHandler(this.io, this.socket).handle({
          userId: userId,
          channelId: user.currentChannelId,
          serverId: user.currentServerId,
        });
      }

      const targetSocket =
        operatorId === userId ? this.socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        targetSocket.leave(`server_${serverId}`);
        targetSocket.emit('serverChannelsUpdate', []);
        targetSocket.emit('serverMembersUpdate', []);
        if (operatorId !== userId) {
          targetSocket.emit('openPopup', {
            type: 'dialogAlert',
            id: 'kick',
            initialData: {
              title: '你已被踢出群組',
              submitTo: 'kick',
            },
          });
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
      new Logger('Server').error(error.message);
    }
  }
}

export class CreateServerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { server: preset } = await new DataValidator(
        CreateServerSchema,
        'CREATESERVER',
      ).validate(data);

      const operator = await database.get.user(operatorId);
      const operatorServers = await database.get.userServers(operatorId);

      if (
        operatorServers &&
        operatorServers.filter((s: any) => s.owned).length >=
          Math.min(3 + operator.level / 5, 10)
      ) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '可擁有群組數量已達上限',
          part: 'CREATESERVER',
          tag: 'LIMIT_REACHED',
          statusCode: 403,
        });
      }

      // Create server
      const serverId = uuidv4();
      const displayId = await generateUniqueDisplayId();
      await database.set.server(serverId, {
        ...preset,
        displayId,
        ownerId: operatorId,
        createdAt: Date.now(),
      });

      // Create channel (lobby)
      const lobbyId = uuidv4();
      await database.set.channel(lobbyId, {
        name: '大廳',
        isLobby: true,
        serverId,
        createdAt: Date.now(),
      });

      // Create member
      await database.set.member(operatorId, serverId, {
        permissionLevel: 6,
        createdAt: Date.now(),
      });

      // Create user-server
      await database.set.userServer(operatorId, serverId, {
        owned: true,
      });

      // Update Server (lobby)
      await database.set.server(serverId, {
        lobbyId,
        receptionLobbyId: lobbyId,
      });

      // Join the server
      await new ConnectServerHandler(this.io, this.socket).handle({
        userId: operatorId,
        serverId: serverId,
      });
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
      new Logger('Server').error(error.message);
    }
  }
}

export class UpdateServerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { serverId, server: update } = await new DataValidator(
        UpdateServerSchema,
        'UPDATESERVER',
      ).validate(data);

      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限更新該群組',
          part: 'UPDATESERVER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Update server
      await database.set.server(serverId, update);

      this.io.to(`server_${serverId}`).emit('serverUpdate', serverId, update);
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
      new Logger('Server').error(error.message);
    }
  }
}
