// Database
import Database from '@/database';

export default class RefreshMemberApplicationService {
  constructor(private userId: string, private serverId: string) {
    this.userId = userId;
    this.serverId = serverId;
  }

  async use() {
    const memberApplication = await Database.get.memberApplication(
      this.userId,
      this.serverId,
    );
    return memberApplication;
  }
}
