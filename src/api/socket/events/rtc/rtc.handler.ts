import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Schemas
import {
  RTCOfferSchema,
  RTCAnswerSchema,
  RTCCandidateSchema,
} from '@/api/socket/events/rtc/rtc.schemas';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const RTCOfferHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { to, offer } = await DataValidator.validate(
        RTCOfferSchema,
        data,
        'RTCOFFER',
      );

      /* Start of Main Logic */

      // Send socket event
      socket.to(to).emit('RTCOffer', {
        from: socket.id,
        userId: operatorId,
        offer: offer,
      });

      /* End of Main Logic */
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

      socket.emit('error', error);
      new Logger('RTC').error(error.message);
    }
  },
};

export const RTCAnswerHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { to, answer } = await DataValidator.validate(
        RTCAnswerSchema,
        data,
        'RTCANSWER',
      );

      /* Start of Main Logic */

      // Send socket event
      socket.to(to).emit('RTCAnswer', {
        from: socket.id,
        userId: operatorId,
        answer: answer,
      });

      /* End of Main Logic */
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

      socket.emit('error', error);
      new Logger('RTC').error(error.message);
    }
  },
};

export const RTCCandidateHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      const operatorId = socket.data.userId;

      const { to, candidate } = await DataValidator.validate(
        RTCCandidateSchema,
        data,
        'RTCCANDIDATE',
      );

      /* Start of Main Logic */

      // Send socket event
      socket.to(to).emit('RTCIceCandidate', {
        from: socket.id,
        userId: operatorId,
        candidate: candidate,
      });

      /* End of Main Logic */
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

      socket.emit('error', error);
      new Logger('RTC').error(error.message);
    }
  },
};
