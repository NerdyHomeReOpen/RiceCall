import bcrypt from 'bcrypt';

// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RegisterService {
  constructor(
    private account: string,
    private password: string,
    private username: string,
  ) {
    this.account = account;
    this.password = password;
    this.username = username;
  }

  async use() {
    try {
      // Create user data
      const userId = uuidv4();
      await Database.set.user(userId, {
        name: this.username,
        avatar: userId,
        avatarUrl: `data:image/png;base64,${process.env.SERVER_URL}/images/userAvatars/`,
        createdAt: Date.now(),
      });

      // Create account password list
      const hashedPassword = await bcrypt.hash(this.password, 10);
      await Database.set.account(this.account, {
        password: hashedPassword,
        userId: userId,
      });

      return { account: this.account };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `註冊時發生預期外的錯誤: ${error.message}`,
        part: 'REGISTER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
