// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RefreshServerService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    try {
      const server = await Database.get.server(this.serverId);

      return server;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新群組資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHSERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
