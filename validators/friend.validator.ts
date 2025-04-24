// Error
import StandardizedError from '@/error';

export default class FriendValidator {
  constructor(private friend: any) {
    this.friend = friend;
  }

  async validate() {
    try {
      return this.friend;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證好友時發生預期外的錯誤: ${error.message}`,
        part: 'FRIEND',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
