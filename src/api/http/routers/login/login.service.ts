import bcrypt from 'bcrypt';

// Error
import StandardizedError from '@/error';

// Utils
import { generateJWT } from '@/utils/jwt';

// Database
import { database } from '@/index';

export default class LoginService {
  constructor(private account: string, private password: string) {
    this.account = account;
    this.password = password;
  }

  async use() {
    const data = await database.get.account(this.account);
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

    const user = await database.get.user(data.userId);
    if (!user) {
      throw new StandardizedError({
        name: 'ValidationError',
        message: '帳號或密碼錯誤',
        part: 'LOGIN',
        tag: 'INVALID_ACCOUNT_OR_PASSWORD',
        statusCode: 401,
      });
    }

    await database.set.user(data.userId, {
      lastActiveAt: Date.now(),
    });

    const token = generateJWT({ userId: data.userId });

    return { token };
  }
}
