// Database
import Database from '@/database';

export default class RefreshServerChannelsService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    const serverChannels = await Database.get.serverChannels(this.serverId);
    return serverChannels;
  }
}
