import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Schemas
import {
  ConnectChannelSchema,
  CreateChannelSchema,
  DeleteChannelSchema,
  DisconnectChannelSchema,
  UpdateChannelsSchema,
  UpdateChannelSchema,
} from '@/api/socket/events/channel/channel.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

// Systems
import xpSystem from '@/systems/xp';

export const ConnectChannelHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      let { userId, channelId, serverId, password } =
        await DataValidator.validate(
          ConnectChannelSchema,
          data,
          'CONNECTCHANNEL',
        );

      const user = await database.get.user(userId);
      const server = await database.get.server(serverId);
      const channel = await database.get.channel(channelId);
      const channelUsers = await database.get.channelUsers(channelId);
      const userMember = await database.get.member(userId, serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (
          operatorMember.permissionLevel < 5 ||
          operatorMember.permissionLevel <= userMember.permissionLevel
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限移動其他用戶',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (user.currentServerId !== serverId) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '用戶不在語音群中',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (user.currentChannelId === channelId) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '用戶已經在該頻道中',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      } else {
        if (
          channel.password &&
          password !== channel.password &&
          operatorMember.permissionLevel < 3
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '密碼錯誤',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (
          server.visibility === 'private' &&
          !channel.isLobby &&
          operatorMember.permissionLevel < 2
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你需要成為會員才能加入該頻道',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (
          channel.visibility === 'member' &&
          operatorMember.permissionLevel < 2
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你需要成為會員才能加入該頻道',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (
          channel.userLimit &&
          channelUsers &&
          channelUsers.length >= channel.userLimit &&
          operatorMember.permissionLevel < 5
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '該頻道已達到人數限制',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      if (channel.visibility === 'readonly') {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '該頻道為訊息展示頻道',
          part: 'CONNECTCHANNEL',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Setup user xp interval
      if (!user.currentChannelId) {
        await xpSystem.create(userId);
      }

      // Update user
      const updatedUser = {
        currentChannelId: channelId,
        lastActiveAt: Date.now(),
      };
      await database.set.user(userId, updatedUser);

      // Update Member
      const updatedMember = {
        lastJoinChannelTime: Date.now(),
      };
      await database.set.member(userId, serverId, updatedMember);

      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        const currentChannelId = user.currentChannelId;

        if (currentChannelId) {
          targetSocket.leave(`channel_${currentChannelId}`);
          targetSocket
            .to(`channel_${currentChannelId}`)
            .emit('playSound', 'leave');
          targetSocket.to(`channel_${currentChannelId}`).emit('RTCLeave', {
            from: targetSocket.id,
            userId: userId,
          });
        }

        targetSocket.join(`channel_${channelId}`);
        targetSocket.emit('playSound', 'join');
        targetSocket.emit('userUpdate', updatedUser);
        targetSocket.emit('serverUpdate', serverId, updatedMember);
        targetSocket.to(`channel_${channelId}`).emit('playSound', 'join');
        targetSocket.to(`channel_${channelId}`).emit('RTCJoin', {
          from: targetSocket.id,
          userId: userId,
        });
      }

      io.to(`server_${serverId}`).emit(
        'serverMemberUpdate',
        userId,
        serverId,
        updatedUser,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `連接頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'CONNECTCHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('Channel').error(error.message);
    }
  },
};

export const DisconnectChannelHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { userId, channelId, serverId } = await DataValidator.validate(
        DisconnectChannelSchema,
        data,
        'DISCONNECTCHANNEL',
      );

      const user = await database.get.user(userId);
      const userMember = await database.get.member(userId, serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (
          operatorMember.permissionLevel < 5 ||
          operatorMember.permissionLevel <= userMember.permissionLevel
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限踢除其他用戶',
            part: 'DISCONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (user.currentChannelId !== channelId) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '用戶不在該頻道中',
            part: 'DISCONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }

        if (user.currentServerId !== serverId) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '用戶不在語音群中',
            part: 'DISCONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Clear user xp interval
      await xpSystem.delete(userId);

      // Update user
      const updatedUser = {
        currentChannelId: null,
        lastActiveAt: Date.now(),
      };
      await database.set.user(userId, updatedUser);

      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        targetSocket.leave(`channel_${channelId}`);
        targetSocket.emit('userUpdate', updatedUser);
        targetSocket.emit('playSound', 'leave');
        targetSocket.to(`channel_${channelId}`).emit('playSound', 'leave');
        targetSocket.to(`channel_${channelId}`).emit('RTCLeave', {
          from: targetSocket.id,
          userId: userId,
        });
      }

      io.to(`server_${serverId}`).emit(
        'serverMemberUpdate',
        userId,
        serverId,
        updatedUser,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `離開頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'DISCONNECTCHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('Channel').error(error.message);
    }
  },
};

export const CreateChannelHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { serverId, channel: preset } = await DataValidator.validate(
        CreateChannelSchema,
        data,
        'CREATECHANNEL',
      );

      const category = await database.get.channel(preset.categoryId);
      const serverChannels = await database.get.serverChannels(serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限創建頻道',
          part: 'CREATECHANNEL',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (category && category.categoryId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法在二級頻道下創建頻道',
          part: 'CREATECHANNEL',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (category && !category.categoryId) {
        const channel = {
          type: 'category',
        };
        await UpdateChannelHandler.handle(io, socket, {
          channelId: category.channelId,
          serverId: serverId,
          channel,
        });
      }

      const categoryChannels = serverChannels?.filter(
        (ch) => ch.categoryId === preset.categoryId,
      );

      // Create new channel
      const channelId = uuidv4();
      await database.set.channel(channelId, {
        ...preset,
        serverId: serverId,
        order: (categoryChannels?.length || 0) + 1, // 1 is for lobby (-1 ~ serverChannels.length - 1)
        createdAt: Date.now(),
      });

      io.to(`server_${serverId}`).emit(
        'serverChannelAdd',
        await database.get.channel(channelId),
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `建立頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'CREATECHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('Channel').error(error.message);
    }
  },
};

export const UpdateChannelHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const {
        channelId,
        serverId,
        channel: update,
      } = await DataValidator.validate(
        UpdateChannelSchema,
        data,
        'UPDATECHANNEL',
      );

      const messages: any[] = [];
      const channel = await database.get.channel(channelId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限編輯頻道',
          part: 'UPDATECHANNEL',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (channel.isLobby) {
        if (update.userLimit && update.userLimit !== 0) {
          throw new StandardizedError({
            name: 'ValidationError',
            message: '大廳頻道不能設置人數限制',
            part: 'CHANNEL',
            tag: 'USER_LIMIT_INVALID',
            statusCode: 401,
          });
        }

        if (update.visibility && update.visibility !== 'public') {
          throw new StandardizedError({
            name: 'ValidationError',
            message: '大廳頻道只能設置為公開',
            part: 'CHANNEL',
            tag: 'VISIBILITY_INVALID',
            statusCode: 401,
          });
        }
      }

      if (
        update.voiceMode !== undefined &&
        update.voiceMode !== channel.voiceMode
      ) {
        messages.push({
          serverId: serverId,
          channelId: channelId,
          type: 'info',
          content:
            update.voiceMode === 'free'
              ? 'VOICE_CHANGE_TO_FREE_SPEECH'
              : update.voiceMode === 'forbidden'
              ? 'VOICE_CHANGE_TO_FORBIDDEN_SPEECH'
              : 'VOICE_CHANGE_TO_QUEUE',
          timestamp: Date.now().valueOf(),
        });
      }

      if (
        update.forbidText !== undefined &&
        update.forbidText !== !!channel.forbidText
      ) {
        messages.push({
          serverId: serverId,
          channelId: channelId,
          type: 'info',
          content: update.forbidText
            ? 'TEXT_CHANGE_TO_FORBIDDEN_SPEECH'
            : 'TEXT_CHANGE_TO_FREE_SPEECH',
          timestamp: Date.now().valueOf(),
        });
      }

      if (
        update.forbidGuestText !== undefined &&
        update.forbidGuestText !== !!channel.forbidGuestText
      ) {
        messages.push({
          serverId: serverId,
          channelId: channelId,
          type: 'info',
          content: update.forbidGuestText
            ? 'TEXT_CHANGE_TO_FORBIDDEN_TEXT'
            : 'TEXT_CHANGE_TO_ALLOWED_TEXT',
          timestamp: Date.now().valueOf(),
        });
      }

      if (
        update.forbidGuestUrl !== undefined &&
        update.forbidGuestUrl !== !!channel.forbidGuestUrl
      ) {
        messages.push({
          serverId: serverId,
          channelId: channelId,
          type: 'info',
          content: update.forbidGuestUrl
            ? 'TEXT_CHANGE_TO_FORBIDDEN_URL'
            : 'TEXT_CHANGE_TO_ALLOWED_URL',
          timestamp: Date.now().valueOf(),
        });
      }

      if (
        update.guestTextMaxLength !== undefined &&
        update.guestTextMaxLength !== channel.guestTextMaxLength
      ) {
        messages.push({
          serverId: serverId,
          channelId: channelId,
          type: 'info',
          content: `TEXT_CHANGE_TO_MAX_LENGTH ${update.guestTextMaxLength}`,
          timestamp: Date.now().valueOf(),
        });
      }

      if (
        update.guestTextWaitTime !== undefined &&
        update.guestTextWaitTime !== channel.guestTextWaitTime
      ) {
        messages.push({
          serverId: serverId,
          channelId: channelId,
          type: 'info',
          content: `TEXT_CHANGE_TO_WAIT_TIME ${update.guestTextWaitTime}`,
          timestamp: Date.now().valueOf(),
        });
      }

      if (
        update.guestTextGapTime !== undefined &&
        update.guestTextGapTime !== channel.guestTextGapTime
      ) {
        messages.push({
          serverId: serverId,
          channelId: channelId,
          type: 'info',
          content: `TEXT_CHANGE_TO_GAP_TIME ${update.guestTextGapTime}`,
          timestamp: Date.now().valueOf(),
        });
      }

      // Update channel
      await database.set.channel(channelId, update);

      if (messages.length > 0) {
        io.to(`channel_${channelId}`).emit('onMessage', ...messages);
      }
      io.to(`server_${serverId}`).emit(
        'serverChannelUpdate',
        channelId,
        update,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATECHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('Channel').error(error.message);
    }
  },
};

export const UpdateChannelsHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const { serverId, channels } = await DataValidator.validate(
        UpdateChannelsSchema,
        data,
        'UPDATECHANNELS',
      );

      for (const channel of channels) {
        await UpdateChannelHandler.handle(io, socket, {
          serverId,
          channelId: channel.channelId,
          channel: channel,
        });

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATECHANNELS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('Channel').error(error.message);
    }
  },
};

export const DeleteChannelHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { channelId, serverId } = await DataValidator.validate(
        DeleteChannelSchema,
        data,
        'DELETECHANNEL',
      );

      const channel = await database.get.channel(channelId);
      const channelUsers = await database.get.channelUsers(channelId);
      const serverChannels = await database.get.serverChannels(serverId);
      const server = await database.get.server(serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限刪除頻道',
          part: 'DELETECHANNEL',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      const channelChildren = serverChannels?.filter(
        (ch) => ch.categoryId === channelId,
      );
      const categoryChildren = serverChannels?.filter(
        (ch) => ch.categoryId === channel.categoryId,
      );

      if (categoryChildren && categoryChildren.length <= 1) {
        const categoryUpdate = {
          type: 'channel',
        };
        await UpdateChannelHandler.handle(io, socket, {
          channelId: channel.categoryId,
          serverId: serverId,
          channel: categoryUpdate,
        });
      }

      if (channelChildren) {
        for (const child of channelChildren) {
          await DeleteChannelHandler.handle(io, socket, {
            serverId: serverId,
            channelId: child.channelId,
          });

          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      if (channelUsers) {
        for (const user of channelUsers) {
          await ConnectChannelHandler.handle(io, socket, {
            channelId: server.lobbyId,
            serverId: serverId,
            userId: user.userId,
          });

          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Delete channel
      await database.delete.channel(channelId);

      io.to(`server_${serverId}`).emit('serverChannelDelete', channelId);
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'DELETECHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
      new Logger('Channel').error(error.message);
    }
  },
};
