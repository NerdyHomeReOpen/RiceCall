import { jest } from '@jest/globals';

// Mock相依的handler - 需要在jest.mock之前定義
const mockCreateMemberHandler = {
  handle: jest.fn(),
};
const mockConnectServerHandler = {
  handle: jest.fn(),
};
const mockGenerateUniqueDisplayId = jest.fn();

// 被測試的模組
import { CreateServerHandler } from '../../../src/api/socket/events/server/server.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockError,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

// 錯誤類型和Schema
import { CreateServerSchema } from '../../../src/api/socket/events/server/server.schema';

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

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  serverId: 'mocked-uuid',
  lobbyId: 'mocked-uuid',
} as const;

// 測試數據
const defaultCreateData = {
  server: {
    name: '新伺服器',
    description: '這是一個測試伺服器',
    type: 'game' as const,
    visibility: 'public' as const,
  },
};

describe('CreateServerHandler (建立伺服器處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 建立mock socket和io實例
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.operatorUserId,
      'test-socket-id',
    );
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    mockDataValidator.validate.mockResolvedValue(defaultCreateData);

    mockDatabase.get.user.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      username: 'testuser',
      level: 10,
    });

    mockDatabase.get.userServers.mockResolvedValue([
      { serverId: 'server1', owned: true },
      { serverId: 'server2', owned: false },
    ]);

    mockDatabase.set.server.mockResolvedValue(true);
    mockDatabase.set.channel.mockResolvedValue(true);
    mockDatabase.set.userServer.mockResolvedValue(true);

    (mockGenerateUniqueDisplayId as any).mockResolvedValue('DISPLAY123');
    (mockCreateMemberHandler.handle as any).mockResolvedValue(undefined);
    (mockConnectServerHandler.handle as any).mockResolvedValue(undefined);
  });

  it('應成功建立伺服器', async () => {
    await CreateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateServerSchema,
      defaultCreateData,
      'CREATESERVER',
    );

    expect(mockDatabase.get.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );
    expect(mockDatabase.get.userServers).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );

    expect(mockDatabase.set.server).toHaveBeenCalledWith(
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        ...defaultCreateData.server,
        displayId: 'DISPLAY123',
        ownerId: DEFAULT_IDS.operatorUserId,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created server'),
    );
  });

  it('應建立大廳頻道', async () => {
    await CreateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockDatabase.set.channel).toHaveBeenCalledWith(
      DEFAULT_IDS.lobbyId,
      expect.objectContaining({
        name: '大廳',
        isLobby: true,
        serverId: DEFAULT_IDS.serverId,
        createdAt: expect.any(Number),
      }),
    );
  });

  it('應建立擁有者成員資格', async () => {
    await CreateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockCreateMemberHandler.handle).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      expect.objectContaining({
        userId: DEFAULT_IDS.operatorUserId,
        serverId: DEFAULT_IDS.serverId,
        member: expect.objectContaining({
          permissionLevel: 6,
        }),
      }),
    );
  });

  it('達到伺服器限制時應拒絕建立', async () => {
    // 模擬用戶已擁有最大數量的伺服器
    mockDatabase.get.userServers.mockResolvedValue([
      { serverId: 'server1', owned: true },
      { serverId: 'server2', owned: true },
      { serverId: 'server3', owned: true },
      { serverId: 'server4', owned: true },
    ]);

    mockDatabase.get.user.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      username: 'testuser',
      level: 1, // 低等級，限制較少
    });

    await CreateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Server limit reached'),
    );

    // 不應建立伺服器
    expect(mockDatabase.set.server).not.toHaveBeenCalled();
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid server data');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await CreateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '建立群組失敗，請稍後再試',
        part: 'CREATESERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await CreateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateServerSchema,
      defaultCreateData,
      'CREATESERVER',
    );
  });
});
