/**
 * 本測試專注於測試 socket/friendGroup.js 中的事件處理流程。
 *
 * 策略：
 * 1. 模擬所有外部依賴（utils, uuid），專注測試 friendGroup.js 中的流程
 * 2. 每個事件流程都有測試正常流程和異常情況
 * 3. 驗證每個流程是否正確回應並發送適當事件
 *
 * 覆蓋範圍：
 * - createFriendGroup
 * - updateFriendGroup
 * - deleteFriendGroup
 *
 * 模擬對象：
 * - 所有資料庫操作 (DB.get, DB.set, DB.delete) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 */

// __tests__/socket/friendGroup.test.js
// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils, mockDB } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('../../db', () => mockDB);
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

// 此時 utils 和 DB 已經被 mock 過
const utils = require('../../utils');
const DB = require('../../db');
const StandardizedError = require('../../standardizedError');

// 真正要測試的模組
const friendGroupHandler = require('../../socket/friendGroup');

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
  currentChannelId: null,
  lastActiveAt: Date.now(),
};

const mockFriendGroup = {
  id: 'friend-group-id-123',
  name: '測試好友群組',
  userId: 'user-id-123',
  createdAt: Date.now(),
};

const mockOperator = {
  id: 'user-id-456',
  username: 'operatoruser',
};

