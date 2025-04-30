import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Database
import Database from '@/database';

// Config
import config from '@/config';

export default class RegisterService {
  constructor(
    private account: string,
    private password: string,
    private username: string,
  ) {
    this.account = account;
    this.password = password;
    this.username = username;
  }

  async use() {
    // Create user data
    const userId = uuidv4();
    await Database.set.user(userId, {
      name: this.username,
      avatar: userId,
      avatarUrl: `data:image/png;base64,${config.serverUrl}:${config.serverPort}/images/userAvatars/`,
      createdAt: Date.now(),
    });

    // Create account password list
    const hashedPassword = await bcrypt.hash(this.password, 10);
    await Database.set.account(this.account, {
      password: hashedPassword,
      userId: userId,
    });

    return { account: this.account };
  }
}
