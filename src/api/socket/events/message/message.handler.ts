// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';

// Schemas
import {
  SendDirectMessageSchema,
  SendMessageSchema,
} from '@/api/socket/events/message/message.schemas';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  SendDirectMessageService,
  SendMessageService,
} from '@/api/socket/events/message/message.service';

export class SendMessageHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { message, userId, serverId, channelId } = await new DataValidator(
        SendMessageSchema,
        'SENDMESSAGE',
      ).validate(data);

      const { onMessage, serverUpdate } = await new SendMessageService(
        operatorId,
        userId,
        serverId,
        channelId,
        message,
      ).use();

      this.io.to(`channel_${channelId}`).emit('onMessage', onMessage);
      this.socket.emit('serverUpdate', serverUpdate);
      this.socket
        .to(`channel_${channelId}`)
        .emit('playSound', 'recieveChannelMessage');
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送訊息時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('SendMessage').error(error.message);
    }
  }
}

export class SendDirectMessageHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { directMessage, userId, targetId } = await new DataValidator(
        SendDirectMessageSchema,
        'SENDDIRECTMESSAGE',
      ).validate(data);

      const targetSocket = this.io.sockets.sockets.get(targetId);

      const { onDirectMessage } = await new SendDirectMessageService(
        operatorId,
        userId,
        targetId,
        directMessage,
      ).use();

      this.socket.emit('onDirectMessage', onDirectMessage);
      if (targetSocket) {
        targetSocket.emit('onDirectMessage', onDirectMessage);
      }
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送私訊時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('SendDirectMessage').error(error.message);
    }
  }
}
