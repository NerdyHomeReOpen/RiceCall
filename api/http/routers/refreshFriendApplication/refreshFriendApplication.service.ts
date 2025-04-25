// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RefreshFriendApplicationService {
  constructor(private userId: string, private targetId: string) {
    this.userId = userId;
    this.targetId = targetId;
  }

  async use() {
    try {
      const friendApplication = await Database.get.friendApplication(
        this.userId,
        this.targetId,
      );

      return friendApplication;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新好友申請資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHFRIENDAPPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
