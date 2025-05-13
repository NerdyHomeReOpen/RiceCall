// Utils
import { verifyJWT } from '@/utils/jwt';

// StandardizedError
import StandardizedError from '@/error';

export const AuthValidator = {
  validate: async (token: string) => {
    const decoded = verifyJWT(token);
    if (!decoded.valid) {
      throw new StandardizedError({
        name: 'ValidationError',
        message: '無效的 token',
        part: 'AUTH',
        tag: 'TOKEN_INVALID',
        statusCode: 401,
      });
    }

    if (!decoded.data) {
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
