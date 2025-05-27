export const serverConfig = {
  url: process.env.SERVER_URL || 'http://localhost',
  port: parseInt(process.env.SERVER_PORT || '4500'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'your_email@example.com',
      pass: process.env.EMAIL_PASSWORD || 'your_email_password',
    },
    from: process.env.EMAIL_FROM || 'Your App Team <no-reply@example.com>',
  },
};
