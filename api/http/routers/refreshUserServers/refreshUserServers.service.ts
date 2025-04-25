// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RefreshUserServersService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    try {
      const userServers = await Database.get.userServers(this.userId);

      return userServers;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新用戶伺服器資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHUSERSERVERS',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
