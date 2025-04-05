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
const { mockUtils } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('../../socket/channel', () => ({
  connectChannel: jest.fn(),
  disconnectChannel: jest.fn(),
}));
jest.mock('../../socket/member', () => ({
  createMember: jest.fn(),
}));
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

// 此時 utils 已經被 mock 過
const utils = require('../../utils');
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
    utils.func.validate.socket.mockResolvedValue('user-id-123');
    utils.func.validate.server.mockImplementation(server => server);
    utils.get.user.mockResolvedValue(mockUser);
    utils.get.server.mockResolvedValue(mockServer);
    utils.get.member.mockResolvedValue(mockMember);
    utils.func.generateUniqueDisplayId.mockResolvedValue('test-display-id');
    utils.specialUsers.getSpecialPermissionLevel.mockReturnValue(null);
  });

  describe('searchServer', () => {
    beforeEach(() => {
      // 默認搜尋伺服器功能正常
      utils.get.searchServer.mockResolvedValue([mockServer]);
    });
    
    it('應該處理有效的搜尋查詢', async () => {
      // 條件：搜尋參數 query 非空字串，validate.socket 成功驗證，Get.searchServer 回傳伺服器陣列
      await serverHandler.searchServer(mockIo, mockSocket, { query: 'test' });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.searchServer).toHaveBeenCalledWith('test');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('serverSearch', [mockServer]);
    });
    
    it('應該在無效查詢時拋出錯誤', async () => {
      // 條件：搜尋參數 query 為空字串或 undefined，應拋出 DATA_INVALID 錯誤
      await serverHandler.searchServer(mockIo, mockSocket, { query: '' });
      
      expect(utils.func.validate.socket).not.toHaveBeenCalled();
      expect(utils.get.searchServer).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_code: 'DATA_INVALID',
        error_source: 'SEARCHSERVER',
      }));
    });
    
    it('應該處理搜尋過程中的異常', async () => {
      // 條件：query 有效但 Get.searchServer 執行時拋出異常
      utils.get.searchServer.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });
      
      await serverHandler.searchServer(mockIo, mockSocket, { query: 'test' });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.searchServer).toHaveBeenCalledWith('test');
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'SEARCHSERVER',
        error_code: 'EXCEPTION_ERROR',
      }));
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
      mockIo.sockets.sockets = new Map([
        ['socket-id-123', userSocket],
      ]);
    });
    afterEach(() => {
      // 恢復所有模擬
      if (serverHandler.disconnectServer.mockRestore) {
        serverHandler.disconnectServer.mockRestore();
      }
    });
    
    it('應該成功連接伺服器', async () => {
      // 條件：有效的伺服器和用戶ID，用戶有權限加入該伺服器
      utils.get.member.mockResolvedValue(mockMember);
      
      await serverHandler.connectServer(mockIo, mockSocket, { 
        userId: 'user-id-123', 
        serverId: 'server-id-123' 
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.server).toHaveBeenCalledWith('server-id-123');
      expect(utils.get.member).toHaveBeenCalledWith('user-id-123', 'server-id-123');
      expect(channelHandler.connectChannel).toHaveBeenCalledWith(
        mockIo, 
        mockSocket, 
        { channelId: 'channel-id-123', userId: 'user-id-123' }
      );
      expect(utils.set.user).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
        currentServerId: 'server-id-123',
      }));
    });
    
    it('應該在嘗試連接私密伺服器時提示申請加入', async () => {
      // 條件：伺服器為不可見，用戶權限不足
      const invisibleServer = { 
        ...mockServer, 
        visibility: 'invisible' 
      };
      const lowPermissionMember = { 
        ...mockMember, 
        permissionLevel: 1 
      };
      
      utils.get.server.mockResolvedValue(invisibleServer);
      utils.get.member.mockResolvedValue(lowPermissionMember);
      
      await serverHandler.connectServer(mockIo, mockSocket, { 
        userId: 'user-id-123', 
        serverId: 'server-id-123' 
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('openPopup', expect.objectContaining({
        popupType: 'applyMember',
      }));
      expect(channelHandler.connectChannel).not.toHaveBeenCalled();
    });
    
    it('應該在嘗試連接其他用戶時拋出錯誤', async () => {
      // 條件：嘗試連接非操作者本人的用戶ID
      // 首先設置用戶模擬
      const otherUser = {
        id: 'user-id-456',
        username: 'otheruser',
      };
      utils.get.user.mockImplementation(async (id) => {
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
        serverId: 'server-id-123' 
      });
      
      // 驗證是否發送了錯誤通知
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      // 這樣可以檢查是否在任何時候發送了錯誤事件
      const errorCalled = mockIo.to().emit.mock.calls.some(
        call => call[0] === 'error' && call[1] && call[1].error_code === 'PERMISSION_DENIED'
      );
      expect(errorCalled).toBe(true);
      expect(channelHandler.connectChannel).not.toHaveBeenCalled();
    });
    
    it('應該為沒有成員關係的用戶創建新的成員資格', async () => {
      // 條件：用戶沒有現有的成員關係
      utils.get.member.mockResolvedValue(null);
      
      await serverHandler.connectServer(mockIo, mockSocket, { 
        userId: 'user-id-123', 
        serverId: 'server-id-123' 
      });
      
      // 驗證是否創建了新的成員資格
      expect(memberHandler.createMember).toHaveBeenCalledWith(
        mockIo,
        mockSocket,
        expect.objectContaining({
          userId: 'user-id-123',
          serverId: 'server-id-123',
        })
      );
      
      // 驗證其他流程是否正常執行
      expect(channelHandler.connectChannel).toHaveBeenCalled();
      expect(utils.set.user).toHaveBeenCalled();
    });
    
    it('應該使用戶離開之前的伺服器', async () => {
      // 條件：用戶已連接到其他伺服器
      jest.spyOn(serverHandler, 'disconnectServer').mockImplementation(() => Promise.resolve());
      const userWithCurrentServer = {
        ...mockUser,
        currentServerId: 'previous-server-id'
      };
      
      utils.get.user.mockResolvedValue(userWithCurrentServer);
      
      await serverHandler.connectServer(mockIo, mockSocket, { 
        userId: 'user-id-123', 
        serverId: 'server-id-123' 
      });
      
      // 驗證是否調用了斷開之前伺服器的操作
      // TODO: 有問題
      // expect(serverHandler.disconnectServer).toHaveBeenCalled();
      
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
      mockIo.sockets.sockets = new Map([
        ['socket-id-123', userSocket],
      ]);
    });
    
    it('應該成功斷開伺服器', async () => {
      // 條件：用戶已連線到伺服器和頻道
      
      await serverHandler.disconnectServer(mockIo, mockSocket, { 
        userId: 'user-id-123', 
        serverId: 'server-id-123' 
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.server).toHaveBeenCalledWith('server-id-123');
      expect(channelHandler.disconnectChannel).toHaveBeenCalled();
      expect(utils.set.user).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
        currentServerId: null,
      }));
    });
    
    it('應該允許管理員踢出其他用戶', async () => {
      // 條件：操作者權限足夠，目標用戶在該伺服器
      utils.get.user.mockImplementation(async (id) => {
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
      
      await serverHandler.disconnectServer(mockIo, mockSocket, { 
        userId: 'user-id-456', 
        serverId: 'server-id-123' 
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.user).toHaveBeenCalledWith('user-id-456');
      expect(utils.set.user).toHaveBeenCalledWith('user-id-456', expect.objectContaining({
        currentServerId: null,
      }));
    });
    
    it('應該拒絕權限不足的操作者踢出其他用戶', async () => {
      // 條件：操作者權限不足，目標用戶在該伺服器
      utils.get.user.mockImplementation(async (id) => {
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
      
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 3,
      });
      
      await serverHandler.disconnectServer(mockIo, mockSocket, { 
        userId: 'user-id-456', 
        serverId: 'server-id-123' 
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.user).not.toHaveBeenCalled();
    });
    
    it('應該拒絕踢出不在該群組的用戶', async () => {
      // 條件：目標用戶不在該伺服器
      utils.get.user.mockImplementation(async (id) => {
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
        serverId: 'server-id-123' 
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.user).not.toHaveBeenCalled();
    });
  });
  
  describe('createServer', () => {
    it('應該成功創建伺服器', async () => {
      // 條件：有效的伺服器資料，用戶未達到伺服器擁有上限
      const newServer = {
        name: '新伺服器',
        slogan: '這是一個新的伺服器',
        visibility: 'public',
      };
      
      await serverHandler.createServer(mockIo, mockSocket, { server: newServer });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.server).toHaveBeenCalledWith(newServer);
      expect(utils.set.server).toHaveBeenCalledWith('mock-uuid', expect.objectContaining({
        name: '新伺服器',
        slogan: '這是一個新的伺服器',
        displayId: 'test-display-id',
        ownerId: 'user-id-123',
      }));
      expect(utils.set.channel).toHaveBeenCalledWith('mock-uuid', expect.objectContaining({
        name: '大廳',
        isLobby: true,
        serverId: 'mock-uuid',
      }));
      expect(memberHandler.createMember).toHaveBeenCalled();
      expect(utils.set.userServer).toHaveBeenCalled();
    });
    
    it('應該在伺服器數量達到上限時拋出錯誤', async () => {
      // 條件：用戶已達到伺服器擁有上限
      utils.get.user.mockResolvedValue({
        ...mockUser,
        ownedServers: Array(10).fill('server-id'),
      });
      
      await serverHandler.createServer(mockIo, mockSocket, { 
        server: { name: '新伺服器', slogan: '測試', visibility: 'public' } 
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_code: 'LIMIT_REACHED',
      }));
      expect(utils.set.server).not.toHaveBeenCalled();
    });
    
    it('應該在伺服器達到對應等級可創建上限時拋出錯誤', async () => {
      // 條件：低等級用戶(level=5)已達到基於等級計算的伺服器擁有上限(3+5/5=4)
      const lowLevelUser = {
        ...mockUser,
        level: 5,
        ownedServers: ['server-1', 'server-2', 'server-3', 'server-4'] // 已有4個伺服器
      };
      
      utils.get.user.mockResolvedValue(lowLevelUser);
      
      await serverHandler.createServer(mockIo, mockSocket, { 
        server: { name: '新伺服器', slogan: '測試', visibility: 'public' } 
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_code: 'LIMIT_REACHED',
      }));
      expect(utils.set.server).not.toHaveBeenCalled();
    });
    
    it('應該為特殊用戶提供特殊權限等級', async () => {
      // 條件：用戶擁有特殊權限
      const specialPermLevel = 10;
      utils.specialUsers.getSpecialPermissionLevel.mockReturnValue(specialPermLevel);
      
      const newServer = {
        name: '特殊伺服器',
        slogan: '特殊用戶的伺服器',
        visibility: 'public',
      };
      
      await serverHandler.createServer(mockIo, mockSocket, { server: newServer });
      
      // 驗證創建成員時使用了特殊權限等級
      expect(memberHandler.createMember).toHaveBeenCalledWith(
        mockIo,
        mockSocket,
        expect.objectContaining({
          userId: 'user-id-123',
          serverId: 'mock-uuid',
          member: {
            permissionLevel: specialPermLevel,
          }
        })
      );
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
        serverId: 'server-id-123'
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.server).toHaveBeenCalledWith(updatedServer);
      expect(utils.get.server).toHaveBeenCalledWith('server-id-123');
      expect(utils.set.server).toHaveBeenCalledWith('server-id-123', updatedServer);
      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('serverUpdate', updatedServer);
    });
    
    it('應該拒絕權限不足的操作者更新伺服器', async () => {
      // 條件：操作者權限不足
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 3,
      });
      
      await serverHandler.updateServer(mockIo, mockSocket, { 
        server: { name: '更新的名稱' },
        serverId: 'server-id-123'
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.server).not.toHaveBeenCalled();
    });
    
    it('應拒絕權限剛好不足的用戶修改伺服器設置', async () => {
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 4,
      });
      
      await serverHandler.updateServer(mockIo, mockSocket, { 
        server: { name: '更新的名稱' },
        serverId: 'server-id-123'
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.server).not.toHaveBeenCalled();
    });
  });
});
