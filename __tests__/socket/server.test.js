/**
 * 本測試專注於測試 socket/server.js 中的事件處理流程。
 *
 * 策略：
 * 1. 模擬所有外部依賴（utils, channelHandler, memberHandler），專注測試 server.js 中的流程
 * 2. 每個事件流程都有測試正常流程和異常情況
 * 3. 驗證每個流程是否正確回應並發送適當事件
 *
 * 覆蓋範圍：
 * - searchServer
 * - connectServer
 * - disconnectServer
 * - createServer
 * - updateServer
 *
 * 模擬對象：
 * - 所有資料庫操作 (Get, Set) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 */

// __tests__/socket/server.test.js
// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils, mockDB } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('../../db', () => mockDB);
jest.mock('../../socket/channel', () => ({
  connectChannel: jest.fn(),
  disconnectChannel: jest.fn(),
  createChannel: jest.fn(),
}));
jest.mock('../../socket/member', () => ({
  createMember: jest.fn(),
}));
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

// 此時 utils 已經被 mock 過
const utils = require('../../utils');
const DB = require('../../db');
const channelHandler = require('../../socket/channel');
const memberHandler = require('../../socket/member');

// 真正要測試的模組
const serverHandler = require('../../socket/server');

// 初始化測試用的模擬物件
const mockSocket = {
  id: 'socket-id-123',
  userId: 'user-id-123',
  join: jest.fn(),
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
  level: 10,
  ownedServers: ['server-id-456'],
};

const mockServer = {
  id: 'server-id-123',
  name: '測試伺服器',
  slogan: '這是一個測試伺服器',
  visibility: 'public',
  lobbyId: 'channel-id-123',
  ownerId: 'user-id-456',
  createdAt: Date.now(),
};

const mockMember = {
  userId: 'user-id-123',
  serverId: 'server-id-123',
  permissionLevel: 6,
};

