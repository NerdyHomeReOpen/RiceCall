// Error
import StandardizedError from '@/error';

export default class FriendGroupValidator {
  constructor(private friendGroup: any) {
    this.friendGroup = friendGroup;
  }

  async validate() {
    try {
      if (this.friendGroup.name && this.friendGroup.name.length > 20) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '好友分組名稱不能超過20個字符',
          part: 'FRIEND_GROUP',
          tag: 'NAME_TOO_LONG',
          statusCode: 400,
        });
      }

      return this.friendGroup;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證好友分組時發生預期外的錯誤: ${error.message}`,
        part: 'FRIEND_GROUP',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
