// Database
import Database from '@/database';

export default class RefreshFriendGroupService {
  constructor(private friendGroupId: string) {
    this.friendGroupId = friendGroupId;
  }

  async use() {
    const friendGroup = await Database.get.friendGroup(this.friendGroupId);
    return friendGroup;
  }
}
