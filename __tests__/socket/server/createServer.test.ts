import { jest } from '@jest/globals';
import {
  mockDatabase,
  mockDataValidator,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

// Mock 輔助工具 - 需要在 jest.mock 之前定義
const mockCreateMemberHandler = {
  handle: jest.fn() as jest.MockedFunction<
    (io: any, socket: any, data: any) => Promise<void>
  >,
};
const mockConnectServerHandler = {
  handle: jest.fn() as jest.MockedFunction<
    (io: any, socket: any, data: any) => Promise<void>
  >,
};
const mockGenerateUniqueDisplayId = jest.fn() as jest.MockedFunction<
  () => Promise<string>
>;

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));
jest.mock('@/utils', () => ({
  generateUniqueDisplayId: mockGenerateUniqueDisplayId,
}));
jest.mock('@/api/socket/events/member/member.handler', () => ({
  CreateMemberHandler: mockCreateMemberHandler,
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

// 被測試的模組和測試輔助工具
import {
  ConnectServerHandler,
  CreateServerHandler,
} from '../../../src/api/socket/events/server/server.handler';
import { CreateServerSchema } from '../../../src/api/socket/events/server/server.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  createUserVariant,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

describe('CreateServerHandler (建立伺服器處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;
  let connectServerSpy: any;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances();
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);

    // 設定額外的 mock
    mockCreateMemberHandler.handle.mockResolvedValue(undefined);
    connectServerSpy = jest
      .spyOn(ConnectServerHandler, 'handle')
      .mockResolvedValue(undefined);
    mockGenerateUniqueDisplayId.mockResolvedValue(DEFAULT_IDS.displayId);
  });

  afterEach(() => {
    setupAfterEach();
    connectServerSpy.mockRestore();
  });

  it('應成功建立伺服器', async () => {
    const data = testData.createCreateServerData();

    await CreateServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateServerSchema,
      data,
      'CREATESERVER',
    );

    expect(mockDatabase.get.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );
    expect(mockDatabase.get.userServers).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );

    expect(mockDatabase.set.server).toHaveBeenCalledWith(
      'mocked-uuid',
      expect.objectContaining({
        ...data.server,
        displayId: DEFAULT_IDS.displayId,
        ownerId: DEFAULT_IDS.operatorUserId,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created server'),
    );
  });

  it('應建立大廳頻道', async () => {
    const data = testData.createCreateServerData();

    await CreateServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDatabase.set.channel).toHaveBeenCalledWith(
      'mocked-uuid',
      expect.objectContaining({
        name: '大廳',
        isLobby: true,
        serverId: 'mocked-uuid',
        createdAt: expect.any(Number),
      }),
    );
  });

  it('應建立擁有者成員資格', async () => {
    const data = testData.createCreateServerData();

    await CreateServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockCreateMemberHandler.handle).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      expect.objectContaining({
        userId: DEFAULT_IDS.operatorUserId,
        serverId: 'mocked-uuid',
        member: expect.objectContaining({
          permissionLevel: 6,
        }),
      }),
    );
  });

  it('應建立用戶伺服器關係', async () => {
    const data = testData.createCreateServerData();

    await CreateServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      'mocked-uuid',
      expect.objectContaining({
        owned: true,
      }),
    );
  });

  it('應連接到新建立的伺服器', async () => {
    const data = testData.createCreateServerData();

    await CreateServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(connectServerSpy).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      expect.objectContaining({
        userId: DEFAULT_IDS.operatorUserId,
        serverId: 'mocked-uuid',
      }),
    );
  });

  it('達到伺服器限制時應拒絕建立', async () => {
    // 模擬用戶已擁有最大數量的伺服器
    const lowLevelUser = createUserVariant(testData.operatorUser, {
      level: 1, // 低等級，限制較少
    });
    const maxOwnedServers = Array.from({ length: 4 }, (_, i) => ({
      serverId: `server${i + 1}`,
      owned: true,
    }));

    mockDatabase.get.user.mockResolvedValue(lowLevelUser as any);
    mockDatabase.get.userServers.mockResolvedValue(maxOwnedServers as any);

    const data = testData.createCreateServerData();

    await CreateServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('failed to create server: Server limit reached'),
    );

    // 確保沒有建立伺服器
    expect(mockDatabase.set.server).not.toHaveBeenCalled();
  });

  it('應處理不同類型的伺服器', async () => {
    const data = testData.createCreateServerData({
      server: {
        name: '娛樂伺服器',
        description: '娛樂用途的伺服器',
        type: 'entertainment',
        visibility: 'private',
      },
    });

    await CreateServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDatabase.set.server).toHaveBeenCalledWith(
      'mocked-uuid',
      expect.objectContaining({
        name: '娛樂伺服器',
        description: '娛樂用途的伺服器',
        type: 'entertainment',
        visibility: 'private',
      }),
    );
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const invalidData = { server: { name: '' } };
    const validationError = new Error('Invalid server data');

    await testValidationError(
      CreateServerHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '建立群組失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      CreateServerHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createCreateServerData(),
      'set',
      'Database connection failed',
      '建立群組失敗，請稍後再試',
    );
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createCreateServerData();

      await CreateServerHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        CreateServerSchema,
        data,
        'CREATESERVER',
      );
    });

    it('應按正確順序執行建立流程', async () => {
      const data = testData.createCreateServerData();

      await CreateServerHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有重要操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockDatabase.set.server).toHaveBeenCalledTimes(2); // 創建時和更新 lobbyId 時
      expect(mockDatabase.set.channel).toHaveBeenCalledTimes(1);
      expect(mockCreateMemberHandler.handle).toHaveBeenCalledTimes(1);
      expect(connectServerSpy).toHaveBeenCalledTimes(1);
    });
  });
});
