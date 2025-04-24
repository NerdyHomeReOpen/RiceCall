// Error
import StandardizedError from '@/error';

export default class ServerValidator {
  constructor(private server: any) {
    this.server = server;
  }

  async validate() {
    try {
      if (this.server.name && this.server.name.length > 30) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '群組名稱不能超過30個字符',
          part: 'SERVER',
          tag: 'NAME_TOO_LONG',
          statusCode: 401,
        });
      }

      if (this.server.announcement && this.server.announcement.length > 500) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '公告不能超過500個字符',
          part: 'SERVER',
          tag: 'ANNOUNCEMENT_TOO_LONG',
          statusCode: 401,
        });
      }

      if (this.server.description && this.server.description.length > 200) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '群組描述不能超過200個字符',
          part: 'SERVER',
          tag: 'DESCRIPTION_TOO_LONG',
          statusCode: 401,
        });
      }

      if (
        this.server.type &&
        !['game', 'entertainment', 'other'].includes(this.server.type)
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的群組類型',
          part: 'SERVER',
          tag: 'TYPE_INVALID',
          statusCode: 401,
        });
      }

      if (this.server.displayId && this.server.displayId.length > 10) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '顯示ID不能超過10個字符',
          part: 'SERVER',
          tag: 'DISPLAY_ID_TOO_LONG',
          statusCode: 401,
        });
      }

      if (this.server.slogan && this.server.slogan.length > 30) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '群組口號不能超過30個字符',
          part: 'SERVER',
          tag: 'SLOGAN_TOO_LONG',
          statusCode: 401,
        });
      }

      if (this.server.level && this.server.level < 0) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '等級不能小於0',
          part: 'SERVER',
          tag: 'LEVEL_INVALID',
          statusCode: 401,
        });
      }

      if (this.server.wealth && this.server.wealth < 0) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '財富不能小於0',
          part: 'SERVER',
          tag: 'WEALTH_INVALID',
          statusCode: 401,
        });
      }

      if (
        this.server.visibility &&
        !['public', 'private', 'invisible'].includes(this.server.visibility)
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的群組可見度',
          part: 'SERVER',
          tag: 'VISIBILITY_INVALID',
          statusCode: 401,
        });
      }

      return this.server;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證群組時發生預期外的錯誤: ${error.message}`,
        part: 'SERVER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
