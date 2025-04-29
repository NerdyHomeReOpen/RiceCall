// Error
import StandardizedError from '@/error';

export default class MemberValidator {
  constructor(private member: any) {
    this.member = member;
  }

  async validate() {
    try {
      if (this.member.nickname && this.member.nickname.length > 32) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '暱稱不能超過32個字符',
          part: 'MEMBER',
          tag: 'NICKNAME_TOO_LONG',
          statusCode: 400,
        });
      }

      if (
        this.member.permissionLevel &&
        (this.member.permissionLevel < 0 || this.member.permissionLevel > 8)
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '權限等級必須介於0-8之間',
          part: 'MEMBER',
          tag: 'PERMISSION_LEVEL_INVALID',
          statusCode: 400,
        });
      }

      return this.member;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證成員時發生預期外的錯誤: ${error.message}`,
        part: 'MEMBER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
