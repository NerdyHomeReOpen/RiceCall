// Database
import Database from '@/database';

export default class RefreshServerService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    const server = await Database.get.server(this.serverId);
    return server;
  }
}
