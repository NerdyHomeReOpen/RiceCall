// Database
import Database from '@/database';

export default class RefreshServerMemberApplicationsService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    const serverMemberApplications =
      await Database.get.serverMemberApplications(this.serverId);
    return serverMemberApplications;
  }
}
