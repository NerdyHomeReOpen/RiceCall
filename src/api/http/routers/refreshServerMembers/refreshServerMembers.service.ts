// Database
import Database from '@/database';

export default class RefreshServerMembersService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    const serverMembers = await Database.get.serverMembers(this.serverId);
    return serverMembers;
  }
}