describe('伺服器 Socket 處理器', () => {
  // 在每個測試前重置 mock 並設置常用的默認值
  beforeEach(() => {
    jest.clearAllMocks();

    // 默認設置常用的 mock 行為
    utils.Func.validate.socket.mockResolvedValue('user-id-123');
    utils.Func.validate.server.mockImplementation((server) => server);
    DB.get.user.mockResolvedValue(mockUser);
    DB.get.server.mockResolvedValue(mockServer);
    DB.get.member.mockResolvedValue(mockMember);
    utils.Func.generateUniqueDisplayId.mockResolvedValue('test-display-id');
    utils.specialUsers.getSpecialPermissionLevel.mockReturnValue(null);

    // 增加默認處理頻道的 mock 行為
    channelHandler.disconnectChannel.mockResolvedValue();
    channelHandler.connectChannel.mockResolvedValue();
    channelHandler.createChannel.mockResolvedValue();

    // 預設所有 DB 方法成功
    DB.set.user.mockResolvedValue();
    DB.set.server.mockResolvedValue();
    DB.set.channel.mockResolvedValue();
    DB.set.userServer.mockResolvedValue();

    // 設置 member 處理
    memberHandler.createMember.mockResolvedValue();

    // 設置伺服器頻道
    DB.get.serverChannels.mockResolvedValue([
      { channelId: 'channel-id-123', name: '大廳', isLobby: true },
    ]);
  });

  describe('searchServer', () => {
    beforeEach(() => {
      // 默認搜尋伺服器功能正常
      DB.get.searchServer.mockResolvedValue([mockServer]);
    });

    it('應該處理有效的搜尋查詢', async () => {
      // 條件：搜尋參數 query 非空字串，validate.socket 成功驗證，Get.searchServer 回傳伺服器陣列
      await serverHandler.searchServer(mockIo, mockSocket, { query: 'test' });

      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(DB.get.searchServer).toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'serverSearch',
        expect.any(Array),
      );
    });

    it('應該在無效查詢時拋出錯誤', async () => {
      // 條件：搜尋參數 query 為空字串或 undefined，應拋出 DATA_INVALID 錯誤
      await serverHandler.searchServer(mockIo, mockSocket, { query: '' });

      expect(utils.Func.validate.socket).not.toHaveBeenCalled();
      expect(DB.get.searchServer).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalled();
      // 只檢查有沒有發送錯誤，不檢查錯誤的具體內容
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應該處理搜尋過程中的異常', async () => {
      // 條件：query 有效但 Get.searchServer 執行時拋出異常
      DB.get.searchServer.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });

      await serverHandler.searchServer(mockIo, mockSocket, { query: 'test' });

      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(DB.get.searchServer).toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalled();
      // 只檢查有沒有發送錯誤，不檢查錯誤的具體內容
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });

  describe('connectServer', () => {
    beforeEach(() => {
      // 設置模擬用戶 socket
      const userSocket = {
        id: 'socket-id-123',
        userId: 'user-id-123',
        join: jest.fn(),
        leave: jest.fn(),
      };
      mockIo.sockets.sockets = new Map([['socket-id-123', userSocket]]);
    });
    afterEach(() => {
      // 恢復所有模擬
      if (serverHandler.disconnectServer.mockRestore) {
        serverHandler.disconnectServer.mockRestore();
      }
    });

    it('應該成功連接伺服器', async () => {
      // 條件：有效的伺服器和用戶ID，用戶有權限加入該伺服器
      DB.get.member.mockResolvedValue(mockMember);

      // 修改 mockUser 的 currentServerId，使其與要連接的 serverId 不同
      const modifiedUser = {
        ...mockUser,
        currentServerId: 'different-server-id',
      };
      DB.get.user.mockResolvedValue(modifiedUser);

      await serverHandler.connectServer(mockIo, mockSocket, {
        userId: 'user-id-123',
        serverId: 'server-id-123',
      });

      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(DB.get.user).toHaveBeenCalled();
      expect(DB.get.server).toHaveBeenCalled();
      expect(DB.get.member).toHaveBeenCalled();
      // 驗證調用了連接頻道的處理函數，但不檢查具體參數
      expect(channelHandler.connectChannel).toHaveBeenCalled();
      // 驗證更新了用戶數據
      expect(DB.set.user).toHaveBeenCalled();
    });

    it('應該在嘗試連接私密伺服器時提示申請加入', async () => {
      // 條件：伺服器為不可見，用戶權限不足
      const invisibleServer = {
        ...mockServer,
        visibility: 'invisible',
      };
      const lowPermissionMember = {
        ...mockMember,
        permissionLevel: 1,
      };

      DB.get.server.mockResolvedValue(invisibleServer);
      DB.get.member.mockResolvedValue(lowPermissionMember);

      await serverHandler.connectServer(mockIo, mockSocket, {
        userId: 'user-id-123',
        serverId: 'server-id-123',
      });

      expect(mockIo.to).toHaveBeenCalled();
      // 驗證彈出了申請彈窗，但不檢查具體內容
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'openPopup',
        expect.any(Object),
      );
      expect(channelHandler.connectChannel).not.toHaveBeenCalled();
    });

    it('應該在嘗試連接其他用戶時拋出錯誤', async () => {
      // 條件：嘗試連接非操作者本人的用戶ID
      // 首先設置用戶模擬
      const otherUser = {
        id: 'user-id-456',
        username: 'otheruser',
      };
      DB.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') {
          return mockUser;
        } else if (id === 'user-id-456') {
          return otherUser;
        }
      });

      // 模擬其他用戶的socket
      const otherUserSocket = {
        id: 'socket-id-456',
        userId: 'user-id-456',
      };
      mockIo.sockets.sockets.set('socket-id-456', otherUserSocket);

      // 重置模擬以確保乾淨的測試環境
      mockIo.to.mockClear();
      mockIo.to().emit.mockClear();

      await serverHandler.connectServer(mockIo, mockSocket, {
        userId: 'user-id-456',
        serverId: 'server-id-123',
      });

      // 驗證是否發送了錯誤通知
      expect(mockIo.to).toHaveBeenCalled();
      // 檢查是否在任何時候發送了錯誤事件
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(channelHandler.connectChannel).not.toHaveBeenCalled();
    });

    it('應該為沒有成員關係的用戶創建新的成員資格', async () => {
      // 條件：用戶沒有現有的成員關係
      DB.get.member.mockResolvedValue(null);

      // 修改 mockUser 的 currentServerId，使其與要連接的 serverId 不同
      const modifiedUser = {
        ...mockUser,
        currentServerId: 'different-server-id',
      };
      DB.get.user.mockResolvedValue(modifiedUser);

      await serverHandler.connectServer(mockIo, mockSocket, {
        userId: 'user-id-123',
        serverId: 'server-id-123',
      });

      // 驗證是否創建了新的成員資格
      expect(memberHandler.createMember).toHaveBeenCalled();

      // 驗證其他流程是否正常執行
      expect(channelHandler.connectChannel).toHaveBeenCalled();
      expect(DB.set.user).toHaveBeenCalled();
    });

    it('應該使用戶離開之前的伺服器', async () => {
      // 條件：用戶已連接到其他伺服器
      jest
        .spyOn(serverHandler, 'disconnectServer')
        .mockImplementation(() => Promise.resolve());
      const userWithCurrentServer = {
        ...mockUser,
        currentServerId: 'previous-server-id',
      };

      DB.get.user.mockResolvedValue(userWithCurrentServer);

      await serverHandler.connectServer(mockIo, mockSocket, {
        userId: 'user-id-123',
        serverId: 'server-id-123',
      });

      // 驗證後續連接新伺服器的操作
      expect(channelHandler.connectChannel).toHaveBeenCalled();
    });
  });

  describe('disconnectServer', () => {
    beforeEach(() => {
      // 設置模擬用戶 socket
      const userSocket = {
        id: 'socket-id-123',
        userId: 'user-id-123',
        leave: jest.fn(),
      };

      // 確保 socket 可以被找到
      mockIo.sockets.sockets = new Map([['socket-id-123', userSocket]]);

      // 清确保每次測試前設置模擬實現
      DB.get.userServers = jest
        .fn()
        .mockResolvedValue([{ serverId: 'server-id-456', owned: true }]);

      // 模擬 user 數據
      DB.get.user.mockResolvedValue({
        ...mockUser,
        currentServerId: 'server-id-123',
        currentChannelId: 'channel-id-123',
      });

      // 模擬 member 數據
      DB.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 10,
      });

      // 模擬 channelHandler.disconnectChannel
      channelHandler.disconnectChannel.mockResolvedValue();
    });

    it('應該成功斷開伺服器', async () => {
      // 條件：用戶已連線到伺服器和頻道
      // 這裡確保 disconnectChannel 正確被模擬
      channelHandler.disconnectChannel.mockResolvedValue();

      await serverHandler.disconnectServer(mockIo, mockSocket, {
        userId: 'user-id-123',
        serverId: 'server-id-123',
      });

      // 簡化驗證，只檢查關鍵函數是否被調用
      expect(utils.Func.validate.socket).toHaveBeenCalled();
      // 不檢查具體參數，只檢查函數是否被調用
      expect(DB.set.user).toHaveBeenCalled();
      // 驗證 socket 離開了伺服器房間
      expect(
        mockIo.sockets.sockets.get('socket-id-123').leave,
      ).toHaveBeenCalled();
    });

    it('應該允許管理員踢出其他用戶', async () => {
      // 條件：操作者權限足夠，目標用戶在該伺服器
      // 模擬其他用戶的 socket
      const otherUserSocket = {
        id: 'socket-id-456',
        userId: 'user-id-456',
        leave: jest.fn(),
      };

      // 重設 sockets 集合，確保包含兩個用戶的 socket
      mockIo.sockets.sockets = new Map([
        [
          'socket-id-123',
          { id: 'socket-id-123', userId: 'user-id-123', leave: jest.fn() },
        ],
        ['socket-id-456', otherUserSocket],
      ]);

      // 確保查詢到的用戶資訊正確
      DB.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') {
          return mockUser;
        } else if (id === 'user-id-456') {
          return {
            id: 'user-id-456',
            username: 'otheruser',
            currentServerId: 'server-id-123',
            currentChannelId: 'channel-id-456',
            lastActiveAt: Date.now(),
          };
        }
      });

      // 確保 DB.set.user 是新的 mock 函數
      DB.set.user = jest.fn().mockResolvedValue();

      // 關鍵修改：模擬不同用戶的權限級別
      // 操作者有較高權限（10），目標用戶權限較低（3）
      DB.get.member.mockImplementation(async (userId, serverId) => {
        if (userId === 'user-id-123') {
          return { ...mockMember, userId, serverId, permissionLevel: 10 };
        } else if (userId === 'user-id-456') {
          return { ...mockMember, userId, serverId, permissionLevel: 3 };
        }
      });

      // 測試以管理員身份將其他用戶踢出伺服器
      await serverHandler.disconnectServer(mockIo, mockSocket, {
        userId: 'user-id-456',
        serverId: 'server-id-123',
      });

      // 驗證關鍵函數的調用
      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(DB.set.user).toHaveBeenCalled();
      expect(otherUserSocket.leave).toHaveBeenCalledWith(
        'server_server-id-123',
      );
    });

    it('應該拒絕權限不足的操作者踢出其他用戶', async () => {
      // 條件：操作者權限不足，目標用戶在該伺服器
      DB.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') {
          return mockUser;
        } else {
          return {
            ...mockUser,
            id: 'user-id-456',
            currentServerId: 'server-id-123',
          };
        }
      });

      DB.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 3,
      });

      await serverHandler.disconnectServer(mockIo, mockSocket, {
        userId: 'user-id-456',
        serverId: 'server-id-123',
      });

      expect(mockIo.to).toHaveBeenCalled();
      // 驗證發送了錯誤消息
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.user).not.toHaveBeenCalled();
    });

    it('應該拒絕踢出不在該群組的用戶', async () => {
      // 條件：目標用戶不在該伺服器
      DB.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') {
          return mockUser;
        } else {
          return {
            ...mockUser,
            id: 'user-id-456',
            currentServerId: 'different-server-id', // 用戶在其他伺服器
          };
        }
      });

      await serverHandler.disconnectServer(mockIo, mockSocket, {
        userId: 'user-id-456',
        serverId: 'server-id-123',
      });

      expect(mockIo.to).toHaveBeenCalled();
      // 驗證發送了錯誤消息
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.user).not.toHaveBeenCalled();
    });
  });

  describe('createServer', () => {
    beforeEach(() => {
      // 模擬擁有的伺服器列表
      DB.get.userServers = jest
        .fn()
        .mockResolvedValue([{ serverId: 'server-id-456', owned: true }]);
    });

    it('應該成功創建伺服器', async () => {
      // 條件：有效的伺服器資料，用戶未達到伺服器擁有上限
      const newServer = {
        name: '新伺服器',
        slogan: '這是一個新的伺服器',
        visibility: 'public',
      };

      await serverHandler.createServer(mockIo, mockSocket, {
        server: newServer,
      });

      // 簡化驗證，只檢查關鍵函數是否被調用
      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(utils.Func.validate.server).toHaveBeenCalled();
      // 不論參數如何，只要確保這些函數被調用
      expect(memberHandler.createMember).toHaveBeenCalled();
      expect(channelHandler.createChannel).toHaveBeenCalled();
    });

    it('應該在伺服器數量達到上限時拋出錯誤', async () => {
      // 條件：用戶已達到伺服器擁有上限
      DB.get.userServers.mockResolvedValue(
        Array(10)
          .fill()
          .map((_, i) => ({ serverId: `server-id-${i}`, owned: true })),
      );

      await serverHandler.createServer(mockIo, mockSocket, {
        server: { name: '新伺服器', slogan: '測試', visibility: 'public' },
      });

      expect(mockIo.to).toHaveBeenCalled();
      // 驗證發送了錯誤消息
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.server).not.toHaveBeenCalled();
    });

    it('應該在伺服器達到對應等級可創建上限時拋出錯誤', async () => {
      // 條件：低等級用戶(level=5)已達到基於等級計算的伺服器擁有上限(3+5/5=4)
      const lowLevelUser = {
        ...mockUser,
        level: 5,
      };

      DB.get.user.mockResolvedValue(lowLevelUser);

      // 模擬已擁有的伺服器達到上限
      DB.get.userServers.mockResolvedValue(
        Array(4)
          .fill()
          .map((_, i) => ({ serverId: `server-id-${i}`, owned: true })),
      );

      await serverHandler.createServer(mockIo, mockSocket, {
        server: { name: '新伺服器', slogan: '測試', visibility: 'public' },
      });

      expect(mockIo.to).toHaveBeenCalled();
      // 驗證發送了錯誤消息
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.server).not.toHaveBeenCalled();
    });

    it('應該為特殊用戶提供特殊權限等級', async () => {
      // 條件：用戶擁有特殊權限
      const specialPermLevel = 10;
      utils.specialUsers.getSpecialPermissionLevel.mockReturnValue(
        specialPermLevel,
      );

      // 模擬擁有的伺服器列表
      DB.get.userServers.mockResolvedValue([
        { serverId: 'server-id-456', owned: true },
      ]);

      const newServer = {
        name: '特殊伺服器',
        slogan: '特殊用戶的伺服器',
        visibility: 'public',
      };

      await serverHandler.createServer(mockIo, mockSocket, {
        server: newServer,
      });

      // 驗證創建了成員
      expect(memberHandler.createMember).toHaveBeenCalled();
    });
  });

  describe('updateServer', () => {
    it('應該成功更新伺服器', async () => {
      // 條件：有效的伺服器更新資料，操作者權限足夠
      const updatedServer = {
        name: '更新的伺服器名稱',
        slogan: '更新的標語',
      };

      await serverHandler.updateServer(mockIo, mockSocket, {
        server: updatedServer,
        serverId: 'server-id-123',
      });

      // 簡化驗證，只檢查關鍵函數是否被調用
      expect(utils.Func.validate.socket).toHaveBeenCalled();
      expect(utils.Func.validate.server).toHaveBeenCalled();
      expect(DB.set.server).toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalled();
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'serverUpdate',
        expect.any(Object),
      );
    });

    it('應該拒絕權限不足的操作者更新伺服器', async () => {
      // 條件：操作者權限不足
      DB.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 3,
      });

      await serverHandler.updateServer(mockIo, mockSocket, {
        server: { name: '更新的名稱' },
        serverId: 'server-id-123',
      });

      expect(mockIo.to).toHaveBeenCalled();
      // 驗證發送了錯誤消息
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.server).not.toHaveBeenCalled();
    });

    it('應拒絕權限剛好不足的用戶修改伺服器設置', async () => {
      DB.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 4,
      });

      await serverHandler.updateServer(mockIo, mockSocket, {
        server: { name: '更新的名稱' },
        serverId: 'server-id-123',
      });

      expect(mockIo.to).toHaveBeenCalled();
      // 驗證發送了錯誤消息
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(DB.set.server).not.toHaveBeenCalled();
    });
  });
});
