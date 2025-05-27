import bcrypt from 'bcrypt';
import { requestAccountRecoverSchema, resetPasswordSchema } from './accountRecover.schema';
import { database } from '@/index';
import Logger from '@/utils/logger';
import { generateJWT } from '@/utils/jwt';
import StandardizedError from '@/error';
import ResetPasswordFailedError from '@/errors/ResetPasswordFailedError';
import { DataValidator } from '@/middleware/data.validator';
import { ResponseType } from '@/api/http';
import { RequestHandler } from '@/handler';
import { generateRandomString } from '@/utils';
import AccountNotFoundError from '@/errors/AccountNotFoundError';
import InvalidOrExpiredResetTokenError from '@/errors/InvalidOrExpiredResetTokenError';
import TooManyFailedAttemptsError from '@/errors/TooManyFailedAttemptsError';
import ServerError from '@/errors/ServerError';
import { getEmailHtml, sendEmail } from '@/utils/email';
import { serverConfig } from '@/config/server.config'; // Changed from appConfig

export const RequestAccountRecoverHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { account } = await DataValidator.validate(
        requestAccountRecoverSchema,
        data,
        'REQUEST_ACCOUNT_RECOVER',
      );

      const userAccount = await database.get.account(account);
      if (!userAccount) {
        throw new AccountNotFoundError('REQUEST_ACCOUNT_RECOVER');
      }

      const resetToken = generateRandomString(256);
      await database.set.accountRecover(userAccount.userId, { resetToken, tried: 0 });

      // In a real application, you would send an email with the reset link here.
      // For this example, we'll just log the reset token and a mock email content.
      const userEmail = 'user@example.com'; // Placeholder for user's email, in a real app, fetch from userAccount
      const resetLink = `${serverConfig.frontendUrl}/reset-password?userId=${userAccount.userId}&token=${resetToken}`; // Changed
      const emailSubject = 'RiceCall 密碼重設請求';
      const emailHtml = getEmailHtml(resetLink, account);

      await sendEmail(userEmail, emailSubject, emailHtml);
      new Logger('AccountRecover').info(`Password reset email sent to ${userEmail}`);

      return {
        statusCode: 200,
        message: 'success',
        data: {
          message: 'Password reset link sent to your email.',
        },
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('AccountRecover').error(error.message);

        error = new ServerError('REQUEST_ACCOUNT_RECOVER', error.message);
      }

      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

export const ResetPasswordHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId, resetToken, newPassword } = await DataValidator.validate(
        resetPasswordSchema,
        data,
        'RESET_PASSWORD',
      );

      const accountRecoverData = await database.get.accountRecover(userId);
      if (!accountRecoverData || accountRecoverData.resetToken !== resetToken) {
        throw new InvalidOrExpiredResetTokenError('RESET_PASSWORD');
      }

      if (accountRecoverData.tried >= 5) {
        throw new TooManyFailedAttemptsError('RESET_PASSWORD');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await database.set.account(accountRecoverData.userId, { password: hashedPassword });
      await database.set.accountRecover(userId, { tried: accountRecoverData.tried + 1 });

      // Clear the reset token after successful password reset
      await database.delete.accountRecover(userId);

      // Invalidate current user's tokens by updating lastActiveAt
      await database.set.user(accountRecoverData.userId, { lastActiveAt: Date.now() });

      return {
        statusCode: 200,
        message: 'success',
        data: {
          message: '密碼重設成功。',
        },
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('AccountRecover').error(error.message);

        error = new ResetPasswordFailedError();
      }

      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};
