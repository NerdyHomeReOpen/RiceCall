// Error
import StandardizedError from '@/error';

export default class ChannelValidator {
  constructor(private channel: any) {
    this.channel = channel;
  }

  async validate() {
    try {
      if (this.channel.name && this.channel.name.length > 30) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '頻道名稱不能超過30個字符',
          part: 'CHANNEL',
          tag: 'NAME_TOO_LONG',
          statusCode: 401,
        });
      }

      if (
        this.channel.voiceMode &&
        !['free', 'queue', 'forbidden'].includes(this.channel.voiceMode)
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的語音模式',
          part: 'CHANNEL',
          tag: 'VOICE_MODE_INVALID',
          statusCode: 401,
        });
      }

      if (this.channel.bitrate && this.channel.bitrate < 1000) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '比特率不能小於1000',
          part: 'CHANNEL',
          tag: 'BITRATE_INVALID',
          statusCode: 401,
        });
      }

      if (this.channel.userLimit) {
        if (this.channel.userLimit < 1 || this.channel.userLimit > 999)
          throw new StandardizedError({
            name: 'ValidationError',
            message: '人數限制必須在1-999之間',
            part: 'CHANNEL',
            tag: 'USER_LIMIT_INVALID',
            statusCode: 401,
          });
        if (this.channel.isLobby)
          throw new StandardizedError({
            name: 'ValidationError',
            message: '大廳頻道不能設置人數限制',
            part: 'CHANNEL',
            tag: 'USER_LIMIT_INVALID',
            statusCode: 401,
          });
      }

      if (
        this.channel.visibility &&
        !['public', 'member', 'private', 'readonly'].includes(
          this.channel.visibility,
        )
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的頻道可見度',
          part: 'CHANNEL',
          tag: 'VISIBILITY_INVALID',
          statusCode: 401,
        });
      }

      if (
        this.channel.password &&
        (this.channel.password.length < 1 || this.channel.password.length > 4)
      ) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '密碼長度必須在1-4個字符之間',
          part: 'CHANNEL',
          tag: 'PASSWORD_INVALID',
          statusCode: 401,
        });
      }

      return this.channel;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證頻道時發生預期外的錯誤: ${error.message}`,
        part: 'CHANNEL',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
