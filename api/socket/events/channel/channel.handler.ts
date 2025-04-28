import { Server, Socket } from 'socket.io';

// Utils
import Logger from '@/utils/logger';

// Error
import StandardizedError from '@/error';

// Validators
import {
  ConnectChannelValidator,
  CreateChannelValidator,
  DeleteChannelValidator,
  DisconnectChannelValidator,
  UpdateChannelsValidator,
  UpdateChannelValidator,
} from './channel.validator';

// Services
import {
  ConnectChannelService,
  DisconnectChannelService,
  CreateChannelService,
  UpdateChannelService,
  DeleteChannelService,
} from './channel.service';

export class ConnectChannelHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, channelId, serverId, password } =
        await new ConnectChannelValidator(data).validate();

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
          await action(this.io, targetSocket);
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

export class DisconnectChannelHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { userId, channelId, serverId } =
        await new DisconnectChannelValidator(data).validate();

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
          await action(this.io, targetSocket);
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

export class CreateChannelHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { serverId, channel } = await new CreateChannelValidator(
        data,
      ).validate();

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

export class UpdateChannelHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { channelId, serverId, channel } = await new UpdateChannelValidator(
        data,
      ).validate();

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

export class UpdateChannelsHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle(data: any) {
    try {
      const { serverId, channels } = await new UpdateChannelsValidator(
        data,
      ).validate();

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

export class DeleteChannelHandler {
  constructor(private io: Server, private socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { channelId, serverId } = await new DeleteChannelValidator(
        data,
      ).validate();

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
