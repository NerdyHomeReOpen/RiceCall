import { jest } from '@jest/globals';

// 使用本地的測試輔助工具
import {
  DEFAULT_IDS,
  DEFAULT_TIME,
  createDefaultTestData,
  createMockServerHandlers,
  createStandardMockInstances,
  setupAfterEach,
  setupConnectDisconnectBeforeEach,
  testDatabaseError,
} from './_testHelpers';

// 測試設定
import { mockDatabase, mockInfo } from '../../_testSetup';

// Mock相依的handler
const mockServerHandlers = createMockServerHandlers();

// Mock 核心模組
jest.mock('@/index', () => ({
  database: mockDatabase,
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    info: mockInfo,
    warn: require('../../_testSetup').mockWarn,
    error: require('../../_testSetup').mockError,
  })),
}));

jest.mock('@/api/socket/events/server/server.handler', () => ({
  DisconnectServerHandler: mockServerHandlers.disconnectServer,
  ConnectServerHandler: mockServerHandlers.connectServer,
}));

// 被測試的模組
import { DisconnectUserHandler } from '../../../src/api/socket/events/user/user.handler';

describe('DisconnectUserHandler (斷開用戶處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances();
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定 connect/disconnect 專用的 beforeEach
    setupConnectDisconnectBeforeEach(
      mockSocketInstance,
      mockIoInstance,
      testData,
      mockServerHandlers,
    );
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功斷開用戶（無現有伺服器）', async () => {
    await DisconnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockDatabase.get.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      {
        lastActiveAt: DEFAULT_TIME,
      },
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith('userUpdate', null);

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining(
        `User(${DEFAULT_IDS.operatorUserId}) disconnected`,
      ),
    );
  });

  it('應斷開現有伺服器連接', async () => {
    mockDatabase.get.user.mockResolvedValue(testData.userWithServer);

    await DisconnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    // 應先斷開現有伺服器連接
    expect(mockServerHandlers.disconnectServer.handle).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      {
        userId: DEFAULT_IDS.operatorUserId,
        serverId: DEFAULT_IDS.serverId,
      },
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining(
        `User(${DEFAULT_IDS.operatorUserId}) disconnected`,
      ),
    );
  });

  it('應更新用戶最後活躍時間', async () => {
    await DisconnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      {
        lastActiveAt: DEFAULT_TIME,
      },
    );
  });

  it('應發送null用戶更新事件', async () => {
    await DisconnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockSocketInstance.emit).toHaveBeenCalledWith('userUpdate', null);
  });

  it('不應在無伺服器時呼叫斷開伺服器', async () => {
    // 用戶沒有連接到任何伺服器
    mockDatabase.get.user.mockResolvedValue(testData.operatorUser);

    await DisconnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockServerHandlers.disconnectServer.handle).not.toHaveBeenCalled();
  });

  it('資料庫查詢失敗時應發送錯誤', async () => {
    await testDatabaseError(
      {
        handle: (io: any, socket: any) =>
          DisconnectUserHandler.handle(io, socket),
      },
      mockSocketInstance,
      mockIoInstance,
      undefined,
      'get',
      'Database error',
      '斷開使用者失敗，請稍後再試',
    );
  });

  it('資料庫更新失敗時應發送錯誤', async () => {
    const dbError = new Error('Database update failed');
    mockDatabase.set.user.mockRejectedValue(dbError);

    await DisconnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '斷開使用者失敗，請稍後再試',
        part: 'DISCONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('伺服器斷開處理器失敗時應發送錯誤', async () => {
    const serverError = new Error('Server disconnect failed');
    mockDatabase.get.user.mockResolvedValue(testData.userWithServer);
    (mockServerHandlers.disconnectServer.handle as any).mockRejectedValue(
      serverError,
    );

    await DisconnectUserHandler.handle(mockIoInstance, mockSocketInstance);

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '斷開使用者失敗，請稍後再試',
        part: 'DISCONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });
});
