import SocketServer from '@/api/socket'; // Adjust path as needed
import EventRouteInitializer from '@/api/socket/events/routes'; // Adjust
import {
  ConnectUserHandler,
  DisconnectUserHandler,
} from '@/api/socket/events/user/user.handler'; // Adjust
import { AuthValidator } from '@/middleware/auth.validator';
import Logger from '@/utils/logger';
import http from 'http';
import { Server, Socket } from 'socket.io';

// Mocks
jest.mock('http');
jest.mock('socket.io');
jest.mock('@/middleware/auth.validator');
jest.mock('@/api/socket/events/user/user.handler');
jest.mock('@/api/socket/events/routes');
jest.mock('@/utils/logger');

describe('SocketServer', () => {
  let mockHttpServer: jest.Mocked<http.Server>;
  let socketServer: SocketServer;
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockHttpServer = new http.Server() as jest.Mocked<http.Server>;
    mockIoInstance = {
      use: jest.fn(),
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        sockets: new Map(), // For getSocket
      } as any,
      disconnectSockets: jest.fn(), // For io.to(socketId).disconnectSockets()
    } as unknown as jest.Mocked<Server>;

    // Mock the Server constructor to return our mockIoInstance
    (Server as jest.Mock).mockImplementation(() => mockIoInstance);

    socketServer = new SocketServer(mockHttpServer);

    mockSocket = {
      handshake: { query: {} },
      data: {},
      emit: jest.fn(),
      on: jest.fn(),
      disconnectSockets: jest.fn(), // for socket.disconnectSockets()
      removeAllListeners: jest.fn(),
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    // Mock logger to prevent actual logging during tests
    (Logger as jest.Mock).mockImplementation(() => ({
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    }));
  });

  describe('constructor and setup', () => {
    it('should create a Socket.IO server instance with correct CORS options on setup', () => {
      socketServer.setup();
      expect(Server).toHaveBeenCalledWith(mockHttpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      });
      expect(SocketServer.io).toBe(mockIoInstance);
    });

    it('should register middleware using io.use', () => {
      socketServer.setup();
      expect(mockIoInstance.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should register "connection" event listener using io.on', () => {
      socketServer.setup();
      expect(mockIoInstance.on).toHaveBeenCalledWith(
        'connection',
        expect.any(Function),
      );
    });
  });

  describe('Middleware Authentication', () => {
    let middlewareFunc: (
      socket: Socket,
      next: (err?: any) => void,
    ) => Promise<void>;
    const mockNext = jest.fn();

    beforeEach(() => {
      socketServer.setup();
      middlewareFunc = mockIoInstance.use.mock.calls[0][0]; // Get the middleware function
    });

    it('should call next() without error if AuthValidator.validate succeeds', async () => {
      mockSocket.handshake.query = { token: 'valid-token' };
      (AuthValidator.validate as jest.Mock).mockResolvedValue('test-user-id');

      await middlewareFunc(mockSocket, mockNext);

      expect(AuthValidator.validate).toHaveBeenCalledWith('valid-token');
      expect(mockSocket.data.userId).toBe('test-user-id');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next(error) if AuthValidator.validate throws an error', async () => {
      mockSocket.handshake.query = { token: 'invalid-token' };
      const authError = new Error('Auth failed');
      (AuthValidator.validate as jest.Mock).mockRejectedValue(authError);

      await middlewareFunc(mockSocket, mockNext);

      expect(AuthValidator.validate).toHaveBeenCalledWith('invalid-token');
      expect(mockSocket.emit).toHaveBeenCalledWith('openPopup', {
        type: 'dialogAlert',
        id: 'logout',
        initialData: {
          title: 'Auth failed',
          submitTo: 'logout',
        },
      });
      expect(mockNext).toHaveBeenCalledWith(authError);
    });

    it('should handle existing socket connection for the same user ID', async () => {
      const existingSocketId = 'existing-socket-id';
      const newUserId = 'test-user-id';
      SocketServer.userSocketMap.set(newUserId, existingSocketId);
      // Mock that the existing socket is actually in io.sockets.sockets
      (mockIoInstance.sockets.sockets as Map<string, Socket>).set(
        existingSocketId,
        { disconnect: jest.fn(), emit: jest.fn() } as any,
      );

      mockSocket.handshake.query = { token: 'valid-token' };
      (AuthValidator.validate as jest.Mock).mockResolvedValue(newUserId);

      await middlewareFunc(mockSocket, mockNext);

      expect(mockIoInstance.to).toHaveBeenCalledWith(existingSocketId);
      // The first emit is for the openPopup
      expect(mockIoInstance.emit).toHaveBeenCalledWith(
        'openPopup',
        expect.objectContaining({
          initialData: { title: '另一個設備已登入，請重新登入' },
        }),
      );
      // Check if disconnectSockets was called on the group of sockets for the existingSocketId
      expect(mockIoInstance.disconnectSockets).toHaveBeenCalled(); // This was part of the mockIoInstance.to(existingSocketId).disconnectSockets(); chain
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Connection Handling', () => {
    let connectionCallback: (socket: Socket) => Promise<void>;

    beforeEach(() => {
      socketServer.setup();
      // Find the connection callback
      const connectionEventCall = mockIoInstance.on.mock.calls.find(
        (call) => call[0] === 'connection',
      );
      if (!connectionEventCall)
        throw new Error('Connection event handler not registered');
      connectionCallback = connectionEventCall[1];
      mockSocket.data.userId = 'test-user-id'; // Assume middleware has set this
    });

    it('should add user to userSocketMap and call ConnectUserHandler.handle on connection', async () => {
      await connectionCallback(mockSocket);

      expect(SocketServer.userSocketMap.get('test-user-id')).toBe(
        'test-socket-id',
      );
      expect(ConnectUserHandler.handle).toHaveBeenCalledWith(
        mockIoInstance,
        mockSocket,
      );
    });

    it('should register "disconnecting" and "disconnect" event listeners on socket', async () => {
      await connectionCallback(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith(
        'disconnecting',
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function),
      );
    });

    it('should call EventRouteInitializer', async () => {
      await connectionCallback(mockSocket);
      expect(EventRouteInitializer).toHaveBeenCalledWith(expect.any(Object)); // Check for EventRouters instance
    });

    it('should handle "ping" event and emit "pong"', async () => {
      await connectionCallback(mockSocket);
      const pingEventCall = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'ping',
      );
      if (!pingEventCall) throw new Error('Ping event handler not registered');
      const pingCallback = pingEventCall[1];
      await pingCallback();
      expect(mockSocket.emit).toHaveBeenCalledWith('pong', 'pong');
    });
  });

  describe('Disconnection Handling', () => {
    let connectionCallback: (socket: Socket) => Promise<void>;
    let disconnectingCallback: () => Promise<void>;
    let disconnectCallback: () => Promise<void>;

    beforeEach(async () => {
      socketServer.setup();
      const connectionEventCall = mockIoInstance.on.mock.calls.find(
        (call) => call[0] === 'connection',
      );
      if (!connectionEventCall)
        throw new Error('Connection event handler not registered');
      connectionCallback = connectionEventCall[1];

      mockSocket.data.userId = 'test-user-id';
      SocketServer.userSocketMap.set('test-user-id', 'test-socket-id');

      await connectionCallback(mockSocket);

      const disconnectingCall = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'disconnecting',
      );
      if (disconnectingCall) disconnectingCallback = disconnectingCall[1];
      else throw new Error("'disconnecting' handler not registered on socket");

      const disconnectCall = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'disconnect',
      );
      if (disconnectCall) disconnectCallback = disconnectCall[1];
      else throw new Error("'disconnect' handler not registered on socket");
    });

    it('on "disconnecting", should remove all listeners, delete from userSocketMap, and call DisconnectUserHandler.handle', async () => {
      await disconnectingCallback();

      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(SocketServer.userSocketMap.has('test-user-id')).toBe(false);
      expect(DisconnectUserHandler.handle).toHaveBeenCalledWith(
        mockIoInstance,
        mockSocket,
      );
    });

    it('on "disconnect", should remove all listeners, delete from userSocketMap, and call DisconnectUserHandler.handle', async () => {
      mockSocket.removeAllListeners.mockClear();
      SocketServer.userSocketMap.set('test-user-id', 'test-socket-id'); // Re-set for this specific test
      (DisconnectUserHandler.handle as jest.Mock).mockClear();

      await disconnectCallback();

      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(SocketServer.userSocketMap.has('test-user-id')).toBe(false);
      expect(DisconnectUserHandler.handle).toHaveBeenCalledWith(
        mockIoInstance,
        mockSocket,
      );
    });
  });

  describe('Static Methods', () => {
    // For static methods, SocketServer.io needs to be set.
    // We can call setup once here or mock SocketServer.io directly if preferred.
    beforeAll(() => {
      const tempHttpServer = new http.Server();
      const serverForStaticSetup = new SocketServer(tempHttpServer);
      serverForStaticSetup.setup(); // This sets the static SocketServer.io
    });

    it('hasSocket should return true if user ID exists in map', () => {
      SocketServer.userSocketMap.set('user1', 'socket1');
      expect(SocketServer.hasSocket('user1')).toBe(true);
    });

    it('hasSocket should return false if user ID does not exist in map', () => {
      SocketServer.userSocketMap.delete('user1');
      expect(SocketServer.hasSocket('user1')).toBe(false);
    });

    it('getSocket should return socket if user and socket exist', () => {
      const userId = 'user2';
      const socketId = 'socket2';
      const mockUserSocketInstance = { id: socketId } as Socket;
      SocketServer.userSocketMap.set(userId, socketId);
      // Ensure SocketServer.io and its nested properties are properly mocked for this static call
      (SocketServer.io.sockets.sockets as Map<string, Socket>).set(
        socketId,
        mockUserSocketInstance,
      );

      expect(SocketServer.getSocket(userId)).toBe(mockUserSocketInstance);
    });

    it('getSocket should return null if user ID does not exist in map', () => {
      SocketServer.userSocketMap.delete('nonexistentuser'); // Ensure clean state
      expect(SocketServer.getSocket('nonexistentuser')).toBeNull();
    });

    it('getSocket should return null if socket ID from map does not exist in io.sockets', () => {
      const userId = 'user3';
      const socketId = 'socket3-ghost';
      SocketServer.userSocketMap.set(userId, socketId);
      (SocketServer.io.sockets.sockets as Map<string, Socket>).delete(socketId); // Ensure it's not in the actual sockets map

      expect(SocketServer.getSocket(userId)).toBeNull();
    });
  });
});
