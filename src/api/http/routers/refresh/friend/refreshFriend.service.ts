// Database
import Database from '@/database';

export class RefreshFriendService {
  constructor(private userId: string, private targetId: string) {
    this.userId = userId;
    this.targetId = targetId;
  }

  async use() {
    const friend = await Database.get.friend(this.userId, this.targetId);
    return friend;
  }
}
