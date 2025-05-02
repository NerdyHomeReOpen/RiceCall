// Database
import Database from '@/database';

export class RefreshMemberService {
  constructor(private userId: string, private serverId: string) {
    this.userId = userId;
    this.serverId = serverId;
  }

  async use() {
    const member = await Database.get.member(this.userId, this.serverId);
    return member;
  }
}
