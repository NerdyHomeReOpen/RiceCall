// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RefreshServerMemberApplicationsService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    try {
      const serverMemberApplications =
        await Database.get.serverMemberApplications(this.serverId);

      return serverMemberApplications;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新伺服器成員申請資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHSERVERMEMBERAPPLICATIONS',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
