// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handler
import { SocketHandler } from '@/api/socket/base.handler';

// Schemas
import {
  RTCOfferSchema,
  RTCAnswerSchema,
  RTCCandidateSchema,
  RTCJoinSchema,
  RTCLeaveSchema,
} from '@/api/socket/events/rtc/rtc.schemas';

// Middleware
import DataValidator from '@/middleware/data.validator';

export class RTCOfferHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { to, offer } = await new DataValidator(
        RTCOfferSchema,
        'RTCOFFER',
      ).validate(data);

      this.socket.to(to).emit('RTCOffer', {
        from: this.socket.id,
        userId: operatorId,
        offer: offer,
      });
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送 RTC offer 時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('RTC').error(error.message);
    }
  }
}

export class RTCAnswerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { to, answer } = await new DataValidator(
        RTCAnswerSchema,
        'RTCANSWER',
      ).validate(data);

      this.socket.to(to).emit('RTCAnswer', {
        from: this.socket.id,
        userId: operatorId,
        answer: answer,
      });
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送 RTC answer 時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('RTC').error(error.message);
    }
  }
}

export class RTCCandidateHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { to, candidate } = await new DataValidator(
        RTCCandidateSchema,
        'RTCCANDIDATE',
      ).validate(data);

      this.socket.to(to).emit('RTCCandidate', {
        from: this.socket.id,
        userId: operatorId,
        candidate: candidate,
      });
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送 RTC candidate 時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('RTC').error(error.message);
    }
  }
}

export class RTCJoinHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { channelId } = await new DataValidator(
        RTCJoinSchema,
        'RTCJOIN',
      ).validate(data);

      this.socket.to(`channel_${channelId}`).emit('RTCJoin', {
        from: this.socket.id,
        userId: operatorId,
      });
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送 RTC join 時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('RTC').error(error.message);
    }
  }
}

export class RTCLeaveHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { channelId } = await new DataValidator(
        RTCLeaveSchema,
        'RTCLEAVE',
      ).validate(data);

      this.socket.to(`channel_${channelId}`).emit('RTCLeave', {
        from: this.socket.id,
        userId: operatorId,
      });
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `傳送 RTC leave 時發生無法預期的錯誤: ${error.message}`,
          part: 'SEARCHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      this.socket.emit('error', error);
      new Logger('RTC').error(error.message);
    }
  }
}
