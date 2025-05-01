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
import {
  ConnectServerHandler,
  DisconnectServerHandler,
} from '@/api/socket/events/server/server.handler';

export class SearchUserService {
  constructor(private query: string) {
    this.query = query;
  }

  async use() {
    try {
      const result = await Database.get.user(this.query);

      return {
        userSearch: result,
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `搜尋使用者時發生預期外的錯誤: ${error.message}`,
        part: 'SEARCHUSER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class ConnectUserService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    try {
      const actions: any[] = [];
      const user = await Database.get.user(this.userId);

      // Reconnect user to server and channel
      if (user.currentServerId) {
        actions.push({
          handler: (io: Server, socket: Socket) =>
            new ConnectServerHandler(io, socket),
          data: {
            userId: user.userId,
            serverId: user.currentServerId,
          },
        });
      }
      if (user.currentChannelId) {
        actions.push({
          handler: (io: Server, socket: Socket) =>
            new ConnectChannelHandler(io, socket),
          data: {
            userId: user.userId,
            channelId: user.currentChannelId,
            serverId: user.currentServerId,
          },
        });
      }

      await Database.set.user(this.userId, {
        lastActiveAt: Date.now(),
      });

      return {
        userUpdate: user,
        actions,
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `連接使用者時發生預期外的錯誤: ${error.message}`,
        part: 'CONNECTUSER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class DisconnectUserService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const actions: any[] = [];
    const user = await Database.get.user(this.userId);

    // Disconnect user from server and channel
    if (user.currentServerId) {
      actions.push({
        handler: (io: Server, socket: Socket) =>
          new DisconnectServerHandler(io, socket),
        data: {
          userId: user.userId,
          serverId: user.currentServerId,
        },
      });
    }
    if (user.currentChannelId) {
      actions.push({
        handler: (io: Server, socket: Socket) =>
          new DisconnectChannelHandler(io, socket),
        data: {
          userId: user.userId,
          channelId: user.currentChannelId,
          serverId: user.currentServerId,
        },
      });
    }

    await Database.set.user(this.userId, {
      lastActiveAt: Date.now(),
    });

    return {
      userUpdate: null,
      actions,
    };
  }
}

export class UpdateUserService {
  constructor(
    private operatorId: string,
    private userId: string,
    private update: any,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.update = update;
  }

  async use() {
    if (this.operatorId !== this.userId) {
      throw new StandardizedError({
        name: 'ServerError',
        message: '無法更新其他使用者的資料',
        part: 'UPDATEUSER',
        tag: 'PERMISSION_ERROR',
        statusCode: 403,
      });
    }

    await Database.set.user(this.userId, this.update);

    return {
      userUpdate: this.update,
    };
  }
}
