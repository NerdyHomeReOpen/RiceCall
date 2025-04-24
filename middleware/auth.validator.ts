// Utils
import { verifyJWT } from '@/utils/jwt';
import Session from '@/utils/session';

// StandardizedError
import StandardizedError from '@/error';

export default class AuthValidator {
  constructor(private token: string, private sessionId: string) {
    this.token = token;
    this.sessionId = sessionId;
  }

  async validate() {
    const decoded = verifyJWT(this.token);
    if (!decoded.valid) {
      throw new StandardizedError({
        name: 'ValidationError',
        message: '無效的 token',
        part: 'AUTH',
        tag: 'TOKEN_INVALID',
        statusCode: 401,
      });
    }

    if (!decoded.userId) {
      throw new StandardizedError({
        name: 'ValidationError',
        message: '無效的 token',
        part: 'AUTH',
        tag: 'TOKEN_INVALID',
        statusCode: 401,
      });
    }

    if (!Session.sessionToUser.get(this.sessionId)) {
      throw new StandardizedError({
        name: 'ValidationError',
        message: '無效的 session',
        part: 'AUTH',
        tag: 'SESSION_INVALID',
        statusCode: 401,
      });
    }
  }
}
