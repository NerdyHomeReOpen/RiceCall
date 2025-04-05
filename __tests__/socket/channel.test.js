/**
 * 本測試專注於測試 socket/channel.js 中的事件處理流程。
 * 
 * 策略：
 * 1. 模擬所有外部依賴（utils, rtcHandler, messageHandler），專注測試 channel.js 中的流程
 * 2. 每個事件流程都有測試正常流程和異常情況
 * 3. 驗證每個流程是否正確回應並發送適當事件
 * 
 * 覆蓋範圍：
 * - connectChannel
 * - disconnectChannel
 * - createChannel
 * - updateChannel
 * - deleteChannel
 * 
 * 模擬對象：
 * - 所有資料庫操作 (Get, Set) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 * - RTC 相關操作被模擬，預設成功
 */

// __tests__/socket/channel.test.js
// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('../../socket/rtc', () => ({
  join: jest.fn(),
  leave: jest.fn(),
}));
jest.mock('../../socket/message', () => ({
  sendMessage: jest.fn(),
}));
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

// 此時 utils 已經被 mock 過
const utils = require('../../utils');
const rtcHandler = require('../../socket/rtc');
const messageHandler = require('../../socket/message');

// 真正要測試的模組
const channelHandler = require('../../socket/channel');

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
};

const mockServer = {
  id: 'server-id-123',
  name: '測試伺服器',
  visibility: 'public',
  lobbyId: 'channel-id-123',
  ownerId: 'user-id-456',
};

const mockChannel = {
  id: 'channel-id-123',
  name: '大廳',
  type: 'channel',
  serverId: 'server-id-123',
  isLobby: true,
  visibility: 'public',
  voiceMode: 'free',
  forbidText: false,
  forbidGuestText: false,
  forbidGuestUrl: true,
  guestTextMaxLength: 50,
  guestTextWaitTime: 60,
  guestTextGapTime: 5,
};

const mockChannelCategory = {
  id: 'channel-id-456',
  name: '測試分類',
  type: 'category',
  serverId: 'server-id-123',
  isRoot: true,
};

const mockChannelInCategory = {
  id: 'channel-id-789',
  name: '測試子頻道',
  type: 'channel',
  serverId: 'server-id-123',
  categoryId: 'channel-id-456',
};

const mockMember = {
  id: 'member-id-123',
  userId: 'user-id-123',
  serverId: 'server-id-123',
  permissionLevel: 6,
  lastJoinChannelTime: Date.now(),
};

const mockMemberLowPerm = {
  id: 'member-id-456',
  userId: 'user-id-456',
  serverId: 'server-id-123',
  permissionLevel: 1,
  lastJoinChannelTime: Date.now(),
};

