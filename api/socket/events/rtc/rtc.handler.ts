// Utils
import Logger from '@/utils/logger';

// Error
import StandardizedError from '@/error';

// Validators
import {
  RTCOfferValidator,
  RTCAnswerValidator,
  RTCCandidateValidator,
  RTCJoinValidator,
  RTCLeaveValidator,
} from './rtc.validator';

// Socket
import { SocketHandler } from '@/api/socket';

export class RTCOfferHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { to, offer } = await new RTCOfferValidator(data).validate();

      this.io.to(to).emit('RTCOffer', {
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
      new Logger('RTC').error(error);
    }
  }
}

export class RTCAnswerHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { to, answer } = await new RTCAnswerValidator(data).validate();

      this.io.to(to).emit('RTCAnswer', {
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
      new Logger('RTC').error(error);
    }
  }
}

export class RTCCandidateHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { to, candidate } = await new RTCCandidateValidator(
        data,
      ).validate();

      this.io.to(to).emit('RTCCandidate', {
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
      new Logger('RTC').error(error);
    }
  }
}

export class RTCJoinHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { channelId } = await new RTCJoinValidator(data).validate();

      this.io.to(`channel_${channelId}`).emit('RTCJoin', {
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
      new Logger('RTC').error(error);
    }
  }
}

export class RTCLeaveHandler extends SocketHandler {
  async handle(data: any) {
    try {
      const operatorId = this.socket.data.userId;

      const { channelId } = await new RTCLeaveValidator(data).validate();

      this.io.to(`channel_${channelId}`).emit('RTCLeave', {
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
      new Logger('RTC').error(error);
    }
  }
}
