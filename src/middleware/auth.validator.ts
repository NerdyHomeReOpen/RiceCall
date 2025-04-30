// Utils
import { verifyJWT } from '@/utils/jwt';

// StandardizedError
import StandardizedError from '@/error';

export default class AuthValidator {
  constructor(private token: string) {
    this.token = token;
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

    return decoded.userId;
  }
}