describe('好友群組 Socket 處理器', () => {
  // 在每個測試前重置 mock 並設置常用的默認值
  beforeEach(() => {
    jest.clearAllMocks();

    // 默認設置常用的 mock 行為
    utils.Func.validate.socket.mockResolvedValue('user-id-123');
    utils.Func.validate.friendGroup.mockImplementation((group) => group);

    DB.get.user.mockImplementation(async (id) => {
      if (id === 'user-id-123') return mockUser;
      if (id === 'user-id-456') return mockOperator;
      return null;
    });
    DB.get.friendGroup.mockResolvedValue(mockFriendGroup);
    DB.get.userFriendGroups.mockResolvedValue([mockFriendGroup]);
    DB.get.friendGroupFriends.mockResolvedValue([]);
    DB.set.friendGroup.mockImplementation(async (id, data) => ({
      id,
      ...data,
    }));
    DB.delete.friendGroup.mockResolvedValue(true);

    // 設置 mock socket 集合
    mockIo.sockets.sockets = new Map([
      ['socket-id-123', { ...mockSocket, userId: 'user-id-123' }],
      [
        'socket-id-456',
        { ...mockSocket, id: 'socket-id-456', userId: 'user-id-456' },
      ],
    ]);
  });

  describe('createFriendGroup', () => {
    it('應該成功創建好友群組', async () => {
      // 條件：有效的好友群組資料，用戶操作自己的帳號
      const newFriendGroup = {
        name: '新好友群組',
      };

      await friendGroupHandler.createFriendGroup(mockIo, mockSocket, {
        userId: 'user-id-123',
        group: newFriendGroup,
      });

      // 驗證關鍵操作執行，不檢查具體參數
      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(utils.Func.validate.friendGroup).toHaveBeenCalled();

      // 驗證資料庫操作，只關注是否執行
      expect(DB.set.friendGroup).toHaveBeenCalled();

      // 驗證事件發送
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'userFriendGroupsUpdate',
        expect.any(Array),
      );
    });

    it('應該在嘗試創建他人的好友群組時拋出錯誤', async () => {
      // 條件：嘗試為其他用戶創建好友群組
      utils.Func.validate.socket.mockResolvedValue('user-id-456');

      await friendGroupHandler.createFriendGroup(mockIo, mockSocket, {
        userId: 'user-id-123',
        group: { name: '新好友群組' },
      });

      // 驗證關鍵操作執行
      expect(utils.Func.validate.socket).toHaveBeenCalled();

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );

      // 驗證未創建群組
      expect(DB.set.friendGroup).not.toHaveBeenCalled();
    });

    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要資料
      await friendGroupHandler.createFriendGroup(mockIo, mockSocket, {
        // 缺少 group 資料
        userId: 'user-id-123',
      });

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );

      // 驗證未創建群組
      expect(DB.set.friendGroup).not.toHaveBeenCalled();
    });

    it('應該在資料驗證失敗時拋出錯誤', async () => {
      // 條件：好友群組資料驗證失敗
      utils.Func.validate.friendGroup.mockImplementation(() => {
        throw new utils.standardizedError(
          '無效的好友群組資料',
          'ValidationError',
          'VALIDATE_FRIENDGROUP',
          'DATA_INVALID',
          400,
        );
      });

      await friendGroupHandler.createFriendGroup(mockIo, mockSocket, {
        userId: 'user-id-123',
        group: { name: '新好友群組' },
      });

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );

      // 驗證未創建群組
      expect(DB.set.friendGroup).not.toHaveBeenCalled();
    });

    it('應該在建立過程中發生異常時妥善處理', async () => {
      // 條件：資料庫操作異常
      DB.set.friendGroup.mockImplementation(() => {
        throw new Error('資料庫操作失敗');
      });

      await friendGroupHandler.createFriendGroup(mockIo, mockSocket, {
        userId: 'user-id-123',
        group: { name: '新好友群組' },
      });

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });

  describe('updateFriendGroup', () => {
    it('應該成功更新好友群組', async () => {
      // 條件：有效的好友群組更新資料，用戶操作自己的帳號
      const editedFriendGroup = {
        name: '更新的好友群組名稱',
      };

      await friendGroupHandler.updateFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
        userId: 'user-id-123',
        group: editedFriendGroup,
      });

      // 驗證關鍵操作執行
      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(utils.Func.validate.friendGroup).toHaveBeenCalled();

      // 驗證資料庫操作
      expect(DB.set.friendGroup).toHaveBeenCalled();

      // 驗證事件發送
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'userFriendGroupsUpdate',
        expect.any(Array),
      );
    });

    it('應該在嘗試更新他人的好友群組時拋出錯誤', async () => {
      // 條件：嘗試更新他人的好友群組
      utils.Func.validate.socket.mockResolvedValue('user-id-456');

      await friendGroupHandler.updateFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
        userId: 'user-id-123',
        group: { name: '更新的好友群組名稱' },
      });

      // 驗證關鍵操作執行
      expect(utils.Func.validate.socket).toHaveBeenCalled();

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );

      // 驗證未更新群組
      expect(DB.set.friendGroup).not.toHaveBeenCalled();
    });

    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要資料
      await friendGroupHandler.updateFriendGroup(mockIo, mockSocket, {
        // 缺少 group 資料
        friendGroupId: 'friend-group-id-123',
        userId: 'user-id-123',
      });

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );

      // 驗證未更新群組
      expect(DB.set.friendGroup).not.toHaveBeenCalled();
    });

    it('應該在依賴服務拋出異常時妥善處理', async () => {
      // 條件：資料庫操作拋出異常
      DB.set.friendGroup.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });

      await friendGroupHandler.updateFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
        userId: 'user-id-123',
        group: { name: '更新的好友群組名稱' },
      });

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });

  describe('deleteFriendGroup', () => {
    it('應該成功刪除好友群組', async () => {
      // 條件：有效的好友群組ID，用戶操作自己的帳號
      await friendGroupHandler.deleteFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
        userId: 'user-id-123',
      });

      // 驗證關鍵操作執行
      expect(utils.Func.validate.socket).toHaveBeenCalled();

      // 驗證資料庫操作
      expect(DB.delete.friendGroup).toHaveBeenCalled();

      // 驗證事件發送
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'userFriendGroupsUpdate',
        expect.any(Array),
      );
    });

    it('應該在嘗試刪除他人的好友群組時拋出錯誤', async () => {
      // 條件：嘗試刪除他人的好友群組
      utils.Func.validate.socket.mockResolvedValue('user-id-456');

      await friendGroupHandler.deleteFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
        userId: 'user-id-123',
      });

      // 驗證關鍵操作執行
      expect(utils.Func.validate.socket).toHaveBeenCalled();

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );

      // 驗證未刪除群組
      expect(DB.delete.friendGroup).not.toHaveBeenCalled();
    });

    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要資料
      await friendGroupHandler.deleteFriendGroup(mockIo, mockSocket, {
        // 缺少 friendGroupId
        userId: 'user-id-123',
      });

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );

      // 驗證未刪除群組
      expect(DB.delete.friendGroup).not.toHaveBeenCalled();
    });

    it('應該在刪除過程中發生異常時妥善處理', async () => {
      // 條件：資料庫刪除操作失敗
      DB.delete.friendGroup.mockImplementation(() => {
        throw new Error('資料庫刪除操作失敗');
      });

      await friendGroupHandler.deleteFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
        userId: 'user-id-123',
      });

      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });
});
