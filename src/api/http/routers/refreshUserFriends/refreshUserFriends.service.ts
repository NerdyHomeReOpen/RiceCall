// Database
import Database from '@/database';

export default class RefreshUserFriendsService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const userFriends = await Database.get.userFriends(this.userId);
    return userFriends;
  }
}
