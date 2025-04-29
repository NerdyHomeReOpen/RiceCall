// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export default class RefreshFriendService {
  constructor(private userId: string, private targetId: string) {
    this.userId = userId;
    this.targetId = targetId;
  }

  async use() {
    try {
      const friend = await Database.get.friend(this.userId, this.targetId);

      return friend;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新好友資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHFRIEND',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
