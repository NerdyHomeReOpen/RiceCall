// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

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
import DataValidator from '@/middleware/data.validator';

// Services
import {
  ConnectChannelService,
  DisconnectChannelService,
  CreateChannelService,
  UpdateChannelService,
  DeleteChannelService,
} from '@/api/socket/events/channel/channel.service';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';

export class ConnectChannelHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, channelId, serverId, password } = await new DataValidator(
        ConnectChannelSchema,
        'CONNECTCHANNEL',
      ).validate(data);

      const targetSocket = this.io.sockets.sockets.get(userId);

      const result = await new ConnectChannelService(
        operatorId,
        userId,
        channelId,
        serverId,
        password,
      ).use();

      if (targetSocket) {
        targetSocket.join(`channel_${channelId}`);
        targetSocket.emit('userUpdate', result.userUpdate);
        targetSocket.emit('channelUpdate', result.channelUpdate);
        targetSocket.to(`channel_${channelId}`).emit('playSound', 'join');
      }

      if (result.actions) {
        for (const action of result.actions) {
          await action(this.io, this.socket);
        }
      }
      this.io
        .to(`server_${serverId}`)
        .emit('serverMembersUpdate', result.serverMembersUpdate);
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

      this.socket.emit('error', error);
      new Logger('Channel').error(error);
    }
  }
}

export class DisconnectChannelHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, channelId, serverId } = await new DataValidator(
        DisconnectChannelSchema,
        'DISCONNECTCHANNEL',
      ).validate(data);

      const targetSocket = this.io.sockets.sockets.get(userId);

      const result = await new DisconnectChannelService(
        operatorId,
        userId,
        channelId,
        serverId,
      ).use();

      if (targetSocket) {
        targetSocket.leave(`channel_${channelId}`);
        targetSocket.emit('userUpdate', result.userUpdate);
        targetSocket.emit('channelUpdate', result.channelUpdate);
        targetSocket.to(`channel_${channelId}`).emit('playSound', 'leave');
      }

      if (result.actions) {
        for (const action of result.actions) {
          await action(this.io, this.socket);
        }
      }
      this.io
        .to(`server_${serverId}`)
        .emit('serverMembersUpdate', result.serverMembersUpdate);
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

      this.socket.emit('error', error);
      new Logger('Channel').error(error);
    }
  }
}

export class CreateChannelHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { serverId, channel } = await new DataValidator(
        CreateChannelSchema,
        'CREATECHANNEL',
      ).validate(data);

      const result = await new CreateChannelService(
        operatorId,
        serverId,
        channel,
      ).use();

      this.io
        .to(`server_${serverId}`)
        .emit('serverChannelsUpdate', result.serverChannelsUpdate);
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

      this.socket.emit('error', error);
      new Logger('Channel').error(error);
    }
  }
}

export class UpdateChannelHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { channelId, serverId, channel } = await new DataValidator(
        UpdateChannelSchema,
        'UPDATECHANNEL',
      ).validate(data);

      const result = await new UpdateChannelService(
        operatorId,
        serverId,
        channelId,
        channel,
      ).use();

      this.io
        .to(`channel_${channelId}`)
        .emit('channelUpdate', result.channelUpdate);
      this.io
        .to(`server_${serverId}`)
        .emit('serverChannelsUpdate', result.serverChannelsUpdate);
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

      this.socket.emit('error', error);
      new Logger('Channel').error(error);
    }
  }
}

export class UpdateChannelsHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const { serverId, channels } = await new DataValidator(
        UpdateChannelsSchema,
        'UPDATECHANNELS',
      ).validate(data);

      await Promise.all(
        channels.map(
          async (channel: any) =>
            await new UpdateChannelHandler(this.io, this.socket).handle({
              channelId: channel.channelId,
              serverId,
              channel,
            }),
        ),
      );
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

      this.socket.emit('error', error);
      new Logger('Channel').error(error);
    }
  }
}

export class DeleteChannelHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { channelId, serverId } = await new DataValidator(
        DeleteChannelSchema,
        'DELETECHANNEL',
      ).validate(data);

      const result = await new DeleteChannelService(
        operatorId,
        serverId,
        channelId,
      ).use();

      this.io
        .to(`server_${serverId}`)
        .emit('serverChannelsUpdate', result.serverChannelsUpdate);

      if (result.actions) {
        for (const action of result.actions) {
          await action(this.io, this.socket);
        }
      }
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

      this.socket.emit('error', error);
      new Logger('Channel').error(error);
    }
  }
}
