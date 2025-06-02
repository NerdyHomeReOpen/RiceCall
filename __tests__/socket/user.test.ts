import {
  ConnectServerHandler,
  DisconnectServerHandler,
} from '@/api/socket/events/server/server.handler';
import {
  ConnectUserHandler,
  DisconnectUserHandler,
  SearchUserHandler,
  UpdateUserHandler,
} from '@/api/socket/events/user/user.handler';
import StandardizedError from '@/error';
import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';
import Logger from '@/utils/logger';
import { Server, Socket } from 'socket.io';

// Mocks
jest.mock('@/middleware/data.validator');
jest.mock('@/index', () => ({
  database: {
    get: {
      searchUser: jest.fn(),
      user: jest.fn(),
    },
    set: {
      user: jest.fn(),
    },
  },
}));
jest.mock('@/utils/logger');
jest.mock('@/error');
// Mock server handlers as they are dependencies of connect/disconnect user handlers
jest.mock('@/api/socket/events/server/server.handler', () => ({
  ConnectServerHandler: {
    handle: jest.fn(),
  },
  DisconnectServerHandler: {
    handle: jest.fn(),
  },
}));

describe('User Socket Handlers', () => {
  let mockIo: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;
  const mockUserId = 'test-user-id';
  const mockSocketId = 'test-socket-id';

  beforeEach(() => {
    jest.clearAllMocks();

    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    mockSocket = {
      id: mockSocketId,
      data: { userId: mockUserId },
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    (DataValidator.validate as jest.Mock).mockImplementation(
      async (schema, data) => data,
    ); // Default mock for validate
    (Logger as jest.Mock).mockImplementation(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }));
  });

  describe('SearchUserHandler', () => {
    const searchQuery = 'testquery';
    const searchResult = [{ id: 'user1', username: 'User One' }];

    it('should validate data, call database.get.searchUser, and emit "userSearch"', async () => {
      (database.get.searchUser as jest.Mock).mockResolvedValue(searchResult);

      await SearchUserHandler.handle(mockIo, mockSocket, {
        query: searchQuery,
      });

      expect(DataValidator.validate).toHaveBeenCalledWith(
        expect.any(Object),
        { query: searchQuery },
        'SEARCHUSER',
      );
      expect(database.get.searchUser).toHaveBeenCalledWith(searchQuery);
      expect(mockSocket.emit).toHaveBeenCalledWith('userSearch', searchResult);
    });

    it('should emit "error" if DataValidator.validate throws', async () => {
      const validationError = new StandardizedError({
        name: 'ValidationError',
        message: 'Validation failed',
      });
      (DataValidator.validate as jest.Mock).mockRejectedValue(validationError);

      await SearchUserHandler.handle(mockIo, mockSocket, {
        query: searchQuery,
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', validationError);
      expect(database.get.searchUser).not.toHaveBeenCalled();
    });

    it('should emit "error" and log if database operation fails', async () => {
      const dbError = new Error('DB Error');
      (database.get.searchUser as jest.Mock).mockRejectedValue(dbError);

      await SearchUserHandler.handle(mockIo, mockSocket, {
        query: searchQuery,
      });

      expect(Logger.prototype.error).toHaveBeenCalledWith('DB Error');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.any(StandardizedError),
      );
    });
  });

  describe('UpdateUserHandler', () => {
    const userIdToUpdate = mockUserId; // Operator updates self
    const updatePayload = { username: 'newUsername' };

    it('should validate data, update user, and emit "userUpdate"', async () => {
      (database.set.user as jest.Mock).mockResolvedValue(undefined);
      // Mock get.user for the final emit, though the emitted data is `update` directly
      (database.get.user as jest.Mock).mockResolvedValue({
        id: userIdToUpdate,
        ...updatePayload,
      });

      await UpdateUserHandler.handle(mockIo, mockSocket, {
        userId: userIdToUpdate,
        user: updatePayload,
      });

      expect(DataValidator.validate).toHaveBeenCalledWith(
        expect.any(Object),
        { userId: userIdToUpdate, user: updatePayload },
        'UPDATEUSER',
      );
      expect(database.set.user).toHaveBeenCalledWith(
        userIdToUpdate,
        updatePayload,
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('userUpdate', updatePayload); // Emits the update payload directly
    });

    it('should not proceed and log warning if operatorId does not match userId', async () => {
      const otherUserId = 'other-user-id';
      await UpdateUserHandler.handle(mockIo, mockSocket, {
        userId: otherUserId,
        user: updatePayload,
      });

      expect(DataValidator.validate).toHaveBeenCalledWith(
        expect.any(Object),
        { userId: otherUserId, user: updatePayload },
        'UPDATEUSER',
      );
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `User(${mockUserId}) failed to update user(${otherUserId}): Cannot update other user data`,
      );
      expect(database.set.user).not.toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalledWith(
        'userUpdate',
        expect.anything(),
      );
    });

    it('should emit "error" if DataValidator.validate throws', async () => {
      const validationError = new StandardizedError({
        name: 'ValidationError',
        message: 'Validation failed',
      });
      (DataValidator.validate as jest.Mock).mockRejectedValue(validationError);

      await UpdateUserHandler.handle(mockIo, mockSocket, {
        userId: userIdToUpdate,
        user: updatePayload,
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', validationError);
      expect(database.set.user).not.toHaveBeenCalled();
    });

    it('should emit "error" and log if database operation fails', async () => {
      const dbError = new Error('DB Error');
      (database.set.user as jest.Mock).mockRejectedValue(dbError);

      await UpdateUserHandler.handle(mockIo, mockSocket, {
        userId: userIdToUpdate,
        user: updatePayload,
      });

      expect(Logger.prototype.error).toHaveBeenCalledWith('DB Error');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.any(StandardizedError),
      );
    });
  });

  describe('ConnectUserHandler', () => {
    const mockUser = {
      id: mockUserId,
      username: 'Test',
      currentServerId: null,
      currentChannelId: null,
    };
    const mockUserInServer = {
      id: mockUserId,
      username: 'Test',
      currentServerId: 'server1',
      currentChannelId: 'channel1',
    };

    beforeEach(() => {
      (database.get.user as jest.Mock).mockResolvedValue(mockUser); // Default: user not in server
      (database.set.user as jest.Mock).mockResolvedValue(undefined);
      (DisconnectServerHandler.handle as jest.Mock).mockResolvedValue(
        undefined,
      );
      (ConnectServerHandler.handle as jest.Mock).mockResolvedValue(undefined);
    });

    it('should update lastActiveAt and emit "userUpdate"', async () => {
      await ConnectUserHandler.handle(mockIo, mockSocket);

      expect(database.get.user).toHaveBeenCalledWith(mockUserId);
      expect(database.set.user).toHaveBeenCalledWith(mockUserId, {
        lastActiveAt: expect.any(Number),
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('userUpdate', mockUser); // Assumes get.user returns the latest
      expect(Logger.prototype.info).toHaveBeenCalledWith(
        `User(${mockUserId}) connected`,
      );
    });

    it('should call DisconnectServerHandler and ConnectServerHandler if user was in a server', async () => {
      (database.get.user as jest.Mock).mockResolvedValue(mockUserInServer); // User is in a server

      await ConnectUserHandler.handle(mockIo, mockSocket);

      expect(DisconnectServerHandler.handle).toHaveBeenCalledWith(
        mockIo,
        mockSocket,
        { userId: mockUserId, serverId: mockUserInServer.currentServerId },
      );
      expect(ConnectServerHandler.handle).toHaveBeenCalledWith(
        mockIo,
        mockSocket,
        { userId: mockUserId, serverId: mockUserInServer.currentServerId },
      );
      expect(database.set.user).toHaveBeenCalledWith(mockUserId, {
        lastActiveAt: expect.any(Number),
      });
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'userUpdate',
        mockUserInServer,
      );
    });

    it('should emit "error" and log if database.get.user fails', async () => {
      const dbError = new Error('DB Get Error');
      (database.get.user as jest.Mock).mockRejectedValue(dbError);

      await ConnectUserHandler.handle(mockIo, mockSocket);

      expect(Logger.prototype.error).toHaveBeenCalledWith('DB Get Error');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.any(StandardizedError),
      );
    });
  });

  describe('DisconnectUserHandler', () => {
    const mockUser = {
      id: mockUserId,
      username: 'Test',
      currentServerId: null,
      currentChannelId: null,
    };
    const mockUserInServer = {
      id: mockUserId,
      username: 'Test',
      currentServerId: 'server1',
      currentChannelId: 'channel1',
    };

    beforeEach(() => {
      (database.get.user as jest.Mock).mockResolvedValue(mockUser); // Default: user not in server
      (database.set.user as jest.Mock).mockResolvedValue(undefined);
      (DisconnectServerHandler.handle as jest.Mock).mockResolvedValue(
        undefined,
      );
    });

    it('should update lastActiveAt and emit "userUpdate" with null', async () => {
      await DisconnectUserHandler.handle(mockIo, mockSocket);

      expect(database.get.user).toHaveBeenCalledWith(mockUserId);
      expect(database.set.user).toHaveBeenCalledWith(mockUserId, {
        lastActiveAt: expect.any(Number),
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('userUpdate', null);
      expect(Logger.prototype.info).toHaveBeenCalledWith(
        `User(${mockUserId}) disconnected`,
      );
    });

    it('should call DisconnectServerHandler if user was in a server', async () => {
      (database.get.user as jest.Mock).mockResolvedValue(mockUserInServer);

      await DisconnectUserHandler.handle(mockIo, mockSocket);

      expect(DisconnectServerHandler.handle).toHaveBeenCalledWith(
        mockIo,
        mockSocket,
        { userId: mockUserId, serverId: mockUserInServer.currentServerId },
      );
      expect(database.set.user).toHaveBeenCalledWith(mockUserId, {
        lastActiveAt: expect.any(Number),
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('userUpdate', null);
    });

    it('should emit "error" and log if database.get.user fails', async () => {
      const dbError = new Error('DB Get Error');
      (database.get.user as jest.Mock).mockRejectedValue(dbError);

      await DisconnectUserHandler.handle(mockIo, mockSocket);

      expect(Logger.prototype.error).toHaveBeenCalledWith('DB Get Error');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.any(StandardizedError),
      );
    });
  });
});
