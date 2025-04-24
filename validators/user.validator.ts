// Error
import StandardizedError from '@/error';

export default class UserValidator {
  constructor(private user: any) {
    this.user = user;
  }

  async validate() {
    try {
      if (this.user.name && this.user.name.length > 32) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '暱稱不能超過32個字符',
          part: 'USER',
          tag: 'USERNAME_TOO_LONG',
          statusCode: 401,
        });
      }

      if (this.user.name && this.user.name.length < 1) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '暱稱不可為空',
          part: 'USER',
          tag: 'USERNAME_EMPTY',
          statusCode: 401,
        });
      }

      if (
        this.user.name &&
        !/^[A-Za-z0-9\u4e00-\u9fa5]+$/.test(this.user.name)
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '暱稱只能包含英文字母、數字和中文',
          part: 'USER',
          tag: 'USERNAME_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.birthYear && this.user.birthYear < 1900) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '出生年份不能小於1900',
          part: 'USER',
          tag: 'BIRTH_YEAR_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.birthMonth && this.user.birthMonth < 1) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '出生月份不能小於1',
          part: 'USER',
          tag: 'BIRTH_MONTH_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.birthMonth && this.user.birthMonth > 12) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '出生月份不能大於12',
          part: 'USER',
          tag: 'BIRTH_MONTH_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.birthDay && this.user.birthDay < 1) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '出生日不能小於1',
          part: 'USER',
          tag: 'BIRTH_DAY_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.birthDay && this.user.birthDay > 31) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '出生日不能大於31',
          part: 'USER',
          tag: 'BIRTH_DAY_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.signature && this.user.signature.length > 200) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '個性簽名不能超過200個字符',
          part: 'USER',
          tag: 'SIGNATURE_TOO_LONG',
          statusCode: 401,
        });
      }

      if (
        this.user.status &&
        !['online', 'dnd', 'idle', 'gn'].includes(this.user.status)
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的狀態',
          part: 'USER',
          tag: 'STATUS_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.gender && !['Male', 'Female'].includes(this.user.gender)) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的性別',
          part: 'USER',
          tag: 'GENDER_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.level && this.user.level < 1) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '等級不能小於1',
          part: 'USER',
          tag: 'LEVEL_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.xp && this.user.xp < 0) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '經驗值不能小於0',
          part: 'USER',
          tag: 'XP_INVALID',
          statusCode: 401,
        });
      }

      if (this.user.requiredXp && this.user.requiredXp < 0) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '所需經驗值不能小於0',
          part: 'USER',
          tag: 'REQUIRED_XP_INVALID',
          statusCode: 401,
        });
      }

      return this.user;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證使用者時發生預期外的錯誤: ${error.message}`,
        part: 'USER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
