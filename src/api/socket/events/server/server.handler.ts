import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';
import { generateUniqueDisplayId } from '@/utils';

// Socket
import SocketServer from '@/api/socket';

// Handler
import { ConnectChannelHandler } from '@/api/socket/events/channel/channel.handler';
import { DisconnectChannelHandler } from '@/api/socket/events/channel/channel.handler';
import { CreateMemberHandler } from '@/api/socket/events/member/member.handler';

// Schemas
import {
  SearchServerSchema,
  CreateServerSchema,
  UpdateServerSchema,
  ConnectServerSchema,
  DisconnectServerSchema,
} from '@/api/socket/events/server/server.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const SearchServerHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      const { query } = await DataValidator.validate(
        SearchServerSchema,
        data,
        'SEARCHSERVER',
      );

      /* ========== Start of Main Logic ========== */

      const result = await database.get.searchServer(query);

      socket.emit('serverSearch', result);

      /* ========== End of Handling ========== */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `搜尋群組時發生無法預期的錯誤，請稍後再試`,
          part: 'SEARCHSERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('SearchServer').error(error.message);
    }
  },
};

export const ConnectServerHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, serverId } = await DataValidator.validate(
        ConnectServerSchema,
        data,
        'CONNECTSERVER',
      );

      const user = await database.get.user(userId);
      const server = await database.get.server(serverId);
      const userMember = await database.get.member(userId, serverId);

      // Create new membership if there isn't one
      if (!userMember) {
        await CreateMemberHandler.handle(io, socket, {
          userId,
          serverId,
          member: {
            permissionLevel: 1,
            createdAt: Date.now(),
          },
        });
      }

      if (operatorId !== userId) {
        reason = "Cannot move other user's server";
      } else {
        if (
          server.visibility === 'invisible' &&
          (!userMember || userMember.permissionLevel < 2)
        ) {
          socket.emit('openPopup', {
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
          socket.emit('openPopup', {
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

      if (reason) {
        new Logger('ConnectServer').warn(
          `User(${operatorId}) failed to connect to server(${serverId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Pre Main Logic ========== */

      // Join lobby
      if (server.receptionLobbyId) {
        if (
          server.visibility === 'private' &&
          userMember &&
          userMember.permissionLevel < 2
        ) {
          await ConnectChannelHandler.handle(io, socket, {
            channelId: server.lobbyId,
            serverId: serverId,
            userId: userId,
          });
        }

        await ConnectChannelHandler.handle(io, socket, {
          channelId: server.receptionLobbyId,
          serverId: serverId,
          userId: userId,
        });
      } else {
        await ConnectChannelHandler.handle(io, socket, {
          channelId: server.lobbyId,
          serverId: serverId,
          userId: userId,
        });
      }

      /* ========== Start of Main Logic ========== */

      // Update user-server
      const serverUpdate = {
        recent: true,
        timestamp: Date.now(),
      };
      await database.set.userServer(userId, serverId, serverUpdate);

      // Update user
      const userUpdate = {
        currentServerId: serverId,
      };
      await database.set.user(userId, userUpdate);

      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        const currentServerId = user.currentServerId;

        if (currentServerId) {
          targetSocket.leave(`server_${currentServerId}`);
          targetSocket
            .to(`server_${currentServerId}`)
            .emit('serverOnlineMemberDelete', userId, currentServerId);
        }

        targetSocket.join(`server_${serverId}`);
        targetSocket.emit('serverUpdate', serverId, serverUpdate);
        targetSocket.emit(
          'serverChannelsSet',
          await database.get.serverChannels(serverId),
        );
        targetSocket.emit(
          'serverOnlineMembersSet',
          await database.get.serverOnlineMembers(serverId),
        );
        targetSocket.emit('userUpdate', userUpdate);
        targetSocket
          .to(`server_${serverId}`)
          .emit(
            'serverOnlineMemberAdd',
            await database.get.serverMember(serverId, userId),
          );
      }

      /* ========== End of Handling ========== */

      new Logger('ConnectServer').info(
        `User(${operatorId}) connected to server(${serverId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `連接群組時發生無法預期的錯誤，請稍後再試`,
          part: 'CONNECTSERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('ConnectServer').error(error.message);
    }
  },
};

export const DisconnectServerHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, serverId } = await DataValidator.validate(
        DisconnectServerSchema,
        data,
        'DISCONNECTSERVER',
      );

      const user = await database.get.user(userId);
      const userMember = await database.get.member(userId, serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 5) {
          reason = 'Not enough permission';
        }

        if (operatorMember.permissionLevel <= userMember.permissionLevel) {
          reason = 'Target has higher or equal permission';
        }

        if (serverId !== user.currentServerId) {
          reason = 'Target not in the server';
        }
      }

      if (reason) {
        new Logger('DisconnectServer').warn(
          `User(${operatorId}) failed to disconnect from server(${serverId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Pre Main Logic ========== */

      // Leave current channel
      if (user.currentChannelId) {
        await DisconnectChannelHandler.handle(io, socket, {
          userId: userId,
          channelId: user.currentChannelId,
          serverId: user.currentServerId,
        });
      }

      /* ========== Start of Main Logic ========== */

      // Update user
      const userUpdate = {
        currentServerId: null,
      };
      await database.set.user(userId, userUpdate);

      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        targetSocket.leave(`server_${serverId}`);
        targetSocket.emit('serverChannelsSet', []);
        targetSocket.emit('serverOnlineMembersSet', []);
        targetSocket.emit('userUpdate', userUpdate);
        targetSocket
          .to(`server_${serverId}`)
          .emit('serverOnlineMemberDelete', userId, serverId);

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

      /* ========== End of Handling ========== */

      new Logger('DisconnectServer').info(
        `User(${operatorId}) disconnected from server(${serverId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `斷開群組時發生無法預期的錯誤，請稍後再試`,
          part: 'DISCONNECTSERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('DisconnectServer').error(error.message);
    }
  },
};

export const CreateServerHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { server: preset } = await DataValidator.validate(
        CreateServerSchema,
        data,
        'CREATESERVER',
      );

      const operator = await database.get.user(operatorId);
      const operatorServers = await database.get.userServers(operatorId);

      if (
        operatorServers &&
        operatorServers.filter((s: any) => s.owned).length >=
          Math.min(3 + operator.level / 5, 10)
      )
        reason = 'Server limit reached';

      if (reason) {
        new Logger('CreateServer').warn(
          `User(${operatorId}) failed to create server: ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

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
      await ConnectServerHandler.handle(io, socket, {
        userId: operatorId,
        serverId: serverId,
      });

      /* ========== End of Handling ========== */

      new Logger('CreateServer').info(
        `User(${operatorId}) created server(${serverId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `建立群組時發生無法預期的錯誤，請稍後再試`,
          part: 'CREATESERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('CreateServer').error(error.message);
    }
  },
};

export const UpdateServerHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { serverId, server: update } = await DataValidator.validate(
        UpdateServerSchema,
        data,
        'UPDATESERVER',
      );

      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorMember.permissionLevel < 5) {
        reason = 'Not enough permission';
      }

      if (reason) {
        new Logger('UpdateServer').warn(
          `User(${operatorId}) failed to update server(${serverId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Update server
      await database.set.server(serverId, update);

      // Send socket event
      io.to(`server_${serverId}`).emit('serverUpdate', serverId, update);

      /* ========== End of Handling ========== */

      new Logger('UpdateServer').info(
        `User(${operatorId}) updated server(${serverId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新群組時發生無法預期的錯誤，請稍後再試`,
          part: 'UPDATESERVER',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);

      new Logger('UpdateServer').error(error.message);
    }
  },
};
