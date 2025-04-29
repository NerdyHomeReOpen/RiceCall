// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RefreshUserService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    try {
      const user = await Database.get.user(this.userId);

      return user;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新使用者資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHUSER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
