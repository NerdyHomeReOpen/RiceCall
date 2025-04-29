// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export default class RefreshServerChannelsService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    try {
      const serverChannels = await Database.get.serverChannels(this.serverId);

      return serverChannels;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新伺服器頻道資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHSERVERCHANNELS',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
