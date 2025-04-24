const session = {
  userToSession: new Map<string, string>(), // userId -> sessionId
  sessionToUser: new Map<string, string>(), // sessionId -> userId

  createUserIdSessionIdMap: (userId: string, sessionId: string) => {
    session.userToSession.set(userId, sessionId);
    session.sessionToUser.set(sessionId, userId);
  },

  deleteUserIdSessionIdMap: (userId?: string, sessionId?: string) => {
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

export default session;
