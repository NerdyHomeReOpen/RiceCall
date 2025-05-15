// Utils
import { verifyJWT } from '@/utils/jwt';

export const AuthValidator = {
  validate: async (token: string) => {
    const decoded = verifyJWT(token);
    if (!decoded.valid) {
      throw new Error(`Invalid token: ${decoded.error.message}`);
    }

    if (!decoded.data || !decoded.data.userId) {
      throw new Error(`Invalid token data: ${decoded.error.message}`);
    }

    return decoded.data.userId;
  },
};
