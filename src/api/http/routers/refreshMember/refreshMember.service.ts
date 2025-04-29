// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export default class RefreshMemberService {
  constructor(private userId: string, private serverId: string) {
    this.userId = userId;
    this.serverId = serverId;
  }

  async use() {
    try {
      const member = await Database.get.member(this.userId, this.serverId);

      return member;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新成員資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHMEMBER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
