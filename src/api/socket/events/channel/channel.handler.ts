import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';
import { SocketRequestHandler } from '@/handler';

// Database
import { database } from '@/index';

// Systems
import xpSystem from '@/systems/xp';

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

export const ConnectChannelHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, channelId, serverId, password } =
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
        if (operatorMember.permissionLevel < 5)
          reason = 'Not enough permission';

        if (operatorMember.permissionLevel <= userMember.permissionLevel)
          reason = 'Permission lower than the target';

        if (user.currentServerId !== serverId)
          reason = 'Target is not in the server';

        if (user.currentChannelId === channelId)
          reason = 'Target is already in the channel';
      } else {
        if (
          channel.password &&
          password !== channel.password &&
          operatorMember.permissionLevel < 3
        )
          reason = 'Wrong password';

        if (
          !channel.isLobby &&
          server.visibility === 'private' &&
          operatorMember.permissionLevel < 2
        )
          reason = 'Blocked by server visibility';

        if (
          channel.visibility === 'member' &&
          operatorMember.permissionLevel < 2
        )
          reason = 'Blocked by channel visibility';

        if (
          channel.userLimit &&
          channelUsers &&
          channelUsers.length >= channel.userLimit &&
          operatorMember.permissionLevel < 5
        )
          reason = 'Channel is full';

        if (channel.visibility === 'readonly') reason = 'Read-only channel';
      }

      if (reason) {
        new Logger('ConnectChannel').warn(
          `User(${userId}) failed to connect to channel(${channelId}) (Operator: ${operatorId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Setup user xp interval
      if (!user.currentChannelId) {
        await xpSystem.create(userId);
      }

      // Update user
      const userUpdate = {
        currentChannelId: channelId,
        currentServerId: serverId,
        lastActiveAt: Date.now(),
      };
      await database.set.user(userId, userUpdate);

      // Update member
      const memberUpdate = {
        lastJoinChannelTime: Date.now(),
      };
      await database.set.member(userId, serverId, memberUpdate);

      // Send socket event
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
        targetSocket.emit('userUpdate', userUpdate);
        targetSocket.emit('serverUpdate', serverId, memberUpdate);
        targetSocket.to(`channel_${channelId}`).emit('playSound', 'join');
        targetSocket.to(`channel_${channelId}`).emit('RTCJoin', {
          from: targetSocket.id,
          userId: userId,
        });
        
        targetSocket.emit('onMessage', {
          serverId: serverId,
          channelId: channelId,
          type: 'info',
          content:
            channel.voiceMode === 'free'
              ? 'voiceChangeToFreeSpeech'
              : channel.voiceMode === 'forbidden'
              ? 'voiceChangeToForbiddenSpeech'
              : 'voiceChangeToQueue',
          timestamp: Date.now().valueOf(),
        });
      }

      io.to(`server_${serverId}`).emit(
        'serverMemberUpdate',
        userId,
        serverId,
        userUpdate,
      );

      /* ========== End of Handling ========== */

      new Logger('ConnectChannel').info(
        `User(${userId}) connected to channel(${channelId}) (Operator: ${operatorId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('ConnectChannel').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `連接頻道失敗，請稍後再試`,
          part: 'CONNECTCHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const DisconnectChannelHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

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
        if (operatorMember.permissionLevel < 5)
          reason = 'Not enough permission';

        if (operatorMember.permissionLevel <= userMember.permissionLevel)
          reason = 'Permission lower than the target';

        if (user.currentChannelId !== channelId)
          reason = 'Target is not in the channel';

        if (user.currentServerId !== serverId)
          reason = 'Target is not in the server';
      }

      if (reason) {
        new Logger('DisconnectChannel').warn(
          `User(${userId}) failed to disconnect from channel(${channelId}) (Operator: ${operatorId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Clear user xp interval
      await xpSystem.delete(userId);

      // Update user
      const userUpdate = {
        currentChannelId: null,
        currentServerId: null,
        lastActiveAt: Date.now(),
      };
      await database.set.user(userId, userUpdate);

      // Send socket event
      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        targetSocket.leave(`channel_${channelId}`);
        targetSocket.emit('userUpdate', userUpdate);
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
        userUpdate,
      );

      new Logger('DisconnectChannel').info(
        `User(${userId}) disconnected from channel(${channelId}) (Operator: ${operatorId})`,
      );

      /* ========== End of Handling ========== */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('DisconnectChannel').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `離開頻道失敗，請稍後再試`,
          part: 'DISCONNECTCHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const CreateChannelHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { serverId, channel: preset } = await DataValidator.validate(
        CreateChannelSchema,
        data,
        'CREATECHANNEL',
      );

      const category = await database.get.channel(preset.categoryId);
      const serverChannels = await database.get.serverChannels(serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorMember.permissionLevel < 5) reason = 'Not enough permission';

      if (category && category.categoryId)
        reason = 'Cannot create channel under sub-channel';

      if (reason) {
        new Logger('CreateChannel').warn(
          `User(${operatorId}) failed to create channel: ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      const categoryChannels = serverChannels.filter(
        (ch) => ch.categoryId === preset.categoryId,
      );

      // Update category
      if (category && !category.categoryId) {
        await UpdateChannelHandler.handle(io, socket, {
          channelId: category.channelId,
          serverId: serverId,
          channel: {
            type: 'category',
          },
        });
      }

      // Create new channel
      const channelId = uuidv4();
      await database.set.channel(channelId, {
        ...preset,
        serverId: serverId,
        order: Math.max(categoryChannels.length - 1, 0), // (-1 is for lobby)
        createdAt: Date.now(),
      });

      // Send socket event
      io.to(`server_${serverId}`).emit(
        'serverChannelAdd',
        await database.get.channel(channelId),
      );

      /* ========== End of Handling ========== */

      new Logger('CreateChannel').info(
        `User(${operatorId}) created channel(${channelId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('CreateChannel').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `建立頻道失敗，請稍後再試`,
          part: 'CREATECHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const UpdateChannelHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

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

      const channel = await database.get.channel(channelId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorMember.permissionLevel < 5) reason = 'Not enough permission';

      if (channel.isLobby) {
        if (update.userLimit && update.userLimit !== 0)
          reason = 'Lobby channel cannot set user limit';

        if (update.visibility && update.visibility !== 'public')
          reason = 'Lobby channel cannot set visibility';
      }

      if (reason) {
        new Logger('UpdateChannel').warn(
          `User(${operatorId}) failed to update channel(${channelId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      const messages: any[] = [];

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

      // Send socket event
      if (messages.length > 0) {
        io.to(`channel_${channelId}`).emit('onMessage', ...messages);
      }
      io.to(`server_${serverId}`).emit(
        'serverChannelUpdate',
        channelId,
        update,
      );

      /* ========== End of Handling ========== */

      new Logger('UpdateChannel').info(
        `User(${operatorId}) updated channel(${channelId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('UpdateChannel').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `更新頻道失敗，請稍後再試`,
          part: 'UPDATECHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const UpdateChannelsHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      const { serverId, channels } = await DataValidator.validate(
        UpdateChannelsSchema,
        data,
        'UPDATECHANNELS',
      );

      /* ========== Start of Main Logic ========== */

      for (const channel of channels) {
        await UpdateChannelHandler.handle(io, socket, {
          serverId,
          channelId: channel.channelId,
          channel: channel,
        });

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      /* ========== End of Handling ========== */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('UpdateChannels').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `更新頻道失敗，請稍後再試`,
          part: 'UPDATECHANNELS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const DeleteChannelHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

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

      if (operatorMember.permissionLevel < 5) reason = 'Not enough permission';

      if (channel.isLobby) reason = 'Cannot delete lobby channel';

      if (reason) {
        new Logger('DeleteChannel').warn(
          `User(${operatorId}) failed to delete channel(${channelId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      const channelChildren = serverChannels?.filter(
        (ch) => ch.categoryId === channelId,
      );
      const categoryChildren = serverChannels?.filter(
        (ch) => ch.categoryId === channel.categoryId,
      );

      // Update category
      if (categoryChildren && categoryChildren.length <= 1) {
        await UpdateChannelHandler.handle(io, socket, {
          serverId: serverId,
          channelId: channel.categoryId,
          channel: { type: 'channel' },
        });
      }

      // Delete channel children
      if (channelChildren) {
        for (const child of channelChildren) {
          await DeleteChannelHandler.handle(io, socket, {
            serverId: serverId,
            channelId: child.channelId,
          });

          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Connect users to lobby
      if (channelUsers) {
        for (const user of channelUsers) {
          await ConnectChannelHandler.handle(io, socket, {
            userId: user.userId,
            serverId: serverId,
            channelId: server.lobbyId,
          });

          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Delete channel
      await database.delete.channel(channelId);

      // Send socket event
      io.to(`server_${serverId}`).emit('serverChannelDelete', channelId);

      /* ========== End of Handling ========== */

      new Logger('DeleteChannel').info(
        `User(${operatorId}) deleted channel(${channelId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('DeleteChannel').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除頻道失敗，請稍後再試`,
          part: 'DELETECHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};
