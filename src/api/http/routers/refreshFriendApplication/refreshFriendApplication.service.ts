// Database
import Database from '@/database';

export default class RefreshFriendApplicationService {
  constructor(private userId: string, private targetId: string) {
    this.userId = userId;
    this.targetId = targetId;
  }

  async use() {
    const friendApplication = await Database.get.friendApplication(
      this.userId,
      this.targetId,
    );
    return friendApplication;
  }
}
