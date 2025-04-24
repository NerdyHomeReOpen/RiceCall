// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

// Utils
import { generateJWT } from '@/utils/jwt';

export default class LoginService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    try {
      await Database.set.user(this.userId, {
        lastActiveAt: Date.now(),
      });

      const token = generateJWT({
        userId: this.userId,
      });

      const sessionId = uuidv4();

      return { token, sessionId };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `登入時發生預期外的錯誤: ${error.message}`,
        part: 'LOGIN',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
