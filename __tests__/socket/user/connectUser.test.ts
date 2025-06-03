import { jest } from '@jest/globals';

// Mock相依的handler - 需要在jest.mock之前定義
const mockDisconnectServerHandler = {
  handle: jest.fn(),
};
const mockConnectServerHandler = {
  handle: jest.fn(),
};

// 被測試的模組
import { ConnectUserHandler } from '../../../src/api/socket/events/user/user.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockError,
  mockInfo,
} from '../../_testSetup';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/api/socket/events/server/server.handler', () => ({
  DisconnectServerHandler: mockDisconnectServerHandler,
  ConnectServerHandler: mockConnectServerHandler,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  serverId: 'server-id-123',
} as const;

// 測試數據
const mockUser = {
  userId: DEFAULT_IDS.operatorUserId,
  name: '測試用戶',
  avatar: 'avatar.jpg',
  status: 'online',
  currentServerId: null,
  currentChannelId: null,
  lastActiveAt: 1640995200000,
};

const mockUserWithServer = {
  ...mockUser,
  currentServerId: DEFAULT_IDS.serverId,
  currentChannelId: 'channel-id-123',
};

describe('ConnectUserHandler (連接用戶處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let mockCurrentTime: number;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Date.now()
    mockCurrentTime = 1640995200000;
    jest.spyOn(Date, 'now').mockReturnValue(mockCurrentTime);

    // 建立mock socket和io實例
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.operatorUserId,
      'test-socket-id',
    );
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    mockDatabase.get.user.mockResolvedValue(mockUser);
    mockDatabase.set.user.mockResolvedValue(true);

    (mockDisconnectServerHandler.handle as any).mockResolvedValue(undefined);
    (mockConnectServerHandler.handle as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('應成功連接用戶（無現有伺服器）', async () => {
    await ConnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockDatabase.get.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      {
        lastActiveAt: mockCurrentTime,
      },
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'userUpdate',
      mockUser,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining(`User(${DEFAULT_IDS.operatorUserId}) connected`),
    );
  });

  it('應重新連接到現有伺服器', async () => {
    mockDatabase.get.user.mockResolvedValue(mockUserWithServer);

    await ConnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    // 應先斷開現有伺服器連接
    expect(mockDisconnectServerHandler.handle).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      {
        userId: DEFAULT_IDS.operatorUserId,
        serverId: DEFAULT_IDS.serverId,
      },
    );

    // 然後重新連接到伺服器
    expect(mockConnectServerHandler.handle).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      {
        userId: DEFAULT_IDS.operatorUserId,
        serverId: DEFAULT_IDS.serverId,
      },
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining(`User(${DEFAULT_IDS.operatorUserId}) connected`),
    );
  });

  it('應更新用戶最後活躍時間', async () => {
    await ConnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      {
        lastActiveAt: mockCurrentTime,
      },
    );
  });

  it('應發送用戶更新事件', async () => {
    const updatedUser = { ...mockUser, lastActiveAt: mockCurrentTime };
    mockDatabase.get.user
      .mockResolvedValueOnce(mockUser) // 第一次呼叫
      .mockResolvedValueOnce(updatedUser); // 第二次呼叫

    await ConnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'userUpdate',
      updatedUser,
    );
  });

  it('資料庫查詢失敗時應發送錯誤', async () => {
    const dbError = new Error('Database error');
    mockDatabase.get.user.mockRejectedValue(dbError);

    await ConnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockError).toHaveBeenCalledWith(dbError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '連接使用者失敗，請稍後再試',
        part: 'CONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('資料庫更新失敗時應發送錯誤', async () => {
    const dbError = new Error('Database update failed');
    mockDatabase.set.user.mockRejectedValue(dbError);

    await ConnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockError).toHaveBeenCalledWith(dbError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '連接使用者失敗，請稍後再試',
        part: 'CONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('伺服器處理器失敗時應發送錯誤', async () => {
    const serverError = new Error('Server handler failed');
    mockDatabase.get.user.mockResolvedValue(mockUserWithServer);
    (mockDisconnectServerHandler.handle as any).mockRejectedValue(serverError);

    await ConnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockError).toHaveBeenCalledWith(serverError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '連接使用者失敗，請稍後再試',
        part: 'CONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });
});