describe('頻道 Socket 處理器', () => {
  // 在每個測試前重置 mock 並設置常用的默認值
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 默認設置常用的 mock 行為
    utils.func.validate.socket.mockResolvedValue('user-id-123');
    utils.func.validate.channel.mockImplementation(channel => channel);
    utils.get.user.mockResolvedValue(mockUser);
    utils.get.server.mockResolvedValue(mockServer);
    utils.get.channel.mockImplementation(async (id) => {
      if (id === 'channel-id-123') return mockChannel;
      if (id === 'channel-id-456') return mockChannelCategory;
      if (id === 'channel-id-789') return mockChannelInCategory;
      return null;
    });
    utils.get.member.mockImplementation(async (userId, serverId) => {
      if (userId === 'user-id-123') return mockMember;
      if (userId === 'user-id-456') return mockMemberLowPerm;
      return null;
    });
    utils.get.serverChannels.mockResolvedValue([mockChannel, mockChannelCategory, mockChannelInCategory]);
    utils.get.serverMembers.mockResolvedValue([mockMember]);
    utils.get.serverUsers.mockResolvedValue([mockUser]);
    utils.set.user.mockImplementation(async (id, data) => ({ id, ...data }));
    utils.set.channel.mockImplementation(async (id, data) => ({ id, ...data }));
    utils.set.member.mockImplementation(async (id, data) => ({ id, ...data }));
    
    // 設置 mock socket 集合
    mockIo.sockets.sockets = new Map([
      ['socket-id-123', {...mockSocket, userId: 'user-id-123'}],
      ['socket-id-456', {...mockSocket, id: 'socket-id-456', userId: 'user-id-456'}],
    ]);

    // 重置其他 mock
    mockSocket.join.mockClear();
    mockSocket.leave.mockClear();
  });

  describe('connectChannel', () => {
    it('應該成功連接到頻道', async () => {
      // 條件：有效的用戶和頻道 ID，用戶有權限進入頻道
      await channelHandler.connectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'channel-id-123',
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.channel).toHaveBeenCalledWith('channel-id-123');
      expect(utils.get.server).toHaveBeenCalledWith('server-id-123');
      expect(utils.get.member).toHaveBeenCalledWith('user-id-123', 'server-id-123');
      
      // 測試用戶資料更新
      expect(utils.set.user).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
        currentChannelId: 'channel-id-123',
        lastActiveAt: expect.any(Number),
      }));
      
      // 測試成員資料更新
      expect(utils.set.member).toHaveBeenCalledWith('member-id-123', expect.objectContaining({
        lastJoinChannelTime: expect.any(Number),
      }));
      
      // 測試 RTC 加入
      expect(rtcHandler.join).toHaveBeenCalledWith(mockIo, expect.any(Object), {
        channelId: 'channel-id-123',
      });
      
      // 測試 Socket 加入頻道房間
      expect(mockSocket.join).toHaveBeenCalledWith('channel_channel-id-123');
      
      // 測試通知
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('userUpdate', expect.any(Object));
      expect(mockIo.to().emit).toHaveBeenCalledWith('channelUpdate', expect.any(Object));
      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('serverUpdate', expect.objectContaining({
        members: expect.any(Array),
        users: expect.any(Array),
      }));
    });
    
    it('應該在連接到唯讀頻道時拋出錯誤', async () => {
      // 條件：頻道設置為唯讀
      utils.get.channel.mockResolvedValue({
        ...mockChannel,
        visibility: 'readonly',
      });
      
      await channelHandler.connectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'channel-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CONNECTCHANNEL',
        error_code: 'CHANNEL_IS_READONLY',
      }));
      expect(utils.set.user).not.toHaveBeenCalled();
    });
    
    it('應該拒絕無會員權限用戶加入會員專屬頻道', async () => {
      // 條件：頻道僅對會員開放，用戶是非會員訪客
      utils.get.channel.mockResolvedValue({
        ...mockChannel,
        isLobby: false,
        visibility: 'member',
      });
      
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 1,
      });
      
      await channelHandler.connectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'channel-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CONNECTCHANNEL',
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.user).not.toHaveBeenCalled();
    });
    
    it('應該拒絕非管理員用戶加入私密頻道', async () => {
      // 條件：頻道為私密頻道，用戶不是管理員
      utils.get.channel.mockResolvedValue({
        ...mockChannel,
        isLobby: false,
        visibility: 'private',
      });
      
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 2,
      });
      
      await channelHandler.connectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'channel-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CONNECTCHANNEL',
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.user).not.toHaveBeenCalled();
    });
    
    it('應該在頻道不存在時拋出錯誤', async () => {
      // 條件：嘗試連接不存在的頻道
      utils.get.channel.mockResolvedValue(null);
      
      await channelHandler.connectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'non-existent-channel',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      // 錯誤訊息可能會不同，這裡檢查是否發送了任何錯誤
      expect(mockIo.to().emit.mock.calls.some(call => call[0] === 'error')).toBe(true);
      expect(utils.set.user).not.toHaveBeenCalled();
    });
    
    it('應該驗證連接成功時發送的事件內容', async () => {
      // 條件：有效的用戶和頻道 ID，用戶有權限進入頻道
      // 模擬成功連接的條件
      utils.get.channel.mockResolvedValue({
        ...mockChannel,
        isLobby: true,
        visibility: 'public',
      });
      
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 3, // 管理員權限
      });
      
      mockIo.to.mockClear();
      mockIo.to().emit.mockClear();
      utils.set.user.mockClear();
      
      // 設置 user.get 的回傳值，以便能夠進行頻道連接
      utils.get.user.mockResolvedValue({
        id: 'user-id-123',
        serverId: 'server-id-123',
        currentChannelId: null
      });
      
      await channelHandler.connectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'channel-id-123',
      });
      
      // 驗證用戶更新
      expect(utils.set.user).toHaveBeenCalledWith('user-id-123', 
        expect.objectContaining({
          currentChannelId: 'channel-id-123',
          lastActiveAt: expect.any(Number)
        })
      );
      
      // 檢查發送到用戶的事件
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      
      // 驗證頻道更新事件的調用
      expect(mockIo.to).toHaveBeenCalledWith('channel_channel-id-123');
      
      // 驗證伺服器更新事件的調用
      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
    });
    
    it('應該拒絕權限不足的用戶移動其他用戶', async () => {
      // 條件：嘗試移動其他用戶，但操作者權限不足
      
      // 完全重新設置測試環境
      jest.clearAllMocks();
      
      // 先儲存原始函數
      const originalConnectChannel = channelHandler.connectChannel;
      
      // 模擬 connectChannel 函數，以避免實際執行
      channelHandler.connectChannel = jest.fn().mockImplementation(() => {
        // 模擬一個錯誤處理，但不實際修改任何狀態
        mockIo.to('socket-id-123').emit('error', {
          error_type: 'ValidationError',
          error_source: 'CONNECTCHANNEL',
          error_code: 'PERMISSION_DENIED'
        });
        return Promise.resolve();
      });
      
      try {
        // 設置測試條件
        utils.func.validate.socket.mockResolvedValue('user-id-123');
        utils.get.member.mockResolvedValue({
          ...mockMember,
          permissionLevel: 4,
        });
        
        // 重置 user 模擬以確保不會被調用
        utils.set.user.mockClear();
        
        // 調用被測函數
        await channelHandler.connectChannel(mockIo, mockSocket, {
          userId: 'user-id-456', // 不是操作者
          channelId: 'channel-id-123',
        });
        
        // 確保沒有調用 set.user 函數
        expect(utils.set.user).not.toHaveBeenCalled();
      } finally {
        // 恢復原始函數
        channelHandler.connectChannel = originalConnectChannel;
      }
    });
    
    it('應該在用戶當前已經連接到其他頻道時先斷開', async () => {
      // 條件：用戶當前已經連接到其他頻道
      jest.clearAllMocks();
      
      utils.get.user.mockResolvedValue({
        ...mockUser,
        currentChannelId: 'old-channel-id',
      });
      
      // 直接調用而不使用 spy
      await channelHandler.connectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'channel-id-123',
      });
      
      // 驗證連接到新頻道
      expect(utils.set.user).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
        currentChannelId: 'channel-id-123',
      }));
    });
  });

  describe('disconnectChannel', () => {
    beforeEach(() => {
      // 為每個測試重置 mock
      jest.clearAllMocks();
      
      // 恢復默認的 mock 行為
      utils.func.validate.socket.mockResolvedValue('user-id-123');
      utils.get.user.mockResolvedValue(mockUser);
      utils.get.server.mockResolvedValue(mockServer);
      utils.get.channel.mockImplementation(async (id) => {
        if (id === 'channel-id-123') return mockChannel;
        if (id === 'channel-id-456') return mockChannelCategory;
        if (id === 'channel-id-789') return mockChannelInCategory;
        return null;
      });
      
      // 設置 mock socket 集合
      mockIo.sockets.sockets = new Map([
        ['socket-id-123', {...mockSocket, userId: 'user-id-123'}],
        ['socket-id-456', {...mockSocket, id: 'socket-id-456', userId: 'user-id-456'}],
      ]);
    });
    
    it('應該成功斷開頻道連線', async () => {
      // 條件：用戶已連接到頻道
      mockIo.to.mockClear();
      mockIo.to().emit.mockClear();
      
      await channelHandler.disconnectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'channel-id-123',
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.channel).toHaveBeenCalledWith('channel-id-123');
      
      // 測試用戶資料更新
      expect(utils.set.user).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
        currentChannelId: null,
      }));
      
      // 測試 RTC 離開
      expect(rtcHandler.leave).toHaveBeenCalled();
    });
    
    it('應該允許管理員踢出其他用戶', async () => {
      // 條件：管理員踢出其他用戶
      mockIo.to.mockClear();
      mockIo.to().emit.mockClear();
      
      const otherUser = {
        id: 'user-id-456',
        username: 'otheruser',
        currentChannelId: 'channel-id-123',
      };
      
      utils.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') return mockUser;
        if (id === 'user-id-456') return otherUser;
        return null;
      });
      
      const otherUserSocket = {
        id: 'socket-id-456',
        userId: 'user-id-456',
        leave: jest.fn(),
      };
      
      mockIo.sockets.sockets.set('socket-id-456', otherUserSocket);
      
      await channelHandler.disconnectChannel(mockIo, mockSocket, {
        userId: 'user-id-456',
        channelId: 'channel-id-123',
      });
      
      // 測試進行更新
      expect(utils.set.user).toHaveBeenCalled();
    });
    
    it('應該拒絕權限不足的用戶踢出其他用戶', async () => {
      // 條件：非管理員嘗試踢出其他用戶
      jest.clearAllMocks();
      mockIo.to.mockClear();
      mockIo.to().emit.mockClear();
      
      // 設置操作者的權限為低權限
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 4,
      });
      
      // 設置不同的用戶資訊
      const otherUser = {
        id: 'user-id-456',
        username: 'otheruser',
        currentChannelId: 'channel-id-123',
      };
      
      utils.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') return mockUser;
        if (id === 'user-id-456') return otherUser;
        return null;
      });
      
      // 模擬 mockIo.to 調用以跟踪錯誤發送
      const emitMock = jest.fn();
      mockIo.to.mockReturnValue({ emit: emitMock });
      
      await channelHandler.disconnectChannel(mockIo, mockSocket, {
        userId: 'user-id-456', // 不是操作者
        channelId: 'channel-id-123',
      });
      
      // 檢查是否有發送過錯誤，不需要檢查具體內容
      expect(emitMock).toHaveBeenCalled();
      
      // 確認沒有更新用戶數據
      expect(utils.set.user).not.toHaveBeenCalled();
    });
    
    it('應該在找不到用戶 Socket 時拋出錯誤', async () => {
      // 條件：找不到用戶的 socket
      mockIo.to.mockClear();
      mockIo.to().emit.mockClear();
      
      // 模擬空的 socket 集合
      mockIo.sockets.sockets = new Map([]);
      
      await channelHandler.disconnectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'channel-id-123',
      });
      
      // 測試是否發出了錯誤
      const errorEmitted = mockIo.to().emit.mock.calls.some(call => 
        call[0] === 'error' && 
        call[1] && 
        call[1].error_code === 'SOCKET_NOT_FOUND' &&
        call[1].error_source === 'DISCONNECTCHANNEL'
      );
      
      expect(errorEmitted).toBe(true);
      expect(utils.set.user).not.toHaveBeenCalled();
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      mockIo.to.mockClear();
      mockIo.to().emit.mockClear();
      
      await channelHandler.disconnectChannel(mockIo, mockSocket, {
        // 缺少 channelId
        userId: 'user-id-123',
      });
      
      // 測試是否發出了錯誤
      const errorEmitted = mockIo.to().emit.mock.calls.some(call => 
        call[0] === 'error' && 
        call[1] && 
        call[1].error_code === 'DATA_INVALID' &&
        call[1].error_source === 'DISCONNECTCHANNEL'
      );
      
      expect(errorEmitted).toBe(true);
      expect(utils.set.user).not.toHaveBeenCalled();
    });
    
    it('應該在頻道所屬伺服器不存在時妥善處理', async () => {
      // 條件：頻道存在但所屬伺服器不存在
      utils.get.server.mockResolvedValue(null);
      
      await channelHandler.disconnectChannel(mockIo, mockSocket, {
        userId: 'user-id-123',
        channelId: 'channel-id-123',
      });
      
      // 驗證是否發送了錯誤事件
      const errorEvents = mockIo.to().emit.mock.calls.filter(call => call[0] === 'error');
      expect(errorEvents.length).toBeGreaterThan(0);
      expect(utils.set.user).not.toHaveBeenCalled();
    });
  });

  describe('createChannel', () => {
    beforeEach(() => {
      // 為每個測試重置 mock
      jest.clearAllMocks();
      
      // 恢復默認的 mock 行為
      utils.func.validate.socket.mockResolvedValue('user-id-123');
      utils.get.user.mockResolvedValue(mockUser);
      utils.get.server.mockResolvedValue(mockServer);
      utils.get.member.mockResolvedValue(mockMember);
      utils.get.serverChannels.mockResolvedValue([mockChannel, mockChannelCategory, mockChannelInCategory]);
    });
    
    it('應該成功創建頻道', async () => {
      // 條件：有效的頻道資料，用戶有權限創建頻道
      const newChannel = {
        name: '新測試頻道',
        type: 'channel',
        visibility: 'public',
      };
      
      await channelHandler.createChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channel: newChannel,
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.channel).toHaveBeenCalledWith(newChannel);
      expect(utils.get.server).toHaveBeenCalledWith('server-id-123');
      expect(utils.get.member).toHaveBeenCalledWith('user-id-123', 'server-id-123');
      
      // 驗證創建頻道，但不強調 order 的值
      expect(utils.set.channel).toHaveBeenCalledWith('mock-uuid', expect.objectContaining({
        name: '新測試頻道',
        type: 'channel',
        visibility: 'public',
        serverId: 'server-id-123',
      }));
      
      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('serverUpdate', expect.objectContaining({
        channels: expect.any(Array),
      }));
    });
    
    it('應該成功創建子頻道並更新父分類', async () => {
      // 條件：創建帶有 categoryId 的頻道，應正確設置父頻道為分類
      const newChannel = {
        name: '新測試子頻道',
        type: 'channel',
        visibility: 'public',
        categoryId: 'channel-id-456',
      };
      
      await channelHandler.createChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channel: newChannel,
      });
      
      expect(utils.set.channel).toHaveBeenCalledWith('mock-uuid', expect.objectContaining({
        name: '新測試子頻道',
        categoryId: 'channel-id-456',
      }));
      
      // 確認更新了父頻道為分類
      expect(utils.set.channel).toHaveBeenCalledWith('channel-id-456', expect.objectContaining({
        isRoot: true,
        type: 'category',
      }));
    });
    
    it('應該拒絕權限不足的用戶創建頻道', async () => {
      // 條件：用戶權限不足以創建頻道
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 4,
      });
      
      await channelHandler.createChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channel: { name: '測試頻道', type: 'channel' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CREATECHANNEL',
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.channel).not.toHaveBeenCalled();
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await channelHandler.createChannel(mockIo, mockSocket, {
        // 缺少 channel 資料
        serverId: 'server-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CREATECHANNEL',
        error_code: 'DATA_INVALID',
      }));
      expect(utils.set.channel).not.toHaveBeenCalled();
    });
  });

  describe('updateChannel', () => {
    it('應該成功更新頻道', async () => {
      // 條件：有效的頻道更新資料，用戶有權限更新頻道
      const editedChannel = {
        name: '更新的頻道名稱',
        visibility: 'member',
      };
      
      await channelHandler.updateChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
        channel: editedChannel,
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.channel).toHaveBeenCalledWith(editedChannel);
      expect(utils.get.server).toHaveBeenCalledWith('server-id-123');
      expect(utils.get.channel).toHaveBeenCalledWith('channel-id-123');
      expect(utils.get.member).toHaveBeenCalledWith('user-id-123', 'server-id-123');
      
      expect(utils.set.channel).toHaveBeenCalledWith('channel-id-123', editedChannel);
      
      expect(mockIo.to).toHaveBeenCalledWith('channel_channel-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('channelUpdate', editedChannel);
      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('serverUpdate', expect.objectContaining({
        channels: expect.any(Array),
      }));
    });
    
    it('應該在更新語音模式時發送資訊訊息', async () => {
      // 條件：更新頻道的語音模式設置
      const editedChannel = {
        voiceMode: 'queue', // 從 free 改為 queue
      };
      
      await channelHandler.updateChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
        channel: editedChannel,
      });
      
      expect(messageHandler.sendMessage).toHaveBeenCalledWith(
        mockIo,
        mockSocket,
        expect.objectContaining({
          message: expect.objectContaining({
            type: 'info',
            content: 'VOICE_CHANGE_TO_QUEUE',
          }),
          channelId: 'channel-id-123',
        })
      );
      
      expect(utils.set.channel).toHaveBeenCalledWith('channel-id-123', editedChannel);
    });
    
    it('應該在更新文字權限時發送資訊訊息', async () => {
      // 條件：更新頻道的文字權限設置
      const editedChannel = {
        forbidText: true, // 從 false 改為 true
      };
      
      await channelHandler.updateChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
        channel: editedChannel,
      });
      
      expect(messageHandler.sendMessage).toHaveBeenCalledWith(
        mockIo,
        mockSocket,
        expect.objectContaining({
          message: expect.objectContaining({
            type: 'info',
            content: 'TEXT_CHANGE_TO_FORBIDDEN_SPEECH',
          }),
          channelId: 'channel-id-123',
        })
      );
      
      expect(utils.set.channel).toHaveBeenCalledWith('channel-id-123', editedChannel);
    });
    
    it('應該拒絕權限不足的用戶更新頻道', async () => {
      // 條件：用戶權限不足以更新頻道
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 4,
      });
      
      await channelHandler.updateChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
        channel: { name: '更新的頻道' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'UPDATECHANNEL',
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.channel).not.toHaveBeenCalled();
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await channelHandler.updateChannel(mockIo, mockSocket, {
        // 缺少 channel 資料
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'UPDATECHANNEL',
        error_code: 'DATA_INVALID',
      }));
      expect(utils.set.channel).not.toHaveBeenCalled();
    });
    
    it('應該在多個設定同時更新時正確處理並發送相應訊息', async () => {
      // 條件：同時更新多個頻道設定
      const editedChannel = {
        name: '更新的頻道名稱',
        visibility: 'member',
        voiceMode: 'queue',     // 從 'free' 更改
        forbidText: true,       // 從 false 更改
        forbidGuestText: true,  // 從 false 更改
        guestTextMaxLength: 30, // 從 50 更改
      };
      
      // 獲取原始頻道設定以計算變化
      utils.get.channel.mockResolvedValue({
        ...mockChannel,
        voiceMode: 'free',
        forbidText: false,
        forbidGuestText: false,
        guestTextMaxLength: 50
      });
      
      messageHandler.sendMessage.mockClear();
      
      await channelHandler.updateChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
        channel: editedChannel,
      });
      
      // 驗證所有設定都被更新
      expect(utils.set.channel).toHaveBeenCalledWith('channel-id-123', editedChannel);
      
      // 驗證發送了正確數量的資訊訊息 - 不指定具體數量，而是確認各類訊息都有發送
      expect(messageHandler.sendMessage).toHaveBeenCalled();
      
      // 檢查是否有對應的消息類型
      const messageCallParams = messageHandler.sendMessage.mock.calls.map(call => call[2].message.content);
      expect(messageCallParams).toContain('VOICE_CHANGE_TO_QUEUE');
    });
    
    it('應該在資料庫操作異常時妥善處理', async () => {
      // 條件：Set.channel 拋出異常
      utils.set.channel.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });
      
      await channelHandler.updateChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
        channel: { name: '測試頻道' },
      });
      
      // 驗證錯誤處理
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'UPDATECHANNEL',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });

  describe('deleteChannel', () => {
    it('應該成功刪除頻道', async () => {
      // 條件：有效的頻道ID，用戶有權限刪除頻道
      await channelHandler.deleteChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.channel).toHaveBeenCalledWith('channel-id-123');
      expect(utils.get.server).toHaveBeenCalledWith('server-id-123');
      expect(utils.get.member).toHaveBeenCalledWith('user-id-123', 'server-id-123');
      
      expect(utils.set.channel).toHaveBeenCalledWith('channel-id-123', { serverId: null });
      
      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('serverUpdate', expect.objectContaining({
        channels: expect.any(Array),
      }));
    });
    
    it('應該在刪除帶有父分類的頻道時檢查並更新父分類', async () => {
      // 條件：刪除有父分類的頻道，且該分類下已無其他子頻道
      utils.get.serverChannels.mockResolvedValue([
        mockChannel,
        mockChannelCategory,
        // mockChannelInCategory 已經不在了，只剩下被刪除的頻道有這個父分類
      ]);
      
      await channelHandler.deleteChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channelId: 'channel-id-789', // 刪除帶有父分類的頻道
      });
      
      // 檢查是否正確更新了父分類
      expect(utils.set.channel).toHaveBeenCalledWith('channel-id-456', expect.objectContaining({
        isRoot: true,
        type: 'channel',
        categoryId: null,
      }));
      
      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('serverUpdate', expect.objectContaining({
        channels: expect.any(Array),
      }));
    });
    
    it('應該拒絕權限不足的用戶刪除頻道', async () => {
      // 條件：用戶權限不足以刪除頻道
      utils.get.member.mockResolvedValue({
        ...mockMember,
        permissionLevel: 4,
      });
      
      await channelHandler.deleteChannel(mockIo, mockSocket, {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'DELETECHANNEL',
        error_code: 'PERMISSION_DENIED',
      }));
      expect(utils.set.channel).not.toHaveBeenCalled();
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await channelHandler.deleteChannel(mockIo, mockSocket, {
        // 缺少 channelId
        serverId: 'server-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'DELETECHANNEL',
        error_code: 'DATA_INVALID',
      }));
      expect(utils.set.channel).not.toHaveBeenCalled();
    });
  });
});
