// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export default class RefreshMemberApplicationService {
  constructor(private userId: string, private serverId: string) {
    this.userId = userId;
    this.serverId = serverId;
  }

  async use() {
    try {
      const memberApplication = await Database.get.memberApplication(
        this.userId,
        this.serverId,
      );

      return memberApplication;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新成員申請資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHMEMBERAPPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
