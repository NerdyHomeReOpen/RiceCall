// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export default class RefreshUserFriendsService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    try {
      const userFriends = await Database.get.userFriends(this.userId);

      return userFriends;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新使用者好友資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHUSERFRIENDS',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
