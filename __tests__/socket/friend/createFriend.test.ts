import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// 被測試的模組
import { CreateFriendHandler } from '../../../src/api/socket/events/friend/friend.handler';
import { CreateFriendSchema } from '../../../src/api/socket/events/friend/friend.schema';

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
  friendGroupId: 'friend-group-id',
} as const;

describe('CreateFriendHandler (好友創建處理)', () => {
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocketInstance: jest.Mocked<Socket>;

  // Helper function for create friend data
  const createFriendData = (
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
      friendGroupId: null,
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

    // 預設mock回傳值
    mockDatabase.get.friend.mockResolvedValue(null); // 預設不是好友
    mockDatabase.get.userFriend.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      targetId: DEFAULT_IDS.targetUserId,
      isBlocked: false,
      friendGroupId: null,
    });

    // 設定database.set.friend mock
    (mockDatabase.set.friend as any).mockResolvedValue(true);
  });

  it('應在符合所有條件時成功創建好友', async () => {
    const targetSocket = createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServerGetSocket.mockReturnValue(targetSocket);

    const data = createFriendData();
    await CreateFriendHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateFriendSchema,
      data,
      'CREATEFRIEND',
    );

    // 檢查是否有查詢現有好友關係
    expect(mockDatabase.get.friend).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
    );

    // 核心業務邏輯：建立雙向好友關係
    expect(mockDatabase.set.friend).toHaveBeenCalledTimes(2);
    expect(mockDatabase.set.friend).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
      expect.objectContaining({
        isBlocked: false,
        friendGroupId: null,
        createdAt: expect.any(Number),
      }),
    );
    expect(mockDatabase.set.friend).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.operatorUserId,
      expect.objectContaining({
        isBlocked: false,
        friendGroupId: null,
        createdAt: expect.any(Number),
      }),
    );

    // Socket 事件發送
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendAdd',
      expect.any(Object),
    );
    expect(targetSocket.emit).toHaveBeenCalledWith(
      'friendAdd',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('added friend'),
    );
  });

  describe('權限檢查', () => {
    it('操作者不能新增非自己的好友', async () => {
      mockSocketInstance.data.userId = 'different-user-id';

      const data = createFriendData();
      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot add non-self friends'),
      );
      expect(mockDatabase.set.friend).not.toHaveBeenCalled();
    });
  });

  describe('業務規則檢查', () => {
    it('不能新增自己為好友', async () => {
      const data = createFriendData({
        targetId: DEFAULT_IDS.operatorUserId, // 目標是自己
      });

      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot add self as a friend'),
      );
      expect(mockDatabase.set.friend).not.toHaveBeenCalled();
    });

    it('當已經是好友時，應阻止重複新增', async () => {
      // Mock已存在的好友關係
      mockDatabase.get.friend.mockResolvedValueOnce({
        userId: DEFAULT_IDS.operatorUserId,
        targetId: DEFAULT_IDS.targetUserId,
        isBlocked: false,
      });

      const data = createFriendData();
      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Already friends'),
      );
      expect(mockDatabase.set.friend).not.toHaveBeenCalled();
    });
  });

  describe('Socket事件處理', () => {
    it('當目標用戶離線時，只發送給操作者', async () => {
      mockSocketServerGetSocket.mockReturnValue(null); // 目標用戶離線

      const data = createFriendData();
      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 只發送給操作者
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendAdd',
        expect.any(Object),
      );

      // 沒有發送給目標用戶
      expect(mockSocketServerGetSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
      );
    });

    it('當目標用戶線上時，應發送給雙方', async () => {
      const targetSocket = createMockSocket(
        DEFAULT_IDS.targetUserId,
        'target-socket-id',
      );
      mockSocketServerGetSocket.mockReturnValue(targetSocket);

      const data = createFriendData();
      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 發送給操作者
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendAdd',
        expect.any(Object),
      );

      // 發送給目標用戶
      expect(targetSocket.emit).toHaveBeenCalledWith(
        'friendAdd',
        expect.any(Object),
      );
    });
  });

  describe('資料驗證', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = createFriendData();
      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        CreateFriendSchema,
        data,
        'CREATEFRIEND',
      );
    });
  });

  describe('錯誤處理', () => {
    it('發生非預期錯誤時應發出 StandardizedError', async () => {
      const errorMessage = 'Database connection failed';
      mockDatabase.get.friend.mockRejectedValueOnce(new Error(errorMessage));

      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createFriendData(),
      );

      expect(mockError).toHaveBeenCalledWith(errorMessage);
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          name: 'ServerError',
          message: '建立好友失敗，請稍後再試',
        }),
      );
    });
  });
});
