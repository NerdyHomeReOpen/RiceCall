import nodemailer from 'nodemailer';
import { serverConfig } from '@/config/server.config'; // Changed from emailConfig
import Logger from '@/utils/logger';

const transporter = nodemailer.createTransport(serverConfig.email); // Changed

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments?: nodemailer.SendMailOptions['attachments'],
) => {
  try {
    await transporter.sendMail({
      from: serverConfig.email.from, // Changed
      to,
      subject,
      html,
      attachments,
    });
    new Logger('EmailService').info(`Email sent to ${to} with subject: ${subject}`);
  } catch (error) {
    new Logger('EmailService').error(`Error sending email to ${to}: ${error}`);
    throw error;
  }
};

export const getEmailHtml = (resetLink: string, account: string): string => {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head></head>
<body>
<table style="border:transparent solid 0px; border-collapse: collapse; width: 100%; height: 54px;" border="1 ">
<tbody>
<tr style="height: 18px;">
<td style="width: 100%; background-color: #0073c6; height: 35px;"></td>
</tr>
<tr style="height: 18px;">
<td style="width: 100%; height: 18px;">
<img src="cid:login_logo" alt="RiceCall Logo" style="display: block; margin: 0 auto; max-width: 100%; height: auto;" />
<div align="center">
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="font-size: 1px; line-height: 1px; border-top: 1px solid #dddddd;"><span style="word-break: break-word;"> </span></td>
</tr>
</tbody>
</table>
</div>
<div align="center">
<div style="width: 480px;" align="left">
<p style="font-family: Roboto-Regular,Helvetica,Arial,sans-serif; font-size: 16px;">您好 ${account}，</p>
<p style="font-family: Roboto-Regular,Helvetica,Arial,sans-serif; font-size: 16px;">您已要求重設您的 RiceCall 帳號密碼。<br />請點擊以下連結重設您的帳號密碼：</p>
<div class="alignment" align="center"><center dir="false" style="color: #ffffff; font-family: sans-serif; font-size: 15px;">
<a href="${resetLink}">
<span class="button" style="background-color: #0073c6; border-radius: 4px; color: #ffffff; display: inline-block; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 15px; font-weight: 400; mso-border-alt: none; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal; border: 0px solid transparent; padding: 10px 55px 10px 55px;">
<span style="font-family: Roboto-Regular,Helvetica,Arial,sans-serif; word-break: break-word; line-height: 30px; font-size: 14px;">重設密碼
</span>
</span>
</a>
</center></div>
<br />
<p style="font-family: Roboto-Regular,Helvetica,Arial,sans-serif; font-size: 16px;">如果您沒有發出此請求，請忽略此電子郵件。</p>
<p style="font-family: Roboto-Regular,Helvetica,Arial,sans-serif; font-size: 16px;">此致，<br />RiceCall 團隊</p>
</div>
</div>
<div align="center">
<table role="presentation" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="font-size: 1px; line-height: 1px; border-top: 1px solid #dddddd;"><span style="word-break: break-word;"> </span></td>
</tr>
</tbody>
</table>
</div>
</td>
</tr>
<tr style="height: 18px;">
<td style="background-color: #f4f4f5; width: 100%; height: 18px;">
<div align="center">
<div style="width:480px" align="left">
<p style="font-family: Roboto-Regular,Helvetica,Arial,sans-serif; color: #444a5b; font-size: 12px;">如果您在點擊「重設密碼」按鈕時遇到問題，請嘗試使用以下連結： <br /><a href="${resetLink}" style="text-decoration: underline; color: #0073c6;">${resetLink}</a></p>
</div>
</div>
</td>
</tr>
</tbody>
</table>
<p style="font-family: Roboto-Regular,Helvetica,Arial,sans-serif;">&nbsp;</p>
</body>
</html>

`

}
