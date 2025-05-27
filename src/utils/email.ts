import nodemailer from 'nodemailer';
import { serverConfig } from '@/config/server.config'; // Changed from emailConfig
import Logger from '@/utils/logger';

const transporter = nodemailer.createTransport(serverConfig.email); // Changed

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: serverConfig.email.from, // Changed
      to,
      subject,
      html,
    });
    new Logger('EmailService').info(`Email sent to ${to} with subject: ${subject}`);
  } catch (error) {
    new Logger('EmailService').error(`Error sending email to ${to}: ${error}`);
    throw error;
  }
};
