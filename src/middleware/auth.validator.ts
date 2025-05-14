// Utils
import { verifyJWT } from '@/utils/jwt';

// StandardizedError
import StandardizedError from '@/error';

// Logger
import Logger from '@/utils/logger';

export const AuthValidator = {
  validate: async (token: string) => {
    const decoded = verifyJWT(token);
    if (!decoded.valid) {
      new Logger('Auth').error(`無效的 token: ${decoded.error.message}`);

      throw new StandardizedError({
        name: 'ValidationError',
        message: `無效的 token: ${decoded.error.message}`,
        part: 'AUTH',
        tag: 'TOKEN_INVALID',
        statusCode: 401,
      });
    }

    if (!decoded.data || !decoded.data.userId) {
      new Logger('Auth').error(`token 資料不完整`);

      throw new StandardizedError({
        name: 'ValidationError',
        message: '無效的 token',
        part: 'AUTH',
        tag: 'TOKEN_INVALID',
        statusCode: 401,
      });
    }

    return decoded.data.userId;
  },
};
