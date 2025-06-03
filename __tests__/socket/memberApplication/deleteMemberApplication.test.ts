import { jest } from '@jest/globals';

// 被測試的模組
import { DeleteMemberApplicationHandler } from '../../../src/api/socket/events/memberApplication/memberApplication.handler';

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
import { DeleteMemberApplicationSchema } from '../../../src/api/socket/events/memberApplication/memberApplication.schema';

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
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
} as const;

// 測試數據
const defaultDeleteData = {
  userId: DEFAULT_IDS.targetUserId,
  serverId: DEFAULT_IDS.serverId,
};

describe('DeleteMemberApplicationHandler (成員申請刪除處理)', () => {
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
      permissionLevel: 5, // 預設為伺服器管理員
      nickname: null,
      isBlocked: 0,
    });

    (mockDatabase.delete.memberApplication as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultDeleteData);
  });

  it('應成功刪除其他用戶的成員申請', async () => {
    await DeleteMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteMemberApplicationSchema,
      defaultDeleteData,
      'DELETEMEMBERAPPLICATION',
    );

    expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberApplicationDelete',
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted member application'),
    );
  });

  it('應成功刪除自己的成員申請', async () => {
    const selfDeleteData = {
      ...defaultDeleteData,
      userId: DEFAULT_IDS.operatorUserId,
    };
    mockDataValidator.validate.mockResolvedValue(selfDeleteData);

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await DeleteMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      selfDeleteData,
    );

    expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted member application'),
    );
  });

  it('操作者權限不足時應拒絕（權限 < 5）', async () => {
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 3, // 權限不足
    });

    await DeleteMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Not enough permission'),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await DeleteMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteMemberApplicationSchema,
      defaultDeleteData,
      'DELETEMEMBERAPPLICATION',
    );
  });

  it('應發送正確的Socket事件', async () => {
    await DeleteMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberApplicationDelete',
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );
  });
});
