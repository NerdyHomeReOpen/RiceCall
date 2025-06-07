import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// 被測試的模組
import { UpdateFriendHandler } from '../../../src/api/socket/events/friend/friend.handler';
import { UpdateFriendSchema } from '../../../src/api/socket/events/friend/friend.schema';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockDataValidator,
  mockError,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  friendGroupId: 'friend-group-id',
} as const;

describe('UpdateFriendHandler (好友更新處理)', () => {
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocketInstance: jest.Mocked<Socket>;

  // Helper function for update friend data
  const createUpdateData = (
    overrides: Partial<{
      userId: string;
      targetId: string;
      friend: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.operatorUserId,
    targetId: DEFAULT_IDS.targetUserId,
    friend: {
      isBlocked: false,
      friendGroupId: DEFAULT_IDS.friendGroupId,
      ...overrides.friend,
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockIoInstance = createMockIo();
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.operatorUserId,
      'operator-socket-id',
    );
    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    mockDataValidator.validate.mockImplementation(
      async (schema, data, part) => data,
    );

    // 設定database.set.friend mock
    (mockDatabase.set.friend as any).mockResolvedValue(true);
  });

  it('應在符合所有條件時成功更新好友', async () => {
    const updateData = createUpdateData({
      friend: { isBlocked: true, friendGroupId: DEFAULT_IDS.friendGroupId },
    });

    await UpdateFriendHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      updateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateFriendSchema,
      updateData,
      'UPDATEFRIEND',
    );

    // 核心業務邏輯：更新好友
    expect(mockDatabase.set.friend).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
      expect.objectContaining({
        isBlocked: true,
        friendGroupId: DEFAULT_IDS.friendGroupId,
      }),
    );

    // Socket 事件發送
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendUpdate',
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
      expect.objectContaining({
        isBlocked: true,
        friendGroupId: DEFAULT_IDS.friendGroupId,
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated friend'),
    );
  });

  describe('權限檢查', () => {
    it('操作者不能修改非自己的好友', async () => {
      mockSocketInstance.data.userId = 'different-user-id';

      const updateData = createUpdateData();
      await UpdateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot modify non-self friends'),
      );
      expect(mockDatabase.set.friend).not.toHaveBeenCalled();
    });
  });

  describe('好友屬性更新', () => {
    it('應能正確更新封鎖狀態', async () => {
      const updateData = createUpdateData({
        friend: { isBlocked: true },
      });

      await UpdateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockDatabase.set.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
        expect.objectContaining({
          isBlocked: true,
        }),
      );
    });

    it('應能正確更新好友分組', async () => {
      const newGroupId = 'new-group-id';
      const updateData = createUpdateData({
        friend: { friendGroupId: newGroupId },
      });

      await UpdateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockDatabase.set.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
        expect.objectContaining({
          friendGroupId: newGroupId,
        }),
      );
    });

    it('應能同時更新多個屬性', async () => {
      const updateData = createUpdateData({
        friend: {
          isBlocked: true,
          friendGroupId: 'another-group-id',
        },
      });

      await UpdateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockDatabase.set.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
        expect.objectContaining({
          isBlocked: true,
          friendGroupId: 'another-group-id',
        }),
      );
    });
  });

  describe('資料驗證', () => {
    it('應正確呼叫資料驗證器', async () => {
      const updateData = createUpdateData();
      await UpdateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        UpdateFriendSchema,
        updateData,
        'UPDATEFRIEND',
      );
    });
  });

  describe('錯誤處理', () => {
    it('發生非預期錯誤時應發出 StandardizedError', async () => {
      const errorMessage = 'Database connection failed';
      mockDatabase.set.friend.mockRejectedValueOnce(new Error(errorMessage));

      await UpdateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createUpdateData(),
      );

      expect(mockError).toHaveBeenCalledWith(errorMessage);
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          name: 'ServerError',
          message: '更新好友失敗，請稍後再試',
        }),
      );
    });
  });
});
