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
 * - 所有資料庫操作 (DB.get, DB.set) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 */

// __tests__/socket/message.test.js
// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils, mockDB } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('../../db', () => mockDB);
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123'),
}));

// 此時 utils 和 DB 已經被 mock 過
const utils = require('../../utils');
const DB = require('../../db');

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
    sockets: new Map([['socket-id-123', mockSocket]]),
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
    utils.Func.validate.socket.mockResolvedValue('user-id-123');
    utils.Func.validate.message.mockResolvedValue(mockMessage);
    DB.get.user.mockImplementation(async (id) => {
      if (id === 'user-id-123') return mockUser;
      if (id === 'target-id-123') return mockTargetUser;
      return null;
    });
    DB.get.server.mockResolvedValue(mockServer);
    DB.get.channel.mockResolvedValue(mockChannel);
    DB.get.member.mockResolvedValue(mockMember);
    DB.get.channelMessages.mockResolvedValue(['message1']);
    DB.get.channelInfoMessages.mockResolvedValue(['infoMessage1']);
    DB.get.directMessages.mockResolvedValue(['directMessage1']);

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
      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.Func.validate.message).toHaveBeenCalledWith(mockMessage);

      // 驗證服務端查詢
      expect(DB.get.channel).toHaveBeenCalledWith('channel-id-123');
      expect(DB.get.member).toHaveBeenCalledWith(
        'user-id-123',
        'server-id-123',
      );
      expect(DB.get.user).toHaveBeenCalledWith('user-id-123');

      // 驗證服務端更新
      expect(DB.set.member).toHaveBeenCalledWith(
        'user-id-123',
        'server-id-123',
        expect.objectContaining({
          lastMessageTime: expect.any(Number),
        }),
      );

      // 驗證事件發送
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to).toHaveBeenCalledWith('channel_channel-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'memberUpdate',
        expect.any(Object),
      );
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'playSound',
        'recieveChannelMessage',
      );
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'onMessage',
        expect.any(Object),
      );
    });

    it('應在缺少必要資料時拋出錯誤', async () => {
      // 條件：缺少必要的訊息資料（message 和 userId）
      const invalidData = {
        serverId: 'server-id-123',
        channelId: 'channel-id-123',
      };

      await messageHandler.sendMessage(mockIo, mockSocket, invalidData);

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應拒絕發送非自己的訊息', async () => {
      // 條件：嘗試發送非操作者本人的訊息
      const dataWithDifferentUser = {
        ...mockData,
        userId: 'different-user-id',
      };

      DB.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') return mockUser;
        if (id === 'different-user-id')
          return { id: 'different-user-id', name: 'Different User' };
        return null;
      });

      await messageHandler.sendMessage(
        mockIo,
        mockSocket,
        dataWithDifferentUser,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
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

      utils.Func.validate.message.mockResolvedValue(messageWithUrl);
      DB.get.channel.mockResolvedValue({
        ...mockChannel,
        forbidGuestUrl: true,
      });
      DB.get.member.mockResolvedValue(guestMember);

      await messageHandler.sendMessage(mockIo, mockSocket, dataWithUrl);

      expect(mockIo.to).toHaveBeenCalledWith('channel_channel-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'onMessage',
        expect.objectContaining({
          content: 'Check this link {{GUEST_SEND_AN_EXTERNAL_LINK}}',
          type: 'text',
        }),
      );
    });

    it('應處理意外錯誤', async () => {
      // 條件：socket 驗證過程中發生意外錯誤
      utils.Func.validate.socket.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await messageHandler.sendMessage(mockIo, mockSocket, mockData);

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
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
      utils.Func.validate.message.mockResolvedValue(
        mockDirectMessageData.directMessage,
      );

      await messageHandler.sendDirectMessage(
        mockIo,
        mockSocket,
        mockDirectMessageData,
      );

      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.Func.validate.message).toHaveBeenCalledWith(
        mockDirectMessageData.directMessage,
      );

      // 驗證事件發送
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'onDirectMessage',
        expect.any(Object),
      );

      // 如果目標用戶在線，則也會向其發送消息
      expect(mockIo.to).toHaveBeenCalledWith('target-socket-id');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'onDirectMessage',
        expect.any(Object),
      );
    });

    it('應在缺少必要資料時拋出錯誤', async () => {
      // 條件：缺少必要的私人訊息資料（targetId 和 directMessage）
      const invalidData = {
        userId: 'user-id-123',
      };

      await messageHandler.sendDirectMessage(mockIo, mockSocket, invalidData);

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應拒絕發送非自己的私人訊息', async () => {
      // 條件：嘗試發送非操作者本人的私人訊息
      const dataWithDifferentUser = {
        ...mockDirectMessageData,
        userId: 'different-user-id',
      };

      DB.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') return mockUser;
        if (id === 'different-user-id')
          return { id: 'different-user-id', name: 'Different User' };
        if (id === 'target-id-123') return mockTargetUser;
        return null;
      });

      await messageHandler.sendDirectMessage(
        mockIo,
        mockSocket,
        dataWithDifferentUser,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應處理意外錯誤', async () => {
      // 條件：socket 驗證過程中發生意外錯誤
      utils.Func.validate.socket.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await messageHandler.sendDirectMessage(
        mockIo,
        mockSocket,
        mockDirectMessageData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });
});
