/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');

// Utils
const utils = require('../utils');
const { Session, JWT } = utils;

// StandardizedError
const StandardizedError = require('../standardizedError');

// Handlers
const userHandler = require('./user');
const serverHandler = require('./server');
const memberHandler = require('./member');
const channelHandler = require('./channel');
const messageHandler = require('./message');
const friendGroupHandler = require('./friendGroup');
const friendHandler = require('./friend');
const friendApplicationHandler = require('./friendApplication');
const memberApplicationHandler = require('./memberApplication');
const rtcHandler = require('./rtc');

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const jwt = socket.handshake.query.jwt;
      if (!jwt) {
        return next(
          new StandardizedError(
            '無可用的 JWT',
            'ValidationError',
            'AUTH',
            'TOKEN_MISSING',
            401,
          ),
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        return next(
          new StandardizedError(
            '無效的 token',
            'ValidationError',
            'AUTH',
            'TOKEN_INVALID',
            401,
          ),
        );
      }
      const userId = result.userId;
      if (!userId) {
        return next(
          new StandardizedError(
            '無效的 token',
            'ValidationError',
            'AUTH',
            'TOKEN_INVALID',
            401,
          ),
        );
      }

      // Generate a new session ID
      const sessionId = uuidv4();

      socket.jwt = jwt;
      socket.userId = userId;
      socket.sessionId = sessionId;

      // Save maps
      Session.createUserIdSessionIdMap(userId, sessionId);

      return next();
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `驗證時發生無法預期的錯誤: ${error.error_message}`,
          'ServerError',
          'AUTH',
          'EXCEPTION_ERROR',
          500,
        );
      }

      return next(error);
    }
  });

  io.on('connection', (socket) => {
    // Connect
    userHandler.connectUser(io, socket);
    // Disconnect
    socket.on('disconnect', () => userHandler.disconnectUser(io, socket));
    // User
    socket.on('searchUser', async (data) =>
      userHandler.searchUser(io, socket, data),
    );
    socket.on('updateUser', async (data) =>
      userHandler.updateUser(io, socket, data),
    );
    // Server
    socket.on('searchServer', async (data) =>
      serverHandler.searchServer(io, socket, data),
    );
    socket.on('connectServer', async (data) =>
      serverHandler.connectServer(io, socket, data),
    );
    socket.on('disconnectServer', async (data) =>
      serverHandler.disconnectServer(io, socket, data),
    );
    socket.on('createServer', async (data) =>
      serverHandler.createServer(io, socket, data),
    );
    socket.on('updateServer', async (data) =>
      serverHandler.updateServer(io, socket, data),
    );
    // Channel
    socket.on('connectChannel', async (data) =>
      channelHandler.connectChannel(io, socket, data),
    );
    socket.on('disconnectChannel', async (data) =>
      channelHandler.disconnectChannel(io, socket, data),
    );
    socket.on('createChannel', async (data) =>
      channelHandler.createChannel(io, socket, data),
    );
    socket.on('updateChannel', async (data) =>
      channelHandler.updateChannel(io, socket, data),
    );
    socket.on('deleteChannel', async (data) =>
      channelHandler.deleteChannel(io, socket, data),
    );
    // Friend Group
    socket.on('createFriendGroup', async (data) =>
      friendGroupHandler.createFriendGroup(io, socket, data),
    );
    socket.on('updateFriendGroup', async (data) =>
      friendGroupHandler.updateFriendGroup(io, socket, data),
    );
    socket.on('deleteFriendGroup', async (data) =>
      friendGroupHandler.deleteFriendGroup(io, socket, data),
    );
    // Member
    socket.on('createMember', async (data) =>
      memberHandler.createMember(io, socket, data),
    );
    socket.on('updateMember', async (data) =>
      memberHandler.updateMember(io, socket, data),
    );
    socket.on('deleteMember', async (data) =>
      memberHandler.deleteMember(io, socket, data),
    );
    // Friend
    socket.on('createFriend', async (data) =>
      friendHandler.createFriend(io, socket, data),
    );
    socket.on('updateFriend', async (data) =>
      friendHandler.updateFriend(io, socket, data),
    );
    socket.on('deleteFriend', async (data) =>
      friendHandler.deleteFriend(io, socket, data),
    );
    // Member Application
    socket.on('createMemberApplication', async (data) =>
      memberApplicationHandler.createMemberApplication(io, socket, data),
    );
    socket.on('updateMemberApplication', async (data) =>
      memberApplicationHandler.updateMemberApplication(io, socket, data),
    );
    socket.on('deleteMemberApplication', async (data) =>
      memberApplicationHandler.deleteMemberApplication(io, socket, data),
    );
    // Friend Application
    socket.on('createFriendApplication', async (data) =>
      friendApplicationHandler.createFriendApplication(io, socket, data),
    );
    socket.on('updateFriendApplication', async (data) =>
      friendApplicationHandler.updateFriendApplication(io, socket, data),
    );
    socket.on('deleteFriendApplication', async (data) =>
      friendApplicationHandler.deleteFriendApplication(io, socket, data),
    );
    // Message
    socket.on('message', async (data) =>
      messageHandler.sendMessage(io, socket, data),
    );
    socket.on('directMessage', async (data) =>
      messageHandler.sendDirectMessage(io, socket, data),
    );
    // RTC
    socket.on('RTCOffer', async (data) => rtcHandler.offer(io, socket, data));
    socket.on('RTCAnswer', async (data) => rtcHandler.answer(io, socket, data));
    socket.on('RTCIceCandidate', async (data) =>
      rtcHandler.candidate(io, socket, data),
    );
  });
};
