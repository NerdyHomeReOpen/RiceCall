import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// 被測試的模組
import { DeleteFriendHandler } from '../../../src/api/socket/events/friend/friend.handler';
import { DeleteFriendSchema } from '../../../src/api/socket/events/friend/friend.schema';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockDataValidator,
  mockError,
  mockInfo,
  mockSocketServerGetSocket,
  mockWarn,
} from '../../_testSetup';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: { getSocket: require('../../_testSetup').mockSocketServerGetSocket },
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));
jest.mock('@/utils', () => ({
  biDirectionalAsyncOperation: jest.fn(async (func: any, args: any[]) => {
    await func(args[0], args[1]);
    await func(args[1], args[0]);
  }),
}));

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
} as const;

describe('DeleteFriendHandler (好友刪除處理)', () => {
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocketInstance: jest.Mocked<Socket>;

  // Helper function for delete friend data
  const createDeleteData = (
    overrides: Partial<{
      userId: string;
      targetId: string;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.operatorUserId,
    targetId: DEFAULT_IDS.targetUserId,
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

    // 設定database.delete.friend mock
    (mockDatabase.delete.friend as any).mockResolvedValue(true);
  });

  it('應成功刪除好友關係', async () => {
    const targetSocket = createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServerGetSocket.mockReturnValue(targetSocket);

    const deleteData = createDeleteData();

    await DeleteFriendHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      deleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteFriendSchema,
      deleteData,
      'DELETEFRIEND',
    );

    // 核心業務邏輯：刪除雙向好友關係
    expect(mockDatabase.delete.friend).toHaveBeenCalledTimes(2);
    expect(mockDatabase.delete.friend).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
    );
    expect(mockDatabase.delete.friend).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.operatorUserId,
    );

    // Socket 事件發送
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendDelete',
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
    );
    expect(targetSocket.emit).toHaveBeenCalledWith(
      'friendDelete',
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.operatorUserId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted friend'),
    );
  });

  describe('權限檢查', () => {
    it('操作者不能刪除非自己的好友', async () => {
      mockSocketInstance.data.userId = 'different-user-id';

      const deleteData = createDeleteData();
      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot delete non-self friends'),
      );
      expect(mockDatabase.delete.friend).not.toHaveBeenCalled();
    });
  });

  describe('Socket事件處理', () => {
    it('當目標用戶離線時，只發送給操作者', async () => {
      mockSocketServerGetSocket.mockReturnValue(null); // 目標用戶離線

      const deleteData = createDeleteData();
      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      // 發送給操作者
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendDelete',
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
      );

      // 檢查是否嘗試取得目標socket
      expect(mockSocketServerGetSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
      );

      // 應該執行刪除操作
      expect(mockDatabase.delete.friend).toHaveBeenCalledTimes(2);
    });

    it('當目標用戶線上時，應發送給雙方', async () => {
      const targetSocket = createMockSocket(
        DEFAULT_IDS.targetUserId,
        'target-socket-id',
      );
      mockSocketServerGetSocket.mockReturnValue(targetSocket);

      const deleteData = createDeleteData();
      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      // 發送給操作者
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendDelete',
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
      );

      // 發送給目標用戶
      expect(targetSocket.emit).toHaveBeenCalledWith(
        'friendDelete',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.operatorUserId,
      );
    });
  });

  describe('雙向操作驗證', () => {
    it('應確保雙向刪除好友關係', async () => {
      const deleteData = createDeleteData();
      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      // 確認兩個方向都有執行刪除
      expect(mockDatabase.delete.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
      );
      expect(mockDatabase.delete.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.operatorUserId,
      );
      expect(mockDatabase.delete.friend).toHaveBeenCalledTimes(2);
    });
  });

  describe('資料驗證', () => {
    it('應正確呼叫資料驗證器', async () => {
      const deleteData = createDeleteData();
      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteFriendSchema,
        deleteData,
        'DELETEFRIEND',
      );
    });
  });

  describe('錯誤處理', () => {
    it('發生非預期錯誤時應發出 StandardizedError', async () => {
      const errorMessage = 'Database connection failed';
      mockDatabase.delete.friend.mockRejectedValueOnce(new Error(errorMessage));

      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createDeleteData(),
      );

      expect(mockError).toHaveBeenCalledWith(errorMessage);
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          name: 'ServerError',
          message: '刪除好友失敗，請稍後再試',
        }),
      );
    });
  });
});
