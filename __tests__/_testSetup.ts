// __tests__/_testSetup.ts
import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';
import Database from '../src/database'; // Reverted to @/index, please confirm correct path

// Database Mock Type Helper
type DeepMocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? jest.MockedFunction<T[K]>
    : T[K] extends object
    ? DeepMocked<T[K]>
    : T[K];
};

// Database Mock
export const mockDatabase: DeepMocked<Database> = {
  query: jest.fn() as jest.MockedFunction<Database['query']>,

  get: {
    searchUser: jest.fn(),
    searchServer: jest.fn(),
    user: jest.fn(),
    server: jest.fn(),
    member: jest.fn(),
    message: jest.fn(),
    serverMembers: jest.fn(),
    serverUsers: jest.fn(),
    channel: jest.fn(),
    channelMessages: jest.fn(),
    channelInfoMessages: jest.fn(),
    channelChildren: jest.fn(),
    channelUsers: jest.fn(),
    directMessages: jest.fn(),
    memberApplication: jest.fn(),
    serverApplications: jest.fn(),
    serverMemberApplications: jest.fn(),
    friendGroup: jest.fn(),
    userFriendGroups: jest.fn(),
    friend: jest.fn(),
    userFriends: jest.fn(),
    friendApplication: jest.fn(),
    userFriendApplications: jest.fn(),
    serverChannels: jest.fn(),
    friendGroupFriends: jest.fn(),
    userServers: jest.fn(),
    userServer: jest.fn(),
    allUserServerData: jest.fn(),
    allServerData: jest.fn(),
  } as any, // Using 'as any' temporarily if Database type is complex and causes issues here
  set: {
    user: jest.fn(),
    server: jest.fn(),
    channel: jest.fn(),
    userServer: jest.fn(),
    directMessage: jest.fn(),
    message: jest.fn(),
    member: jest.fn(),
    memberApplication: jest.fn(),
    serverApplication: jest.fn(),
    friendGroup: jest.fn(),
    friend: jest.fn(),
    friendApplication: jest.fn(),
  } as any,
  delete: {
    channel: jest.fn(),
    message: jest.fn(),
    friend: jest.fn(),
    friendApplication: jest.fn(),
    friendGroup: jest.fn(),
    userServer: jest.fn(),
    server: jest.fn(),
    member: jest.fn(),
  } as any,
};

// DataValidator Mock
export const mockDataValidator = {
  validate: jest.fn(async (schema, data, part) => data), // Default: pass through data
};

// Logger Mock
export const mockInfo = jest.fn();
export const mockWarn = jest.fn();
export const mockError = jest.fn();
export const mockSuccess = jest.fn();

export const MockLogger = jest.fn().mockImplementation(() => ({
  info: mockInfo,
  warn: mockWarn,
  error: mockError,
  success: mockSuccess,
}));

// StandardizedError Mock Arguments Type (assuming constructor takes an object)
interface StandardizedErrorArgs {
  name?: string;
  message?: string;
  [key: string]: any; // Allow other properties
}

export const MockStandardizedError = jest.fn(
  (args: StandardizedErrorArgs = {}) => ({
    ...args,
    name: args.name || 'StandardizedError',
    message: args.message || 'An error occurred',
    toString: () => JSON.stringify(args), // args might be undefined if called with no arguments
  }),
);

export const mockSocketServerGetSocket = jest.fn();


// Utility to create a basic mock socket for handlers
export const createMockSocket = (
  userId: string = 'default-test-user',
  socketId: string = 'default-test-socket',
): jest.Mocked<Socket> => {
  return {
    id: socketId,
    data: { userId },
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    broadcast: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
    on: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(),
    handshake: { query: {} } as any, // Basic mock for handshake.query
  } as unknown as jest.Mocked<Socket>;
};

// Utility to create a basic mock IO server for handlers
export const mockIoRoomEmit = jest.fn(); // Export this mock

export const createMockIo = (): jest.Mocked<Server> => {
  const mockMap = new Map();
  return {
    to: jest.fn().mockReturnValue({ emit: mockIoRoomEmit }), // to() returns an object with our specific emit mock
    emit: jest.fn(), // For direct io.emit()
    sockets: {
      sockets: mockMap,
      adapter: { rooms: new Map(), sids: new Map() } as any,
    } as any,
    on: jest.fn(),
    use: jest.fn(),
  } as unknown as jest.Mocked<Server>;
};
