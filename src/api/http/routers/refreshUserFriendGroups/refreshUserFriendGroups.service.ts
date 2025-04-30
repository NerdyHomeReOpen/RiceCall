// Database
import Database from '@/database';

export default class RefreshUserFriendGroupsService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const userFriendGroups = await Database.get.userFriendGroups(this.userId);
    return userFriendGroups;
  }
}
