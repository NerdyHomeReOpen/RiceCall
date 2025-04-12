const session = {
  userToSession: new Map(), // userId -> sessionId
  sessionToUser: new Map(), // sessionId -> userId

  createUserIdSessionIdMap: (userId, sessionId) => {
    session.userToSession.set(userId, sessionId);
    session.sessionToUser.set(sessionId, userId);
  },
  deleteUserIdSessionIdMap: (userId = null, sessionId = null) => {
    if (userId && session.userToSession.has(userId)) {
      const _sessionId = session.userToSession.get(userId);
      if (sessionId == _sessionId) session.userToSession.delete(userId);
    }
    if (sessionId && session.sessionToUser.has(sessionId)) {
      const _userId = session.sessionToUser.get(sessionId);
      if (userId == _userId) session.sessionToUser.delete(sessionId);
    }
  },
};

module.exports = { ...session };
