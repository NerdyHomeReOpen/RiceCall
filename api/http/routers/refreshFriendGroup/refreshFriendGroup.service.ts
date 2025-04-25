// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RefreshFriendGroupService {
  constructor(private friendGroupId: string) {
    this.friendGroupId = friendGroupId;
  }

  async use() {
    try {
      const friendGroup = await Database.get.friendGroup(this.friendGroupId);

      return friendGroup;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新好友群組資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHFRIENDGROUP',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
