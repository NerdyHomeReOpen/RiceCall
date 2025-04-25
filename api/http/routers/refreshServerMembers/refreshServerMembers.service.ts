// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RefreshServerMembersService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    try {
      const serverMembers = await Database.get.serverMembers(this.serverId);

      return serverMembers;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新伺服器成員資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHSERVERMEMBERS',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
