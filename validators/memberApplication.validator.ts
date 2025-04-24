// Error
import StandardizedError from '@/error';

export default class MemberApplicationValidator {
  constructor(private memberApplication: any) {
    this.memberApplication = memberApplication;
  }

  async validate() {
    try {
      if (
        this.memberApplication.description &&
        this.memberApplication.description.length > 200
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '申請理由不能超過200個字符',
          part: 'MEMBER_APPLICATION',
          tag: 'REASON_TOO_LONG',
          statusCode: 400,
        });
      }

      return this.memberApplication;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證會員申請時發生預期外的錯誤: ${error.message}`,
        part: 'MEMBER_APPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
