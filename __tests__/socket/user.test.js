/**
 * 本測試專注於測試 socket/user.js 中的事件處理流程。
 * 
 * 策略：
 * 1. 模擬所有外部依賴（utils, rtcHandler），專注測試 user.js 中的流程
 * 2. 每個事件流程都有測試正常流程和異常情況
 * 3. 驗證每個流程是否正確回應並發送適當事件
 * 
 * 覆蓋範圍：
 * - searchUser
 * - connectUser
 * - disconnectUser
 * - updateUser
 * 
 * 模擬對象：
 * - 所有資料庫操作 (Get, Set) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 * 
 * 後續維護：
 * - 當 user.js 中的邏輯變更時，對應測試案例需要更新
 * - 新增功能時，應添加相應的測試案例
 * - 修改後運行測試以確保不會破壞現有功能
 */
// __tests__/socket/user.test.js
// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('../../socket/rtc', () => ({
  leave: jest.fn(),
}));

// 此時 utils 已經被 mock 過
const utils = require('../../utils');

// 真正要測試的模組
const userHandler = require('../../socket/user');

// 初始化測試用的模擬物件
const mockSocket = {
  id: 'socket-id-123',
  userId: 'user-id-123',
  sessionId: 'session-id-123',
  leave: jest.fn(),
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
  currentServerId: 'server-id-123',
  currentChannelId: 'channel-id-123',
  lastActiveAt: Date.now(),
};

