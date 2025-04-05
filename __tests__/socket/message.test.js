/**
 * 本測試專注於測試 socket/message.js 中的事件處理流程。
 * 
 * 策略：
 * 1. 模擬所有外部依賴（utils, uuid），專注測試 message.js 中的流程
 * 2. 每個事件流程都有測試正常流程和異常情況
 * 3. 驗證每個流程是否正確回應並發送適當事件
 * 
 * 覆蓋範圍：
 * - sendMessage
 * - sendDirectMessage
 * 
 * 模擬對象：
 * - 所有資料庫操作 (Get, Set) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 */

// __tests__/socket/message.test.js
// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123')
}));

// 此時 utils 已經被 mock 過
const utils = require('../../utils');

// 真正要測試的模組
const messageHandler = require('../../socket/message');

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
  name: 'Test User',
};

const mockTargetUser = {
  id: 'target-id-123',
  name: 'Target User',
};

const mockServer = {
  id: 'server-id-123',
  name: 'Test Server',
};

const mockChannel = {
  id: 'channel-id-123',
  name: 'Test Channel',
  forbidGuestUrl: false,
};

const mockMember = {
  id: 'member-id-123',
  permissionLevel: 2,
};

const mockMessage = {
  content: 'Test message',
  type: 'text',
};

describe('訊息 Socket 處理器', () => {
  // 在每個測試前重置 mock 並設置常用的默認值
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 默認設置常用的 mock 行為
    utils.func.validate.socket.mockResolvedValue('user-id-123');
    utils.func.validate.message.mockResolvedValue(mockMessage);
    utils.get.user.mockImplementation(async (id) => {
      if (id === 'user-id-123') return mockUser;
      if (id === 'target-id-123') return mockTargetUser;
      return null;
    });
    utils.get.server.mockResolvedValue(mockServer);
    utils.get.channel.mockResolvedValue(mockChannel);
    utils.get.member.mockResolvedValue(mockMember);
    utils.get.channelMessages.mockResolvedValue(['message1']);
    utils.get.channelInfoMessages.mockResolvedValue(['infoMessage1']);
    utils.get.directMessages.mockResolvedValue(['directMessage1']);
    
    // 設置 socket 集合
    mockIo.sockets.sockets.clear();
    mockIo.sockets.sockets.set('socket-id-123', mockSocket);
    mockIo.sockets.sockets.set('target-socket-id', {
      id: 'target-socket-id',
      userId: 'target-id-123',
    });
  });

  describe('sendMessage', () => {
    const mockData = {
      userId: 'user-id-123',
      serverId: 'server-id-123',
      channelId: 'channel-id-123',
      message: mockMessage,
    };
    
    it('應成功發送訊息並更新頻道', async () => {
      // 條件：有效的訊息資料，用戶有權限發送訊息，頻道允許發送訊息
      await messageHandler.sendMessage(mockIo, mockSocket, mockData);
      
      // 驗證結果
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.message).toHaveBeenCalledWith(mockMessage);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.server).toHaveBeenCalledWith('server-id-123');
      expect(utils.get.channel).toHaveBeenCalledWith('channel-id-123');
      expect(utils.get.member).toHaveBeenCalledWith('user-id-123', 'server-id-123');
      
      expect(utils.set.message).toHaveBeenCalledWith('mock-uuid-123', expect.objectContaining({
        ...mockMessage,
        senderId: 'user-id-123',
        receiverId: 'server-id-123',
        channelId: 'channel-id-123',
        timestamp: expect.any(Number),
      }));
      
      expect(utils.set.member).toHaveBeenCalledWith('member-id-123', expect.objectContaining({
        lastMessageTime: expect.any(Number),
      }));
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to).toHaveBeenCalledWith('channel_channel-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('memberUpdate', expect.any(Object));
      expect(mockIo.to().emit).toHaveBeenCalledWith('channelUpdate', {
        messages: ['message1', 'infoMessage1'],
      });
    });

    it('應在缺少必要資料時拋出錯誤', async () => {
      // 條件：缺少必要的訊息資料（message 和 userId）
      const invalidData = {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
      };
      
      await messageHandler.sendMessage(mockIo, mockSocket, invalidData);
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'SENDMESSAGE',
        error_code: 'DATA_INVALID',
      }));
    });

    it('應拒絕發送非自己的訊息', async () => {
      // 條件：嘗試發送非操作者本人的訊息
      const dataWithDifferentUser = {
        ...mockData,
        userId: 'different-user-id',
      };
      
      utils.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') return mockUser;
        if (id === 'different-user-id') return { id: 'different-user-id', name: 'Different User' };
        return null;
      });
      
      await messageHandler.sendMessage(mockIo, mockSocket, dataWithDifferentUser);
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'SENDMESSAGE',
        error_code: 'PERMISSION_DENIED',
      }));
    });

    it('應替換遊客發送的URL', async () => {
      // 條件：遊客（權限等級1）在禁止URL的頻道中發送包含URL的訊息
      const guestMember = {
        ...mockMember,
        permissionLevel: 1,
      };
      const messageWithUrl = {
        content: 'Check this link https://example.com',
        type: 'text',
      };
      const dataWithUrl = {
        ...mockData,
        message: messageWithUrl,
      };
      
      utils.func.validate.message.mockResolvedValue(messageWithUrl);
      utils.get.channel.mockResolvedValue({
        ...mockChannel,
        forbidGuestUrl: true,
      });
      utils.get.member.mockResolvedValue(guestMember);
      
      await messageHandler.sendMessage(mockIo, mockSocket, dataWithUrl);
      
      expect(utils.set.message).toHaveBeenCalledWith('mock-uuid-123', expect.objectContaining({
        content: 'Check this link {{GUEST_SEND_AN_EXTERNAL_LINK}}',
        type: 'text',
      }));
    });

    it('應處理意外錯誤', async () => {
      // 條件：socket 驗證過程中發生意外錯誤
      utils.func.validate.socket.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      await messageHandler.sendMessage(mockIo, mockSocket, mockData);
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'SENDMESSAGE',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });

  describe('sendDirectMessage', () => {
    const mockDirectMessageData = {
      userId: 'user-id-123',
      targetId: 'target-id-123',
      directMessage: {
        content: 'Direct message test',
        type: 'text',
      },
    };
    
    it('應成功發送私人訊息', async () => {
      // 條件：有效的私人訊息資料，目標用戶在線，雙方都有權限接收訊息
      // 重要：為這個特定測試設置正確的 directMessage
      utils.func.validate.message.mockResolvedValue(mockDirectMessageData.directMessage);
      
      await messageHandler.sendDirectMessage(mockIo, mockSocket, mockDirectMessageData);
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.message).toHaveBeenCalledWith(mockDirectMessageData.directMessage);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.user).toHaveBeenCalledWith('target-id-123');
      
      expect(utils.set.directMessage).toHaveBeenCalledWith('mock-uuid-123', expect.objectContaining({
        content: 'Direct message test',
        type: 'text',
        userId: 'user-id-123',
        targetId: 'target-id-123',
        timestamp: expect.any(Number),
      }));
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to).toHaveBeenCalledWith('target-socket-id');
      expect(mockIo.to().emit).toHaveBeenCalledWith('directMessage', ['directMessage1']);
    });
    
    it('應在缺少必要資料時拋出錯誤', async () => {
      // 條件：缺少必要的私人訊息資料（targetId 和 directMessage）
      const invalidData = {
        userId: 'user-id-123',
      };
      
      await messageHandler.sendDirectMessage(mockIo, mockSocket, invalidData);
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'SENDDIRECTMESSAGE',
        error_code: 'DATA_INVALID',
      }));
    });
    
    it('應拒絕發送非自己的私人訊息', async () => {
      // 條件：嘗試發送非操作者本人的私人訊息
      const dataWithDifferentUser = {
        ...mockDirectMessageData,
        userId: 'different-user-id',
      };
      
      utils.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') return mockUser;
        if (id === 'different-user-id') return { id: 'different-user-id', name: 'Different User' };
        if (id === 'target-id-123') return mockTargetUser;
        return null;
      });
      
      await messageHandler.sendDirectMessage(mockIo, mockSocket, dataWithDifferentUser);
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'SENDDIRECTMESSAGE',
        error_code: 'PERMISSION_DENIED',
      }));
    });
    
    it('應處理意外錯誤', async () => {
      // 條件：socket 驗證過程中發生意外錯誤
      utils.func.validate.socket.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      await messageHandler.sendDirectMessage(mockIo, mockSocket, mockDirectMessageData);
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'SENDDIRECTMESSAGE',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });
});
