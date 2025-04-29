// Utils
import Logger from '@/utils/logger';

// Error
import StandardizedError from '@/error';

// Schemas
import { SendDirectMessageSchema, SendMessageSchema } from './message.schemas';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  SendDirectMessageService,
  SendMessageService,
} from './message.service';

// Socket
import { SocketHandler } from '@/api/socket';

export class SendMessageHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { message, userId, serverId, channelId } = await new DataValidator(
        SendMessageSchema,
        'SENDMESSAGE',
      ).validate(data);

      const result = await new SendMessageService(
        operatorId,
        userId,
        serverId,
        channelId,
        message,
      ).use();

      this.io.to(`channel_${channelId}`).emit('onMessage', result.onMessage);
      this.socket.emit('memberUpdate', result.memberUpdate);
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
      new Logger('SendMessage').error(error);
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

      const result = await new SendDirectMessageService(
        operatorId,
        userId,
        targetId,
        directMessage,
      ).use();

      this.socket.emit('onDirectMessage', result.onDirectMessage);
      if (targetSocket) {
        targetSocket.emit('onDirectMessage', result.onDirectMessage);
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
      new Logger('SendDirectMessage').error(error);
    }
  }
}
