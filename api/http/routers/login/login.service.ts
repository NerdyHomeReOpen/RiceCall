import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

// Utils
import { generateJWT } from '@/utils/jwt';
export default class LoginService {
  constructor(private account: string, private password: string) {
    this.account = account;
    this.password = password;
  }

  async use() {
    try {
      const data = await Database.get.account(this.account);
      if (!data) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號或密碼錯誤',
          part: 'LOGIN',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      const isPasswordVerified = await bcrypt.compare(
        this.password,
        data.password,
      );
      if (!isPasswordVerified) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號或密碼錯誤',
          part: 'LOGIN',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      const user = await Database.get.user(data.userId);
      if (!user) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號或密碼錯誤',
          part: 'LOGIN',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      await Database.set.user(data.userId, {
        lastActiveAt: Date.now(),
      });

      const token = generateJWT({ userId: data.userId });

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
