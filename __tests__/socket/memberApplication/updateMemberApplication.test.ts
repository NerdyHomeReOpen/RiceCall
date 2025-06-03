import { jest } from '@jest/globals';

// 被測試的模組
import { UpdateMemberApplicationHandler } from '../../../src/api/socket/events/memberApplication/memberApplication.handler';

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
import { UpdateMemberApplicationSchema } from '../../../src/api/socket/events/memberApplication/memberApplication.schema';

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
const defaultUpdateData = {
  userId: DEFAULT_IDS.targetUserId,
  serverId: DEFAULT_IDS.serverId,
  memberApplication: {
    description: '更新申請描述',
  },
};

describe('UpdateMemberApplicationHandler (成員申請更新處理)', () => {
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

    (mockDatabase.set.memberApplication as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultUpdateData);
  });

  it('應成功更新其他用戶的成員申請', async () => {
    await UpdateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateMemberApplicationSchema,
      defaultUpdateData,
      'UPDATEMEMBERAPPLICATION',
    );

    expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      defaultUpdateData.memberApplication,
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberApplicationUpdate',
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      defaultUpdateData.memberApplication,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated member application'),
    );
  });

  it('應成功更新自己的成員申請', async () => {
    const selfUpdateData = {
      ...defaultUpdateData,
      userId: DEFAULT_IDS.operatorUserId,
    };
    mockDataValidator.validate.mockResolvedValue(selfUpdateData);

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await UpdateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      selfUpdateData,
    );

    expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      selfUpdateData.memberApplication,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated member application'),
    );
  });

  it('操作者權限不足時應拒絕（權限 < 5）', async () => {
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 3, // 權限不足
    });

    await UpdateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Not enough permission'),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await UpdateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateMemberApplicationSchema,
      defaultUpdateData,
      'UPDATEMEMBERAPPLICATION',
    );
  });

  it('應能部分更新申請資料', async () => {
    const partialUpdateData = {
      ...defaultUpdateData,
      memberApplication: {
        description: '只更新描述',
      },
    };
    mockDataValidator.validate.mockResolvedValue(partialUpdateData);

    await UpdateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      partialUpdateData,
    );

    expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      { description: '只更新描述' },
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated member application'),
    );
  });
});
