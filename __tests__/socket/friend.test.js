/**
 * 本測試專注於測試 socket/friend.js 中的事件處理流程。
 *
 * 策略：
 * 1. 模擬所有外部依賴（utils, DB），專注測試 friend.js 中的流程
 * 2. 每個事件流程都有測試正常流程和異常情況
 * 3. 驗證每個流程是否正確回應並發送適當事件
 *
 * 覆蓋範圍：
 * - createFriend
 * - updateFriend
 * - deleteFriend
 *
 * 模擬對象：
 * - 所有資料庫操作 (DB.get, DB.set, DB.delete) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 */

// __tests__/socket/friend.test.js
// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils, mockDB } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('../../db', () => mockDB);

// 此時 utils 和 DB 已經被 mock 過
const utils = require('../../utils');
const DB = require('../../db');
const StandardizedError = require('../../standardizedError');

// 真正要測試的模組
const friendHandler = require('../../socket/friend');

// 初始化測試用的模擬物件
const mockSocket = {
  id: 'socket-id-123',
  userId: 'user-id-123',
};

const mockIo = {
  to: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
  sockets: {
    sockets: new Map([['socket-id-123', mockSocket]]),
  },
};

// 初始化測試資料
const mockUser = {
  id: 'user-id-123',
  username: 'testuser',
  currentServerId: null,
};

const mockTarget = {
  id: 'user-id-456',
  username: 'targetuser',
  currentServerId: null,
};

const mockFriend = {
  id: 'fd_user-id-123-user-id-456',
  userId: 'user-id-123',
  targetId: 'user-id-456',
  friendGroupId: 'group-id-123',
  createdAt: Date.now(),
};

const mockReverseFriend = {
  id: 'fd_user-id-456-user-id-123',
  userId: 'user-id-456',
  targetId: 'user-id-123',
  friendGroupId: '',
  createdAt: Date.now(),
};

