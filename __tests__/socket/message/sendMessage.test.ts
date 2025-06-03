import { jest } from '@jest/globals';

// 被測試的模組
import { SendMessageHandler } from '../../../src/api/socket/events/message/message.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockInfo,
} from '../../_testSetup';

// 錯誤類型和Schema
import { SendMessageSchema } from '../../../src/api/socket/events/message/message.schemas';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  serverId: 'server-id-123',
  channelId: 'channel-id-123',
} as const;

// 測試數據
const defaultSendData = {
  userId: DEFAULT_IDS.operatorUserId,
  serverId: DEFAULT_IDS.serverId,
  channelId: DEFAULT_IDS.channelId,
  message: {
    content: '測試訊息內容',
    type: 'general' as const,
  },
};

describe('SendMessageHandler (發送訊息處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 建立mock socket和io實例
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.operatorUserId,
      'test-socket-id',
    );
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    mockDatabase.get.channel.mockResolvedValue({
      channelId: DEFAULT_IDS.channelId,
      serverId: DEFAULT_IDS.serverId,
      name: '測試頻道',
      forbidGuestUrl: false,
    });

    mockDatabase.get.user.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      username: 'testuser',
      displayName: '測試用戶',
    });

    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 3, // 一般成員
      nickname: null,
      isBlocked: 0,
    });

    (mockDatabase.set.member as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultSendData);
  });

  it('應成功發送頻道訊息', async () => {
    await SendMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSendData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SendMessageSchema,
      defaultSendData,
      'SENDMESSAGE',
    );

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        lastMessageTime: expect.any(Number),
      }),
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        lastMessageTime: expect.any(Number),
      }),
    );

    expect(mockSocketInstance.to).toHaveBeenCalledWith(
      `channel_${DEFAULT_IDS.channelId}`,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent message to channel'),
    );
  });

  it('訪客在禁止URL頻道發送訊息時應過濾URL', async () => {
    mockDatabase.get.channel.mockResolvedValue({
      channelId: DEFAULT_IDS.channelId,
      serverId: DEFAULT_IDS.serverId,
      name: '測試頻道',
      forbidGuestUrl: true, // 禁止訪客發送URL
    });

    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 1, // 訪客權限
      nickname: null,
      isBlocked: 0,
    });

    const messageWithUrl = {
      ...defaultSendData,
      message: {
        content: '查看這個網站 https://example.com 很棒',
        type: 'general' as const,
      },
    };
    mockDataValidator.validate.mockResolvedValue(messageWithUrl);

    await SendMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      messageWithUrl,
    );

    // 檢查訊息內容是否被過濾
    const ioEmitCall = mockIoInstance
      .to()
      .emit.mock.calls.find((call: any) => call[0] === 'onMessage');
    expect(ioEmitCall).toBeTruthy();
    if (ioEmitCall) {
      const message = ioEmitCall[1];
      expect(message.content).toContain('{{GUEST_SEND_AN_EXTERNAL_LINK}}');
      expect(message.content).not.toContain('https://example.com');
    }

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent message to channel'),
    );
  });

  it('訪客在允許URL頻道發送訊息時不應過濾URL', async () => {
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 1, // 訪客權限
      nickname: null,
      isBlocked: 0,
    });

    const messageWithUrl = {
      ...defaultSendData,
      message: {
        content: '查看這個網站 https://example.com 很棒',
        type: 'general' as const,
      },
    };
    mockDataValidator.validate.mockResolvedValue(messageWithUrl);

    await SendMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      messageWithUrl,
    );

    // 檢查訊息內容是否保持原樣
    const ioEmitCall = mockIoInstance
      .to()
      .emit.mock.calls.find((call: any) => call[0] === 'onMessage');
    expect(ioEmitCall).toBeTruthy();
    if (ioEmitCall) {
      const message = ioEmitCall[1];
      expect(message.content).toContain('https://example.com');
      expect(message.content).not.toContain('{{GUEST_SEND_AN_EXTERNAL_LINK}}');
    }

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent message to channel'),
    );
  });

  it('應包含完整的訊息資料', async () => {
    await SendMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSendData,
    );

    const ioEmitCall = mockIoInstance
      .to()
      .emit.mock.calls.find((call: any) => call[0] === 'onMessage');
    expect(ioEmitCall).toBeTruthy();
    if (ioEmitCall) {
      const message = ioEmitCall[1];
      expect(message).toEqual(
        expect.objectContaining({
          content: '測試訊息內容',
          type: 'general',
          sender: expect.objectContaining({
            userId: DEFAULT_IDS.operatorUserId,
            username: 'testuser',
            permissionLevel: 3,
          }),
          receiver: null,
          serverId: DEFAULT_IDS.serverId,
          channelId: DEFAULT_IDS.channelId,
          timestamp: expect.any(Number),
        }),
      );
    }
  });

  it('應正確呼叫資料驗證器', async () => {
    await SendMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSendData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SendMessageSchema,
      defaultSendData,
      'SENDMESSAGE',
    );
  });
});
