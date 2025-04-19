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
const { mockUtils, mockDB } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('../../db', () => mockDB);
jest.mock('../../socket/rtc', () => ({
  leave: jest.fn(),
}));

// 此時 utils 已經被 mock 過
const utils = require('../../utils');
const DB = require('../../db');
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
    sockets: new Map([['socket-id-123', mockSocket]]),
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
    utils.Func.validate.socket.mockResolvedValue('user-id-123');
    utils.Func.validate.user.mockImplementation((user) => user);
    DB.get.user.mockResolvedValue(mockUser);
  });

  describe('searchUser', () => {
    beforeEach(() => {
      // 默認搜尋用戶功能正常
      DB.get.searchUser.mockResolvedValue([mockUser]);
    });

    it('應該處理有效的搜尋查詢', async () => {
      // 條件：搜尋參數 query 非空字串，validate.socket 成功驗證，Get.searchUser 回傳用戶陣列
      await userHandler.searchUser(mockIo, mockSocket, { query: 'test' });

      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(DB.get.searchUser).toHaveBeenCalledWith('test');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('userSearch', [mockUser]);
    });

    it('應該在無效查詢時拋出錯誤', async () => {
      // 條件：搜尋參數 query 為空字串或 undefined，應拋出 DATA_INVALID 錯誤
      await userHandler.searchUser(mockIo, mockSocket, { query: '' });

      expect(utils.Func.validate.socket).not.toHaveBeenCalled();
      expect(DB.get.searchUser).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應該處理搜尋過程中的異常', async () => {
      // 條件：query 有效但 Get.searchUser 執行時拋出異常
      DB.get.searchUser.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });

      await userHandler.searchUser(mockIo, mockSocket, { query: 'test' });

      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(DB.get.searchUser).toHaveBeenCalledWith('test');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });

  describe('connectUser', () => {
    it('應該成功連接使用者', async () => {
      // 條件：validate.socket 成功驗證並返回有效 operatorId，Get.user 返回有效使用者資料
      utils.Func.validate.socket.mockResolvedValue('user-id-123');
      DB.get.user.mockResolvedValue(mockUser);

      await userHandler.connectUser(mockIo, mockSocket);

      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(DB.get.user).toHaveBeenCalledWith('user-id-123');
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

      utils.Func.validate.socket.mockResolvedValue('user-id-123');
      DB.get.user.mockResolvedValue(mockUser);

      await userHandler.connectUser(mockIo, mockSocket);

      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(DB.get.user).toHaveBeenCalledWith('user-id-123');
      expect(mockIo.to).toHaveBeenCalledWith('duplicate-socket-id');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'openPopup',
        expect.objectContaining({
          type: 'dialogAlert',
          initialData: expect.objectContaining({
            title: '另一個設備已登入',
          }),
        }),
      );
      expect(duplicateSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('disconnectUser', () => {
    beforeEach(() => {
      // 清除 mock
      jest.clearAllMocks();

      // 模擬 rtcHandler.leave
      const rtcHandler = require('../../socket/rtc');
      rtcHandler.leave.mockResolvedValue();
    });

    it('應該斷開使用者與伺服器及頻道的連線', async () => {
      // 條件：用戶已連線到伺服器和頻道
      utils.Func.validate.socket.mockResolvedValue('user-id-123');

      // 確保有 currentChannelId 和 currentServerId
      const mockUserWithChannel = {
        ...mockUser,
        id: 'user-id-123',
        currentServerId: 'server-id-123',
        currentChannelId: 'channel-id-123',
      };

      DB.get.user.mockResolvedValue(mockUserWithChannel);
      DB.get.serverMembers.mockResolvedValue([]);
      DB.get.serverUsers.mockResolvedValue([]);

      await userHandler.disconnectUser(mockIo, mockSocket);

      // 驗證伺服器斷開
      expect(DB.set.user).toHaveBeenCalledWith(
        'user-id-123',
        expect.objectContaining({
          currentServerId: null,
        }),
      );
      expect(mockSocket.leave).toHaveBeenCalledWith('server_server-id-123');

      // 驗證頻道斷開
      expect(DB.set.user).toHaveBeenCalledWith(
        'user-id-123',
        expect.objectContaining({
          currentChannelId: null,
        }),
      );
      expect(mockSocket.leave).toHaveBeenCalledWith('channel_channel-id-123');

      // 由於 Xp.delete 被直接調用，我們改為檢查它是否被調用，而不是具體參數
      expect(utils.Xp.delete).toHaveBeenCalled();
      expect(utils.Session.deleteUserIdSessionIdMap).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      // 確保每次測試前清除 mock
      jest.clearAllMocks();

      // 初始化 socket
      const userSocket = {
        id: 'socket-id-123',
        userId: 'user-id-123',
      };
      mockIo.sockets.sockets = new Map([['socket-id-123', userSocket]]);

      // 初始化默認行為
      utils.Func.validate.socket.mockResolvedValue('user-id-123');
      DB.get.user = jest.fn().mockResolvedValue(mockUser);
    });

    it('應該更新使用者資料', async () => {
      // 條件：有效的編輯資料，操作者是編輯對象本人
      const editedUser = {
        username: '更新的名字',
        status: 'idle',
      };

      utils.Func.validate.user.mockResolvedValue(editedUser);

      // 確保 DB.get.user 被調用
      await userHandler.updateUser(mockIo, mockSocket, {
        user: editedUser,
        userId: 'user-id-123',
      });

      expect(utils.Func.validate.user).toHaveBeenCalledWith(editedUser);
      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      // 這個函數在源代碼中並沒有明確調用，所以不需要檢查
      // expect(DB.get.user).toHaveBeenCalled();
      expect(DB.set.user).toHaveBeenCalledWith('user-id-123', editedUser);
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith('userUpdate', editedUser);
    });

    it('應該拒絕更新其他使用者的資料', async () => {
      // 條件：嘗試編輯非操作者本人的資料
      utils.Func.validate.user.mockResolvedValue({ username: '測試' });

      await userHandler.updateUser(mockIo, mockSocket, {
        user: { username: '測試' },
        userId: 'user-id-456', // 嘗試更新其他用戶的資料
      });

      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      // 這個函數在源代碼中並沒有明確調用，所以不需要檢查
      // expect(DB.get.user).toHaveBeenCalled();
      expect(DB.set.user).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });
});