describe('好友 Socket 處理器', () => {
  // 在每個測試前重置 mock 並設置常用的默認值
  beforeEach(() => {
    jest.clearAllMocks();

    // 默認設置常用的 mock 行為
    utils.Func.validate.socket.mockResolvedValue('user-id-123');
    utils.Func.validate.friend.mockImplementation((friend) => friend);
    DB.get.user.mockImplementation(async (id) => {
      if (id === 'user-id-123') return mockUser;
      if (id === 'user-id-456') return mockTarget;
      return null;
    });
    DB.get.friend.mockImplementation(async (userId, targetId) => {
      if (userId === 'user-id-123' && targetId === 'user-id-456')
        return mockFriend;
      if (userId === 'user-id-456' && targetId === 'user-id-123')
        return mockReverseFriend;
      return null;
    });
    DB.get.userFriends.mockResolvedValue([mockFriend]);
    DB.set.friend.mockImplementation(async (userId, targetId, data) => ({
      id: `fd_${userId}-${targetId}`,
      ...data,
    }));
    DB.delete.friend.mockResolvedValue(true);

    // 設置 mock socket 集合
    mockIo.sockets.sockets = new Map([
      ['socket-id-123', { ...mockSocket, userId: 'user-id-123' }],
      [
        'socket-id-456',
        { ...mockSocket, id: 'socket-id-456', userId: 'user-id-456' },
      ],
    ]);
  });

  describe('createFriend', () => {
    it('應該成功創建好友關係', async () => {
      // 條件：有效的好友資料，用戶操作自己的帳號
      const newFriend = {
        friendGroupId: 'group-id-123',
      };

      await friendHandler.createFriend(mockIo, mockSocket, {
        userId: 'user-id-123',
        targetId: 'user-id-456',
        friend: newFriend,
      });

      // 驗證關鍵操作執行，不檢查具體參數
      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(utils.Func.validate.friend).toHaveBeenCalled();
      expect(DB.set.friend).toHaveBeenCalled();

      // 驗證事件發出到正確的 socket，不檢查具體參數
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'userFriendsUpdate',
        expect.any(Array),
      );
    });

    it('應該在嘗試創建他人的好友時拋出錯誤', async () => {
      // 條件：操作者嘗試為其他用戶創建好友
      utils.Func.validate.socket.mockResolvedValue('user-id-456');

      await friendHandler.createFriend(mockIo, mockSocket, {
        userId: 'user-id-123', // 不是操作者，現在操作者是user-id-456
        targetId: 'user-id-456',
        friend: { friendGroupId: 'group-id-123' },
      });

      // 驗證錯誤處理，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.friend).not.toHaveBeenCalled();
    });

    it('應該在嘗試將自己加為好友時拋出錯誤', async () => {
      // 條件：用戶嘗試將自己加為好友
      await friendHandler.createFriend(mockIo, mockSocket, {
        userId: 'user-id-123',
        targetId: 'user-id-123', // 與userId相同
        friend: { friendGroupId: 'group-id-123' },
      });

      // 驗證關鍵操作被阻止，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.friend).not.toHaveBeenCalled();
    });

    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要資料
      await friendHandler.createFriend(mockIo, mockSocket, {
        // 缺少 targetId
        userId: 'user-id-123',
        friend: { friendGroupId: 'group-id-123' },
      });

      // 驗證關鍵操作被阻止，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.friend).not.toHaveBeenCalled();
    });

    it('應該在資料驗證失敗時拋出錯誤', async () => {
      // 條件：好友資料驗證失敗
      utils.Func.validate.friend.mockImplementation(() => {
        throw new StandardizedError(
          '無效的好友資料',
          'ValidationError',
          'VALIDATE_FRIEND',
          'DATA_INVALID',
          400,
        );
      });

      await friendHandler.createFriend(mockIo, mockSocket, {
        userId: 'user-id-123',
        targetId: 'user-id-456',
        friend: { friendGroupId: 'group-id-123' },
      });

      // 驗證關鍵操作被阻止，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.friend).not.toHaveBeenCalled();
    });

    it('應該在找不到用戶 Socket 時妥善處理', async () => {
      // 條件：目標用戶不在線（沒有 socket）
      // 移除目標用戶的 socket
      mockIo.sockets.sockets = new Map([
        ['socket-id-123', { ...mockSocket, userId: 'user-id-123' }],
        // 移除了 socket-id-456
      ]);

      await friendHandler.createFriend(mockIo, mockSocket, {
        userId: 'user-id-123',
        targetId: 'user-id-456',
        friend: { friendGroupId: 'group-id-123' },
      });

      // 應該仍然創建好友關係，但只發送給存在的 socket
      expect(DB.set.friend).toHaveBeenCalled();
      // 只檢查是否調用了 to，不檢查具體參數
      expect(mockIo.to).toHaveBeenCalled();
    });
  });

  describe('updateFriend', () => {
    it('應該成功更新好友關係', async () => {
      // 條件：有效的更新資料，用戶操作自己的帳號
      const editedFriend = {
        friendGroupId: 'new-group-id-456',
      };

      await friendHandler.updateFriend(mockIo, mockSocket, {
        userId: 'user-id-123',
        targetId: 'user-id-456',
        friend: editedFriend,
      });

      // 驗證關鍵操作執行，不檢查具體參數
      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(utils.Func.validate.friend).toHaveBeenCalled();
      expect(DB.set.friend).toHaveBeenCalled();

      // 驗證事件發出，不檢查具體參數
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'userFriendsUpdate',
        expect.any(Array),
      );
    });

    it('應該在嘗試更新他人的好友關係時拋出錯誤', async () => {
      // 條件：嘗試更新他人的好友關係
      utils.Func.validate.socket.mockResolvedValue('user-id-456');

      await friendHandler.updateFriend(mockIo, mockSocket, {
        userId: 'user-id-123', // 不是操作者
        targetId: 'user-id-456',
        friend: { friendGroupId: 'new-group-id-456' },
      });

      // 驗證關鍵操作被阻止，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.friend).not.toHaveBeenCalled();
    });

    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要資料
      await friendHandler.updateFriend(mockIo, mockSocket, {
        // 缺少 targetId
        userId: 'user-id-123',
        friend: { friendGroupId: 'new-group-id-456' },
      });

      // 驗證關鍵操作被阻止，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.friend).not.toHaveBeenCalled();
    });

    it('應該在資料庫操作失敗時妥善處理', async () => {
      // 條件：資料庫操作拋出異常
      DB.set.friend.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });

      await friendHandler.updateFriend(mockIo, mockSocket, {
        userId: 'user-id-123',
        targetId: 'user-id-456',
        friend: { friendGroupId: 'new-group-id-456' },
      });

      // 驗證錯誤處理，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });

  describe('deleteFriend', () => {
    it('應該成功刪除好友關係', async () => {
      // 條件：有效的用戶ID和目標ID，用戶操作自己的帳號
      await friendHandler.deleteFriend(mockIo, mockSocket, {
        userId: 'user-id-123',
        targetId: 'user-id-456',
      });

      // 驗證關鍵操作執行，不關注具體調用次數
      expect(utils.Func.validate.socket).toHaveBeenCalled();
      // 僅檢查是否調用了刪除函數，不關注調用次數
      expect(DB.delete.friend).toHaveBeenCalled();

      // 驗證事件發出，不檢查具體參數
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'userFriendsUpdate',
        expect.any(Array),
      );
    });

    it('應該在嘗試刪除他人的好友關係時拋出錯誤', async () => {
      // 條件：嘗試刪除他人的好友關係
      utils.Func.validate.socket.mockResolvedValue('user-id-456');

      await friendHandler.deleteFriend(mockIo, mockSocket, {
        userId: 'user-id-123', // 不是操作者
        targetId: 'user-id-456',
      });

      // 驗證關鍵操作被阻止，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.delete.friend).not.toHaveBeenCalled();
    });

    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要資料
      await friendHandler.deleteFriend(mockIo, mockSocket, {
        // 缺少 targetId
        userId: 'user-id-123',
      });

      // 驗證關鍵操作被阻止，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.delete.friend).not.toHaveBeenCalled();
    });

    it('應該在資料庫刪除操作失敗時妥善處理', async () => {
      // 條件：資料庫刪除操作失敗
      DB.delete.friend.mockImplementation(() => {
        throw new Error('資料庫刪除操作失敗');
      });

      await friendHandler.deleteFriend(mockIo, mockSocket, {
        userId: 'user-id-123',
        targetId: 'user-id-456',
      });

      // 驗證錯誤處理，不檢查具體錯誤內容
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });
});
