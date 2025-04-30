// Database
import Database from '@/database';

export default class RefreshChannelService {
  constructor(private channelId: string) {
    this.channelId = channelId;
  }

  async use() {
    const channel = await Database.get.channel(this.channelId);
    return channel;
  }
}
