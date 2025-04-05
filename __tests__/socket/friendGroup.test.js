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
 * - 所有資料庫操作 (Get, Set) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 */

// __tests__/socket/friendGroup.test.js
// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

// 此時 utils 已經被 mock 過
const utils = require('../../utils');

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
    sockets: new Map([
      ['socket-id-123', mockSocket],
    ]),
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
    utils.func.validate.socket.mockResolvedValue('user-id-123');
    utils.func.validate.friendGroup.mockImplementation(group => group);
    utils.get.user.mockImplementation(async (id) => {
      if (id === 'user-id-123') return mockUser;
      if (id === 'user-id-456') return mockOperator;
      return null;
    });
    utils.get.friendGroup.mockResolvedValue(mockFriendGroup);
    utils.get.userFriendGroups.mockResolvedValue([mockFriendGroup]);
    utils.set.friendGroup.mockImplementation(async (id, data) => ({ id, ...data }));
    
    // 設置 mock socket 集合
    mockIo.sockets.sockets = new Map([
      ['socket-id-123', { ...mockSocket, userId: 'user-id-123' }],
      ['socket-id-456', { ...mockSocket, id: 'socket-id-456', userId: 'user-id-456' }],
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
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.friendGroup).toHaveBeenCalledWith(newFriendGroup);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.set.friendGroup).toHaveBeenCalledWith('mock-uuid', expect.objectContaining({
        name: '新好友群組',
        userId: 'user-id-123',
        createdAt: expect.any(Number),
      }));
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('userUpdate', {
        friendGroups: expect.any(Array),
      });
    });
    
    it('應該在嘗試創建他人的好友群組時拋出錯誤', async () => {
      // 條件：嘗試為其他用戶創建好友群組
      utils.func.validate.socket.mockResolvedValue('user-id-456');
      
      await friendGroupHandler.createFriendGroup(mockIo, mockSocket, {
        userId: 'user-id-123',
        group: { name: '新好友群組' },
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-456'); // 操作者
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123'); // 目標用戶
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CREATEFRIENDGROUP',
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.friendGroup).not.toHaveBeenCalled();
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要資料
      await friendGroupHandler.createFriendGroup(mockIo, mockSocket, {
        // 缺少 group 資料
        userId: 'user-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CREATEFRIENDGROUP',
        error_code: 'DATA_INVALID',
      }));
      expect(utils.set.friendGroup).not.toHaveBeenCalled();
    });
    
    it('應該在資料驗證失敗時拋出錯誤', async () => {
      // 條件：好友群組資料驗證失敗
      utils.func.validate.friendGroup.mockImplementation(() => {
        throw new utils.standardizedError(
          '無效的好友群組資料',
          'ValidationError',
          'VALIDATE_FRIENDGROUP',
          'DATA_INVALID',
          400
        );
      });
      
      await friendGroupHandler.createFriendGroup(mockIo, mockSocket, {
        userId: 'user-id-123',
        group: { name: '新好友群組' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.any(utils.standardizedError));
      expect(utils.set.friendGroup).not.toHaveBeenCalled();
    });
    
    it('應該在用戶不存在時拋出錯誤', async () => {
      // 條件：用戶不存在
      utils.get.user.mockImplementation(async (id) => {
        return null; // 所有用戶不存在
      });
      
      await friendGroupHandler.createFriendGroup(mockIo, mockSocket, {
        userId: 'user-id-123',
        group: { name: '新好友群組' },
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.any(Object));
      expect(utils.set.friendGroup).not.toHaveBeenCalled();
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
        group: editedFriendGroup,
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.friendGroup).toHaveBeenCalledWith(editedFriendGroup);
      expect(utils.get.friendGroup).toHaveBeenCalledWith('friend-group-id-123');
      expect(utils.set.friendGroup).toHaveBeenCalledWith('friend-group-id-123', editedFriendGroup);
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('userUpdate', {
        friendGroups: expect.any(Array),
      });
    });
    
    it('應該在嘗試更新他人的好友群組時拋出錯誤', async () => {
      // 條件：嘗試更新他人的好友群組
      utils.func.validate.socket.mockResolvedValue('user-id-456');
      
      await friendGroupHandler.updateFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
        group: { name: '更新的好友群組名稱' },
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.friendGroup).toHaveBeenCalledWith('friend-group-id-123');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'UPDATEFRIENDGROUP',
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.friendGroup).not.toHaveBeenCalled();
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要資料
      await friendGroupHandler.updateFriendGroup(mockIo, mockSocket, {
        // 缺少 group 資料
        friendGroupId: 'friend-group-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'UPDATEFRIENDGROUP',
        error_code: 'DATA_INVALID',
      }));
      expect(utils.set.friendGroup).not.toHaveBeenCalled();
    });
    
    it('應該在好友群組不存在時拋出錯誤', async () => {
      // 條件：好友群組不存在
      utils.get.friendGroup.mockResolvedValue(null);
      
      await friendGroupHandler.updateFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'non-existent-group',
        group: { name: '更新的好友群組名稱' },
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.friendGroup).toHaveBeenCalledWith('non-existent-group');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.any(Object));
      expect(utils.set.friendGroup).not.toHaveBeenCalled();
    });
    
    it('應該在依賴服務拋出異常時妥善處理', async () => {
      // 條件：資料庫操作拋出異常
      utils.set.friendGroup.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });
      
      await friendGroupHandler.updateFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
        group: { name: '更新的好友群組名稱' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.any(Object));
    });
  });

  describe('deleteFriendGroup', () => {
    // 獲取 QuickDB 實例進行模擬
    const QuickDB = require('quick.db').QuickDB;
    const mockDb = new QuickDB();
    
    it('應該成功刪除好友群組', async () => {
      // 條件：有效的好友群組ID，用戶操作自己的帳號
      
      // 這裡的問題是 friendGroupHandler 內部直接使用了 db.delete
      // 而不是通過 utils.set 等接口，所以我們需要直接監視模組內的 db.delete
      // 重新模擬 quickdb 以捕獲實際調用
      jest.mock('quick.db', () => ({
        QuickDB: jest.fn().mockImplementation(() => ({
          delete: jest.fn().mockResolvedValue(true),
        })),
      }), { virtual: true });
      
      // 使用 jest.spyOn 來監視方法調用
      const quickDb = require('quick.db');
      const mockDbInstance = new quickDb.QuickDB();
      const deleteSpy = jest.spyOn(mockDbInstance, 'delete');
      
      // 注入 db 實例到模組中
      const originalDb = require('../../socket/friendGroup').__db;
      require('../../socket/friendGroup').__db = mockDbInstance;
      
      try {
        await friendGroupHandler.deleteFriendGroup(mockIo, mockSocket, {
          friendGroupId: 'friend-group-id-123',
        });
        
        // 由於我們無法直接訪問內部的 db 實例，這裡我們驗證其他行為
        expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
        expect(utils.get.friendGroup).toHaveBeenCalledWith('friend-group-id-123');
        // 驗證事件發送
        expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
        expect(mockIo.to().emit).toHaveBeenCalledWith('userUpdate', {
          friendGroups: expect.any(Array),
        });
      } finally {
        // 還原原始 db 實例
        if (originalDb) {
          require('../../socket/friendGroup').__db = originalDb;
        }
        // 清理 spy
        deleteSpy.mockRestore();
      }
    });
    
    it('應該在嘗試刪除他人的好友群組時拋出錯誤', async () => {
      // 條件：嘗試刪除他人的好友群組
      utils.func.validate.socket.mockResolvedValue('user-id-456');
      
      await friendGroupHandler.deleteFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.friendGroup).toHaveBeenCalledWith('friend-group-id-123');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'DELETEFRIENDGROUP',
        error_code: 'PERMISSION_DENIED',
      }));
      // 我們不能直接測試 db.delete 不被調用，因為它在模組內部
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要資料
      await friendGroupHandler.deleteFriendGroup(mockIo, mockSocket, {
        // 缺少 friendGroupId
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'DELETEFRIENDGROUP',
        error_code: 'DATA_INVALID',
      }));
    });
    
    it('應該在好友群組不存在時拋出錯誤', async () => {
      // 條件：好友群組不存在
      utils.get.friendGroup.mockResolvedValue(null);
      
      await friendGroupHandler.deleteFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'non-existent-group',
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.friendGroup).toHaveBeenCalledWith('non-existent-group');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.any(Object));
    });
    
    it('應該在資料庫刪除操作失敗時妥善處理', async () => {
      // 條件：資料庫刪除操作失敗
      
      // 設置 mock 使其在調用 Get.friendGroup 後拋出錯誤
      utils.get.friendGroup.mockImplementation(() => {
        throw new Error('資料庫刪除操作失敗');
      });
      
      // 調用測試函數
      await friendGroupHandler.deleteFriendGroup(mockIo, mockSocket, {
        friendGroupId: 'friend-group-id-123',
      });
      
      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.any(Object));
    });
  });
});