describe('使用者 Socket 處理器', () => {
  // 在每個測試前重置 mock 並設置常用的默認值
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 默認設置常用的 mock 行為
    utils.func.validate.socket.mockResolvedValue('user-id-123');
    utils.func.validate.user.mockImplementation(user => user);
    utils.get.user.mockResolvedValue(mockUser);
  });
  
  describe('searchUser', () => {
    beforeEach(() => {
      // 默認搜尋用戶功能正常
      utils.get.searchUser.mockResolvedValue([mockUser]);
    });
    
    it('應該處理有效的搜尋查詢', async () => {
      // 條件：搜尋參數 query 非空字串，validate.socket 成功驗證，Get.searchUser 回傳用戶陣列
      await userHandler.searchUser(mockIo, mockSocket, { query: 'test' });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.searchUser).toHaveBeenCalledWith('test');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('userSearch', [mockUser]);
    });
    
    it('應該在無效查詢時拋出錯誤', async () => {
      // 條件：搜尋參數 query 為空字串或 undefined，應拋出 DATA_INVALID 錯誤
      await userHandler.searchUser(mockIo, mockSocket, { query: '' });
      
      expect(utils.func.validate.socket).not.toHaveBeenCalled();
      expect(utils.get.searchUser).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_code: 'DATA_INVALID',
        error_source: 'SEARCHUSER',
      }));
    });
    
    it('應該處理搜尋過程中的異常', async () => {
      // 條件：query 有效但 Get.searchUser 執行時拋出異常
      utils.get.searchUser.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });
      
      await userHandler.searchUser(mockIo, mockSocket, { query: 'test' });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.searchUser).toHaveBeenCalledWith('test');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'SEARCHUSER',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });
  
  describe('connectUser', () => {
    it('應該成功連接使用者', async () => {
      // 條件：validate.socket 成功驗證並返回有效 operatorId，Get.user 返回有效使用者資料
      utils.func.validate.socket.mockResolvedValue('user-id-123');
      utils.get.user.mockResolvedValue(mockUser);
      
      await userHandler.connectUser(mockIo, mockSocket);
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('userUpdate', mockUser);
    });
    
    it('應該斷開重複連線的使用者', async () => {
      // 條件：相同 userId 但不同 socketId 的使用者已連線
      const duplicateSocket = {
        id: 'duplicate-socket-id',
        userId: 'user-id-123',
        disconnect: jest.fn(),
      };
      
      mockIo.sockets.sockets = new Map([
        ['socket-id-123', mockSocket],
        ['duplicate-socket-id', duplicateSocket],
      ]);
      
      utils.func.validate.socket.mockResolvedValue('user-id-123');
      utils.get.user.mockResolvedValue(mockUser);
      
      await userHandler.connectUser(mockIo, mockSocket);
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(mockIo.to).toHaveBeenCalledWith('duplicate-socket-id');
      expect(mockIo.to().emit).toHaveBeenCalledWith('openPopup', { popupType: 'anotherDeviceLogin' });
      expect(duplicateSocket.disconnect).toHaveBeenCalled();
    });
  });
  
  describe('disconnectUser', () => {
    it('應該斷開使用者與伺服器及頻道的連線', async () => {
      // 條件：用戶已連線到伺服器和頻道
      utils.func.validate.socket.mockResolvedValue('user-id-123');
      utils.get.user.mockResolvedValue(mockUser);
      utils.get.serverMembers.mockResolvedValue([]);
      utils.get.serverUsers.mockResolvedValue([]);
      
      await userHandler.disconnectUser(mockIo, mockSocket);
      
      // 驗證伺服器斷開
      expect(utils.set.user).toHaveBeenCalledWith('user-id-123', {
        currentServerId: null,
        lastActiveAt: expect.any(Number),
      });
      expect(mockSocket.leave).toHaveBeenCalledWith('server_server-id-123');
      
      // 驗證頻道斷開
      expect(utils.set.user).toHaveBeenCalledWith('user-id-123', {
        currentChannelId: null,
        lastActiveAt: expect.any(Number),
      });
      expect(mockSocket.leave).toHaveBeenCalledWith('channel_channel-id-123');
      
      // 驗證用戶映射清除
      expect(utils.xp.delete).toHaveBeenCalledWith(mockSocket);
      expect(utils.map.deleteUserIdSessionIdMap).toHaveBeenCalledWith('user-id-123', 'session-id-123');
      expect(utils.map.deleteUserIdSocketIdMap).toHaveBeenCalledWith('user-id-123', 'socket-id-123');
    });
  });
  
  describe('updateUser', () => {
    it('應該更新使用者資料', async () => {
      // 條件：有效的編輯資料，操作者是編輯對象本人
      const editedUser = {
        username: '更新的名字',
        status: 'idle',
      };
      
      utils.func.validate.socket.mockResolvedValue('user-id-123');
      utils.get.user.mockResolvedValue(mockUser);
      utils.func.validate.user.mockResolvedValue(editedUser);
      
      const userSocket = {
        id: 'socket-id-123',
        userId: 'user-id-123',
      };
      mockIo.sockets.sockets = new Map([
        ['socket-id-123', userSocket],
      ]);
      
      await userHandler.updateUser(mockIo, mockSocket, { 
        user: editedUser,
        userId: 'user-id-123'
      });
      
      expect(utils.func.validate.user).toHaveBeenCalledWith(editedUser);
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.set.user).toHaveBeenCalledWith('user-id-123', editedUser);
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('userUpdate', editedUser);
    });
    
    it('應該拒絕更新其他使用者的資料', async () => {
      // 條件：嘗試編輯非操作者本人的資料
      utils.func.validate.socket.mockResolvedValue('user-id-123');
      utils.func.validate.user.mockResolvedValue({ username: '測試' });
      
      // 操作者資料
      utils.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') {
          return mockUser;
        } else {
          return {
            id: 'user-id-456',
            username: '其他使用者',
          };
        }
      });
      
      await userHandler.updateUser(mockIo, mockSocket, { 
        user: { username: '測試' }, 
        userId: 'user-id-456'
      });
      
      expect(utils.func.validate.user).toHaveBeenCalledWith({ username: '測試' });
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.user).toHaveBeenCalledWith('user-id-456');
      expect(utils.set.user).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_code: 'PERMISSION_DENIED',
      }));
    });
  });
});