/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const path = require('path');
const formidable = require('formidable');

// Utils
const { Logger, Func, JWT } = require('./utils');

// Systems
const imageSystem = require('./systems/image');
const xpSystem = require('./systems/xp');

// Database
const DB = require('./database');

// StandardizedError
const StandardizedError = require('./error');

// Constants
const PORT = process.env.PORT || 4500;
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4500';
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

// Send Error/Success Response
const sendError = (res, statusCode, message) => {
  res.writeHead(statusCode, CONTENT_TYPE_JSON);
  res.end(JSON.stringify({ error: message }));
};

const sendSuccess = (res, data) => {
  res.writeHead(200, CONTENT_TYPE_JSON);
  res.end(JSON.stringify(data));
};

// HTTP Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method == 'POST' && req.url == '/login') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        // data = {
        //   "password": "123456",
        //   "account": "test",
        // }

        // Get database
        const { account, password } = data;

        // Validate data
        if (!account || !password) {
          throw new StandardizedError(
            '無效的帳號或密碼',
            'ValidationError',
            'LOGIN',
            'INVALID_ACCOUNT_OR_PASSWORD',
            401,
          );
        }
        const accountData = await DB.get.account(account);
        if (!accountData) {
          throw new StandardizedError(
            '帳號或密碼錯誤',
            'ValidationError',
            'LOGIN',
            'INVALID_ACCOUNT_OR_PASSWORD',
            401,
          );
        }
        const isPasswordVerified = await bcrypt.compare(
          password,
          accountData.password,
        );
        if (!isPasswordVerified) {
          throw new StandardizedError(
            '帳號或密碼錯誤',
            'ValidationError',
            'LOGIN',
            'INVALID_ACCOUNT_OR_PASSWORD',
            401,
          );
        }
        const userId = accountData.userId;
        if (!userId) {
          throw new StandardizedError(
            '用戶不存在',
            'ValidationError',
            'LOGIN',
            'USER_NOT_FOUND',
            404,
          );
        }
        const user = await DB.get.user(userId);
        if (!user) {
          throw new StandardizedError(
            '用戶不存在',
            'ValidationError',
            'LOGIN',
            'USER_NOT_FOUND',
            404,
          );
        }

        // Update user
        await DB.set.user(userId, {
          ...user.data,
          lastActiveAt: Date.now(),
        });

        // Generate JWT token
        const token = JWT.generateToken({
          userId,
        });

        sendSuccess(res, {
          message: '登入成功',
          data: { token: token },
        });
        new Logger('Auth').success(`User logged in: ${account}`);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `登入時發生預期外的錯誤: ${error.message}`,
            'ServerError',
            'LOGIN',
            'SERVER_ERROR',
            500,
          );
        }

        sendError(res, error.status_code, error.error_message);
        new Logger('Auth').error(`Login error: ${error.error_message}`);
      }
    });
    return;
  }

  if (req.method == 'POST' && req.url == '/register') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        // data = {
        //   "account": "test",
        //   "password": "123456",
        //   "username": "test",
        // }

        // Get database
        const { account, password, username } = data;

        // Validate data
        Func.validate.account(account.trim());
        Func.validate.password(password.trim());
        Func.validate.nickname(username.trim());

        const accountData = await DB.get.account(account);
        if (accountData) {
          throw new StandardizedError(
            '帳號已存在',
            'ValidationError',
            'REGISTER',
            'ACCOUNT_ALREADY_EXISTS',
            401,
          );
        }

        // Create user data
        const userId = uuidv4();
        await DB.set.user(userId, {
          name: username,
          avatar: userId,
          avatarUrl: `data:image/png;base64,${SERVER_URL}/images/userAvatars/`,
          createdAt: Date.now(),
        });

        var hashedPassword = await bcrypt.hash(password, 10);
        // Create account password list
        await DB.set.account(account, {
          password: hashedPassword,
          userId: userId,
        });

        sendSuccess(res, {
          message: '註冊成功',
          data: {
            // user: await Get.user(user.id),
          },
        });
        new Logger('Auth').success(`User registered: ${account}`);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `註冊時發生預期外的錯誤: ${error.message}`,
            'ServerError',
            'REGISTER',
            'SERVER_ERROR',
            500,
          );
        }

        sendError(res, error.status_code, error.error_message);
        new Logger('Auth').error(`Register error: ${error.error_message}`);
      }
    });
    return;
  }

  // Refresh
  if (req.method == 'POST' && req.url.startsWith('/refresh')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    if (req.url == '/refresh/user') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { userId } = data;
          if (!userId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHUSER',
              'DATA_INVALID',
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.user(userId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHUSER',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/userFriends') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { userId } = data;
          if (!userId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHUSERFRIENDS',
              'DATA_INVALID',
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.userFriends(userId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHUSERFRIENDS',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/userFriendGroups') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { userId } = data;
          if (!userId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHUSERFRIENDGROUPS',
              'DATA_INVALID',
              400,
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.userFriendGroups(userId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHUSERFRIENDGROUPS',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/userFriendApplications') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { userId } = data;
          if (!userId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHUSERFRIENDAPPLICATIONS',
              'DATA_INVALID',
              400,
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.userFriendApplications(userId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHUSERFRIENDAPPLICATIONS',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/userServers') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { userId } = data;
          if (!userId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHUSERSERVERS',
              'DATA_INVALID',
              400,
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.userServers(userId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHUSERSERVERS',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/server') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { serverId } = data;
          if (!serverId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHSERVER',
              'DATA_INVALID',
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.server(serverId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHSERVER',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/serverChannels') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { serverId } = data;
          if (!serverId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHSERVERCHANNELS',
              'DATA_INVALID',
              400,
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.serverChannels(serverId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHSERVERCHANNELS',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/serverMembers') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { serverId } = data;
          if (!serverId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHSERVERMEMBERS',
              'DATA_INVALID',
              400,
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.serverMembers(serverId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHSERVERMEMBERS',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/serverMemberApplications') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { serverId } = data;
          if (!serverId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHSERVERMEMBERAPPLICATIONS',
              'DATA_INVALID',
              400,
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.serverMemberApplications(serverId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHSERVERMEMBERAPPLICATIONS',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/channel') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { channelId } = data;
          if (!channelId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHCHANNEL',
              'DATA_INVALID',
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.channel(channelId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHCHANNEL',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/friendGroup') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { friendGroupId } = data;
          if (!friendGroupId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHFRIENDGROUP',
              'DATA_INVALID',
              400,
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.friendGroup(friendGroupId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHFRIENDGROUP',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/member') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { userId, serverId } = data;
          if (!userId || !serverId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHMEMBER',
              'DATA_INVALID',
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.member(userId, serverId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHMEMBER',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/memberApplication') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { userId, serverId } = data;
          if (!userId || !serverId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHMEMBERAPPLICATION',
              'DATA_INVALID',
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.memberApplication(userId, serverId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHMEMBERAPPLICATION',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/friend') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { userId, targetId } = data;
          if (!userId || !targetId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHFRIEND',
              'DATA_INVALID',
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.friend(userId, targetId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHFRIEND',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }

    if (req.url == '/refresh/friendApplication') {
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { senderId, receiverId } = data;
          if (!senderId || !receiverId) {
            throw new StandardizedError(
              '無效的資料',
              'ValidationError',
              'REFRESHFRIENDAPPLICATION',
              'DATA_INVALID',
            );
          }
          sendSuccess(res, {
            message: 'success',
            data: await DB.get.friendApplication(senderId, receiverId),
          });
        } catch (error) {
          if (!(error instanceof StandardizedError)) {
            error = new StandardizedError(
              `刷新資料時發生預期外的錯誤: ${error.message}`,
              'ServerError',
              'REFRESHFRIENDAPPLICATION',
              'EXCEPTION_ERROR',
              500,
            );
          }
          sendError(res, error.status_code, error.error_message);
          new Logger('Server').error(`Refresh error: ${error.error_message}`);
        }
      });
      return;
    }
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/images/')) {
    req.on('end', async () => {
      try {
        const filePath = req.url
          .replace('/images/', '/')
          .split('?')[0]
          .split('/');
        const fileName = filePath.pop() || '__default.png';
        const file = await imageSystem.getImage(filePath, fileName);

        res.writeHead(200, {
          'Content-Type':
            MIME_TYPES[path.extname(fileName).toLowerCase()] ||
            'application/octet-stream',
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Expires': '0',
          'Pragma': 'no-cache',
        });
        res.end(file);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `讀取檔案時發生預期外的錯誤: ${error.message}`,
            'ServerError',
            'GETFILE',
            'EXCEPTION_ERROR',
            500,
          );
        }
        sendError(res, error.status_code, error.error_message);
        new Logger('Server').error(`Get file error: ${error.error_message}`);
      }
    });
    return;
  }

  if (req.method == 'POST' && req.url == '/upload') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields) => {
      try {
        if (err) throw new Error('Error parsing form data');

        const { _type, _fileName, _file } = fields;
        if (!_type || !_fileName || !_file) {
          throw new StandardizedError(
            '無效的資料',
            'ValidationError',
            'UPLOADAVATAR',
            'DATA_INVALID',
            400,
          );
        }
        const { type, fileName, file } = {
          type: _type[0],
          fileName: _fileName[0],
          file: _file[0],
        };
        if (!type || !fileName || !file) {
          throw new StandardizedError(
            '無效的資料',
            'ValidationError',
            'UPLOADAVATAR',
            'DATA_INVALID',
            400,
          );
        }

        sendSuccess(res, {
          message: 'success',
          data: {
            avatar: fileName,
            avatarUrl: `${SERVER_URL}/images/${Path()}/${fullFileName}`,
          },
        });
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `上傳頭像時發生預期外的錯誤: ${error.message}`,
            'ServerError',
            'UPLOADAVATAR',
            'EXCEPTION_ERROR',
            500,
          );
        }
        sendError(res, error.status_code, error.error_message);
        new Logger('Server').error(
          `Upload avatar error: ${error.error_message}`,
        );
      }
    });
    return;
  }

  sendSuccess(res, { message: 'Hello World!' });
  return;
});

// Socket Server
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
  },
});

require('./api/socket/index')(io);

// Error Handling
server.on('error', (error) => {
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError(
      `伺服器發生預期外的錯誤: ${error.message}`,
      'ServerError',
      'SERVER_ERROR',
      'SERVER_ERROR',
      500,
    );
  }
  new Logger('Server').error(`Server error: ${error.error_message}`);
});

process.on('uncaughtException', (error) => {
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError(
      `未處理的例外: ${error.message}`,
      'ServerError',
      'UNCAUGHT_EXCEPTION',
      'SERVER_ERROR',
      500,
    );
  }
  new Logger('Server').error(`Uncaught Exception: ${error.error_message}`);
});

process.on('unhandledRejection', (error) => {
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError(
      `未處理的拒絕: ${error.message}`,
      'ServerError',
      'UNHANDLED_REJECTION',
      'SERVER_ERROR',
      500,
    );
  }
  new Logger('Server').error(`Unhandled Rejection: ${error.error_message}`);
});

// Start Server
server.listen(PORT, () => {
  new Logger('Server').success(`Server is running on port ${PORT}`);
  xpSystem.setup();
  imageSystem.setup();
});
