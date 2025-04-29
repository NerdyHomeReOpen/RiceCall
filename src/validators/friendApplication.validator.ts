// Error
import StandardizedError from '@/error';

export default class FriendApplicationValidator {
  constructor(private friendApplication: any) {
    this.friendApplication = friendApplication;
  }

  async validate() {
    try {
      if (
        this.friendApplication.description &&
        this.friendApplication.description.length > 200
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '申請理由不能超過200個字符',
          part: 'FRIEND_APPLICATION',
          tag: 'REASON_TOO_LONG',
          statusCode: 400,
        });
      }

      return this.friendApplication;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證好友申請時發生預期外的錯誤: ${error.message}`,
        part: 'FRIEND_APPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
