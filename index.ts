// Error
import StandardizedError from './error';

// Utils
import Logger from './utils/logger';

// HTTP Server
import HttpServer from './api/http';

// Socket Server
import SocketServer from './api/socket';

// HTTP Server
const httpServer = new HttpServer(4500).setup();

// Socket Server
const socketServer = new SocketServer(httpServer).setup();

// const server = http.createServer((req, res) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, PATCH');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//   if (req.method === 'OPTIONS') {
//     res.writeHead(200);
//     res.end();
//     return;
//   }

//   if (req.method == 'POST' && req.url == '/login') {
//   }

//   if (req.method == 'POST' && req.url == '/register') {
//   }

//   // Refresh
//   if (req.method == 'POST' && req.url.startsWith('/refresh')) {
//     let body = '';
//     req.on('data', (chunk) => {
//       body += chunk.toString();
//     });
//     if (req.url == '/refresh/user') {
//     }

//     if (req.url == '/refresh/userFriends') {
//     }

//     if (req.url == '/refresh/userFriendGroups') {
//     }

//     if (req.url == '/refresh/userFriendApplications') {
//     }

//     if (req.url == '/refresh/userServers') {
//     }

//     if (req.url == '/refresh/server') {
//     }

//     if (req.url == '/refresh/serverChannels') {
//       }

//     if (req.url == '/refresh/serverMembers') {
//       }

//     if (req.url == '/refresh/serverMemberApplications') {
//       }

//     if (req.url == '/refresh/channel') {
//       }

//     if (req.url == '/refresh/friendGroup') {
//       }

//     if (req.url == '/refresh/member') {
//       }

//     if (req.url == '/refresh/memberApplication') {
//       }

//     if (req.url == '/refresh/friend') {
//       }

//     if (req.url == '/refresh/friendApplication') {
//       }

//   if (req.method === 'GET' && req.url.startsWith('/images/')) {
//     req.on('end', async () => {
//       try {
//         const filePath = req.url
//           .replace('/images/', '/')
//           .split('?')[0]
//           .split('/');
//         const fileName = filePath.pop() || '__default.png';
//         const file = await imageSystem.getImage(filePath, fileName);

//
//       } catch (error) {
//         if (!(error instanceof StandardizedError)) {
//           error = new StandardizedError(
//             `讀取檔案時發生預期外的錯誤: ${error.message}`,
//             'ServerError',
//             'GETFILE',
//             'EXCEPTION_ERROR',
//             500,
//           );
//         }
//         sendError(res, error.status_code, error.error_message);
//         new Logger('Server').error(`Get file error: ${error.error_message}`);
//       }
//     });
//     return;
//   }

//   if (req.method == 'POST' && req.url == '/upload') {
//     return;
//   }

//   sendSuccess(res, { message: 'Hello World!' });
//   return;
// });

// Error Handling
process.on('uncaughtException', (error: any) => {
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError({
      name: 'ServerError',
      message: `未處理的例外: ${error.message}`,
      part: 'SERVER',
      tag: 'UNCAUGHT_EXCEPTION',
      statusCode: 500,
    });
  }
  new Logger('Server').error(`Uncaught Exception: ${error.error_message}`);
});

process.on('unhandledRejection', (error: any) => {
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError({
      message: `未處理的拒絕: ${error.message}`,
      name: 'ServerError',
      part: 'SERVER',
      tag: 'UNHANDLED_REJECTION',
      statusCode: 500,
    });
  }
  new Logger('Server').error(`Unhandled Rejection: ${error.error_message}`);
});

// Start Server
// server.listen(PORT, () => {
//   new Logger('Server').success(`Server is running on port ${PORT}`);
//   xpSystem.setup();
//   imageSystem.setup();
// });
