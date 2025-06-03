import { jest } from '@jest/globals';

// 被測試的模組
import { CreateMemberApplicationHandler } from '../../../src/api/socket/events/memberApplication/memberApplication.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockInfo,
  mockIoRoomEmit,
  mockWarn,
} from '../../_testSetup';

// 錯誤類型和Schema
import { CreateMemberApplicationSchema } from '../../../src/api/socket/events/memberApplication/memberApplication.schema';

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

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  serverId: 'server-id-123',
} as const;

// 測試數據
const defaultCreateData = {
  userId: DEFAULT_IDS.operatorUserId,
  serverId: DEFAULT_IDS.serverId,
  memberApplication: {
    description: '申請加入伺服器',
  },
};

describe('CreateMemberApplicationHandler (成員申請創建處理)', () => {
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
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 1, // 預設為訪客，可以申請
      nickname: null,
      isBlocked: 0,
    });

    (mockDatabase.set.memberApplication as any).mockResolvedValue(true);

    mockDatabase.get.serverMemberApplication.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      description: '申請加入伺服器',
      createdAt: Date.now(),
    });

    mockDataValidator.validate.mockResolvedValue(defaultCreateData);
  });

  it('應成功創建成員申請', async () => {
    await CreateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateMemberApplicationSchema,
      defaultCreateData,
      'CREATEMEMBERAPPLICATION',
    );

    expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        description: '申請加入伺服器',
        createdAt: expect.any(Number),
      }),
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberApplicationAdd',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created member application'),
    );
  });

  it('不能為其他用戶創建申請', async () => {
    const otherUserData = {
      ...defaultCreateData,
      userId: 'other-user-id',
    };
    mockDataValidator.validate.mockResolvedValue(otherUserData);

    await CreateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      otherUserData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot create non-self member application'),
    );
  });

  it('非訪客不能創建成員申請', async () => {
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 2, // 已經是成員
    });

    await CreateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot create member application as non-guest'),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await CreateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateMemberApplicationSchema,
      defaultCreateData,
      'CREATEMEMBERAPPLICATION',
    );
  });

  it('應包含創建時間戳', async () => {
    await CreateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    const setMemberApplicationCall =
      mockDatabase.set.memberApplication.mock.calls[0];
    const memberApplicationData = setMemberApplicationCall[2];

    expect(memberApplicationData.createdAt).toBeGreaterThan(0);
    expect(typeof memberApplicationData.createdAt).toBe('number');
  });
});
