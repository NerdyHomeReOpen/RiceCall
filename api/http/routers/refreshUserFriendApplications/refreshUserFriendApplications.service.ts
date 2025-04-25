// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RefreshUserFriendApplicationsService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    try {
      const userFriendApplications = await Database.get.userFriendApplications(
        this.userId,
      );

      return userFriendApplications;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新用戶好友申請資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHUSERFRIENDAPPLICATIONS',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
