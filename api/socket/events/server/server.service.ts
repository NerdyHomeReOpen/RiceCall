import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

// Handlers
import {
  ConnectChannelHandler,
  DisconnectChannelHandler,
} from '@/api/socket/events/channel/channel.handler';

export class SearchServerService {
  constructor(private query: string) {
    this.query = query;
  }

  async use() {
    try {
      const result = await Database.get.server(this.query);

      return {
        serverSearch: result,
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `搜尋群組時發生預期外的錯誤: ${error.message}`,
        part: 'SEARCHSERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class CreateServerService {
  constructor(private operatorId: string, private server: any) {
    this.operatorId = operatorId;
    this.server = server;
  }

  async use() {
    try {
      const operator = await Database.get.user(this.operatorId);
      const operatorServers = await Database.get.userServers(this.operatorId);

      if (
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
      const displayId = await Func.generateUniqueDisplayId();
      await Database.set.server(serverId, {
        ...this.server,
        displayId,
        ownerId: this.operatorId,
        createdAt: Date.now(),
      });

      // Create channel (lobby)
      const lobbyId = uuidv4();
      await Database.set.channel(lobbyId, {
        name: '大廳',
        isLobby: true,
      });

      // Create member
      await Database.set.member(this.operatorId, serverId, {
        permissionLevel: 6,
        createdAt: Date.now(),
      });

      // Create user-server
      await Database.set.userServer(this.operatorId, serverId, {
        owned: true,
      });

      // Update Server (lobby)
      await Database.set.server(serverId, {
        lobbyId,
      });

      // Join the server
      await new ConnectServerService(
        this.operatorId,
        this.operatorId,
        serverId,
      ).use();

      return;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `建立群組時發生預期外的錯誤: ${error.message}`,
        part: 'CREATESERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class UpdateServerService {
  constructor(
    private operatorId: string,
    private serverId: string,
    private update: any,
  ) {
    this.operatorId = operatorId;
    this.serverId = serverId;
    this.update = update;
  }

  async use() {
    try {
      const operatorMember = await Database.get.member(
        this.operatorId,
        this.serverId,
      );

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
      await Database.set.server(this.serverId, this.update);

      return {
        serverUpdate: this.update,
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `更新群組時發生預期外的錯誤: ${error.message}`,
        part: 'UPDATESERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class ConnectServerService {
  constructor(
    private operatorId: string,
    private userId: string,
    private serverId: string,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.serverId = serverId;
  }

  async use() {
    try {
      const actions: any[] = [];
      const user = await Database.get.user(this.userId);
      const server = await Database.get.server(this.serverId);
      const operatorMember = await Database.get.member(
        this.operatorId,
        this.serverId,
      );

      if (this.operatorId !== this.userId) {
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
          (!operatorMember || operatorMember.permissionLevel < 2)
        ) {
          return {
            openPopup: {
              type: 'applyMember',
              initialData: {
                serverId: this.serverId,
                userId: this.userId,
              },
            },
          };
        }
      }

      // Leave prev server
      if (user.currentServerId) {
        await new DisconnectServerService(
          this.operatorId,
          this.userId,
          user.currentServerId,
        ).use();
      }

      // Create new membership if there isn't one
      if (!operatorMember) {
        await Database.set.member(this.userId, this.serverId, {
          permissionLevel: 1,
        });
      }

      // Update user-server
      await Database.set.userServer(this.userId, this.serverId, {
        recent: true,
        timestamp: Date.now(),
      });

      // Update user
      const updatedUser = {
        currentServerId: this.serverId,
        lastActiveAt: Date.now(),
      };
      await Database.set.user(this.userId, updatedUser);

      // Connect to the server's lobby channel
      actions.push(async (io: Server, socket: Socket) => {
        await new ConnectChannelHandler(io, socket).handle({
          userId: this.userId,
          channelId: server.lobbyId,
          serverId: this.serverId,
        });
      });

      return {
        userUpdate: updatedUser,
        serverUpdate: await Database.get.server(this.serverId),
        memberUpdate: await Database.get.member(this.userId, this.serverId),
        userServersUpdate: await Database.get.userServers(this.userId),
        serverChannelsUpdate: await Database.get.serverChannels(this.serverId),
        actions,
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `連接群組時發生預期外的錯誤: ${error.message}`,
        part: 'CONNECTSERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class DisconnectServerService {
  constructor(
    private operatorId: string,
    private userId: string,
    private serverId: string,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.serverId = serverId;
  }

  async use() {
    try {
      const actions: any[] = [];
      const user = await Database.get.user(this.userId);
      const userMember = await Database.get.member(this.userId, this.serverId);
      const operatorMember = await Database.get.member(
        this.operatorId,
        this.serverId,
      );

      if (this.operatorId !== this.userId) {
        if (this.serverId !== user.currentServerId) {
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

      // Leave prev channel
      if (user.currentChannelId) {
        actions.push(async (io: Server, socket: Socket) => {
          await new DisconnectChannelHandler(io, socket).handle({
            userId: this.userId,
            channelId: user.currentChannelId,
            serverId: user.currentServerId,
          });
        });
      }

      // Update user
      const updatedUser = {
        currentServerId: null,
        lastActiveAt: Date.now(),
      };
      await Database.set.user(this.userId, updatedUser);

      return {
        userUpdate: updatedUser,
        serverUpdate: null,
        memberUpdate: null,
        serverChannelsUpdate: [],
        actions,
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `斷開群組時發生預期外的錯誤: ${error.message}`,
        part: 'DISCONNECTSERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
