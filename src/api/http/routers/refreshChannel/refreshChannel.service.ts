// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export default class RefreshChannelService {
  constructor(private channelId: string) {
    this.channelId = channelId;
  }

  async use() {
    try {
      const channel = await Database.get.channel(this.channelId);

      return channel;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刷新頻道資料時發生預期外的錯誤: ${error.message}`,
        part: 'REFRESHCHANNEL',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
