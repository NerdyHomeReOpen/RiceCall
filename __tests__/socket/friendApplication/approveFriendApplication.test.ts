import { jest } from '@jest/globals';

// 被測試的模組
import { ApproveFriendApplicationHandler } from '../../../src/api/socket/events/friendApplication/friendApplication.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockInfo,
} from '../../_testSetup';

// 錯誤類型和Schema
import { ApproveFriendApplicationSchema } from '../../../src/api/socket/events/friendApplication/friendApplication.schema';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: { getSocket: require('../../_testSetup').mockSocketServerGetSocket },
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));
jest.mock('@/api/socket/events/friend/friend.handler', () => ({
  FriendHandlerServerSide: {
    createFriend: jest.fn(),
    updateFriendGroup: jest.fn(),
  },
}));

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetId: 'target-user-id',
  friendGroupId: 'friend-group-id',
} as const;

// 測試數據
const defaultApprovalData = {
  userId: DEFAULT_IDS.operatorUserId,
  targetId: DEFAULT_IDS.targetId,
  friend: {
    friendGroupId: null,
  },
};

describe('ApproveFriendApplicationHandler (好友申請批准處理)', () => {
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
    mockDatabase.get.friendApplication.mockResolvedValue({
      senderId: DEFAULT_IDS.targetId,
      receiverId: DEFAULT_IDS.operatorUserId,
      description: '想要成為好友',
      createdAt: Date.now() - 1000,
    });
    mockDatabase.get.friend.mockResolvedValue(null); // 預設還不是好友
    (mockDatabase.delete.friendApplication as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultApprovalData);
  });

  it('應成功批准好友申請', async () => {
    await ApproveFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultApprovalData,
    );

    // 資料驗證
    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ApproveFriendApplicationSchema,
      defaultApprovalData,
      'FRIENDAPPROVAL',
    );

    // 檢查好友申請是否存在
    expect(mockDatabase.get.friendApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.targetId,
      DEFAULT_IDS.operatorUserId,
    );

    // 檢查是否已經是好友
    expect(mockDatabase.get.friend).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetId,
    );

    // 發送批准事件
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendApproval',
      expect.objectContaining({
        targetId: DEFAULT_IDS.targetId,
      }),
    );

    // Logger檢查
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('approve friend application'),
    );
  });

  it('當好友申請不存在時應拋出FriendApplicationNotFoundError', async () => {
    mockDatabase.get.friendApplication.mockResolvedValue(null);

    await ApproveFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultApprovalData,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ValidationError',
        message: expect.stringContaining('好友申請不存在'),
      }),
    );
  });

  it('當已經是好友時應拋出AlreadyFriendError', async () => {
    mockDatabase.get.friend.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      targetId: DEFAULT_IDS.targetId,
      isBlocked: false,
    });

    await ApproveFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultApprovalData,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ValidationError',
        message: expect.stringContaining('已經是好友了'),
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await ApproveFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultApprovalData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ApproveFriendApplicationSchema,
      defaultApprovalData,
      'FRIENDAPPROVAL',
    );
  });
});
