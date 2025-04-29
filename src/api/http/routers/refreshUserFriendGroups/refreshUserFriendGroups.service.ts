// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export default class RefreshUserFriendGroupsService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    try {
      const userFriendGroups = await Database.get.userFriendGroups(this.userId);

      return userFriendGroups;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新用戶好友群組資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHUSERFRIENDGROUPS',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
