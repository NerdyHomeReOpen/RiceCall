import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import { SocketRequestHandler } from '@/handler';

// Schemas
import {
  RTCOfferSchema,
  RTCAnswerSchema,
  RTCCandidateSchema,
} from '@/api/socket/events/rtc/rtc.schemas';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const RTCOfferHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'RTCOFFER';
    try {
      /* ========== Start of Handling ========== */

      const operatorId = socket.data.userId;

      const { to, offer } = await DataValidator.validate(
        RTCOfferSchema,
        data,
        part,
      );

      /* ========== Start of Handling ========== */

      // Send socket event
      socket.to(to).emit('RTCOffer', {
        from: socket.id,
        userId: operatorId,
        offer: offer,
      });

      /* ========== End of Handling ========== */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RTCOffer').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `連接 RTC 失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const RTCAnswerHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'RTCANSWER';
    try {
      /* ========== Start of Handling ========== */

      const operatorId = socket.data.userId;

      const { to, answer } = await DataValidator.validate(
        RTCAnswerSchema,
        data,
        part,
      );

      /* ========== Start of Main Logic ========== */

      // Send socket event
      socket.to(to).emit('RTCAnswer', {
        from: socket.id,
        userId: operatorId,
        answer: answer,
      });

      /* ========== End of Handling ========== */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RTCAnswer').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `連接 RTC 失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const RTCCandidateHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'RTCCANDIDATE';
    try {
      /* ========== Start of Handling ========== */

      const operatorId = socket.data.userId;

      const { to, candidate } = await DataValidator.validate(
        RTCCandidateSchema,
        data,
        part,
      );

      /* ========== Start of Main Logic ========== */

      // Send socket event
      socket.to(to).emit('RTCIceCandidate', {
        from: socket.id,
        userId: operatorId,
        candidate: candidate,
      });

      /* ========== End of Handling ========== */
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RTCCandidate').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `連接 RTC 失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};
