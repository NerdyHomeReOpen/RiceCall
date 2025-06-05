import { jest } from '@jest/globals';
import { mockDatabase, mockDataValidator, mockInfo } from '../../_testSetup';

// Mock Database
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));

// Mock DataValidator
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));

jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// 被測試的模組和測試輔助工具
import { SendMessageHandler } from '../../../src/api/socket/events/message/message.handler';
import { SendMessageSchema } from '../../../src/api/socket/events/message/message.schemas';
import {
  createChannelVariant,
  createDefaultTestData,
  createMemberVariant,
  createMessageVariant,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

describe('SendMessageHandler (發送訊息處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances(
      DEFAULT_IDS.operatorUserId,
    );
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功發送頻道訊息', async () => {
    const data = testData.createSendMessageData();

    await SendMessageHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SendMessageSchema,
      data,
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

    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'onMessage',
      expect.objectContaining({
        content: '測試訊息內容',
        type: 'general',
        serverId: DEFAULT_IDS.serverId,
        channelId: DEFAULT_IDS.channelId,
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent message to channel'),
    );
  });

  it('訪客在禁止URL頻道發送訊息時應過濾URL', async () => {
    // 設定禁止 URL 的頻道
    testData.channel = createChannelVariant(testData.channel, {
      forbidGuestUrl: true,
    });

    // 設定操作者為訪客
    testData.operatorMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 1,
    });

    // 重新設定 mock 以使用修改後的數據
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);

    const messageWithUrl = testData.createSendMessageData({
      message: createMessageVariant(testData.createSendMessageData().message, {
        content: '查看這個網站 https://example.com 很棒',
      }),
    });

    await SendMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      messageWithUrl,
    );

    // 檢查訊息內容是否被過濾
    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    const messageCall = mockIoRoomEmit.mock.calls.find(
      (call: any) => call[0] === 'onMessage',
    );
    expect(messageCall).toBeTruthy();
    if (messageCall) {
      const message = messageCall[1];
      expect(message.content).toContain('{{GUEST_SEND_AN_EXTERNAL_LINK}}');
      expect(message.content).not.toContain('https://example.com');
    }

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent message to channel'),
    );
  });

  it('訪客在允許URL頻道發送訊息時不應過濾URL', async () => {
    // 設定操作者為訪客
    testData.operatorMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 1,
    });

    const messageWithUrl = testData.createSendMessageData({
      message: createMessageVariant(testData.createSendMessageData().message, {
        content: '查看這個網站 https://example.com 很棒',
      }),
    });

    await SendMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      messageWithUrl,
    );

    // 檢查訊息內容是否保持原樣
    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    const messageCall = mockIoRoomEmit.mock.calls.find(
      (call: any) => call[0] === 'onMessage',
    );
    expect(messageCall).toBeTruthy();
    if (messageCall) {
      const message = messageCall[1];
      expect(message.content).toBe('查看這個網站 https://example.com 很棒');
      expect(message.content).not.toContain('{{GUEST_SEND_AN_EXTERNAL_LINK}}');
    }

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent message to channel'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = {
      userId: '',
      serverId: '',
      channelId: '',
      message: {},
    };
    const validationError = new Error('訊息資料不正確');

    await testValidationError(
      SendMessageHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '傳送訊息失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      SendMessageHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createSendMessageData(),
      'set',
      'Database connection failed',
      '傳送訊息失敗，請稍後再試',
    );
  });

  describe('訊息資料處理', () => {
    it('應包含完整的訊息資料', async () => {
      const data = testData.createSendMessageData();

      await SendMessageHandler.handle(mockIoInstance, mockSocketInstance, data);

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      const messageCall = mockIoRoomEmit.mock.calls.find(
        (call: any) => call[0] === 'onMessage',
      );
      expect(messageCall).toBeTruthy();
      if (messageCall) {
        const message = messageCall[1];
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

    it('應正確處理不同類型的訊息', async () => {
      const imageData = testData.createSendMessageData({
        message: createMessageVariant(
          testData.createSendMessageData().message,
          {
            content: 'image_url_here',
            type: 'image',
          },
        ),
      });

      await SendMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        imageData,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      const messageCall = mockIoRoomEmit.mock.calls.find(
        (call: any) => call[0] === 'onMessage',
      );
      expect(messageCall).toBeTruthy();
      if (messageCall) {
        const message = messageCall[1];
        expect(message.type).toBe('image');
        expect(message.content).toBe('image_url_here');
      }
    });

    it('應正確處理不同用戶ID和伺服器ID', async () => {
      const customData = testData.createSendMessageData({
        serverId: 'custom-server-id',
        channelId: 'custom-channel-id',
      });

      await SendMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        customData,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        'custom-server-id',
        expect.any(Object),
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      const messageCall = mockIoRoomEmit.mock.calls.find(
        (call: any) => call[0] === 'onMessage',
      );
      expect(messageCall).toBeTruthy();
      if (messageCall) {
        const message = messageCall[1];
        expect(message.serverId).toBe('custom-server-id');
        expect(message.channelId).toBe('custom-channel-id');
      }
    });
  });

  describe('Socket事件處理', () => {
    it('應發送正確的Socket事件', async () => {
      const data = testData.createSendMessageData();

      await SendMessageHandler.handle(mockIoInstance, mockSocketInstance, data);

      // 檢查 serverUpdate 事件
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'serverUpdate',
        DEFAULT_IDS.serverId,
        expect.objectContaining({
          lastMessageTime: expect.any(Number),
        }),
      );

      // 檢查頻道聲音事件
      expect(mockSocketInstance.to).toHaveBeenCalledWith(
        `channel_${DEFAULT_IDS.channelId}`,
      );

      // 檢查訊息事件
      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'onMessage',
        expect.any(Object),
      );
    });

    it('應發送正確的房間ID', async () => {
      const customChannelId = 'test-channel-123';
      const data = testData.createSendMessageData({
        channelId: customChannelId,
      });

      await SendMessageHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(mockSocketInstance.to).toHaveBeenCalledWith(
        `channel_${customChannelId}`,
      );
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createSendMessageData();

      await SendMessageHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        SendMessageSchema,
        data,
        'SENDMESSAGE',
      );
    });

    it('應更新成員的最後訊息時間', async () => {
      const data = testData.createSendMessageData();

      await SendMessageHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        expect.objectContaining({
          lastMessageTime: expect.any(Number),
        }),
      );
    });

    it('應按正確順序執行發送流程', async () => {
      const data = testData.createSendMessageData();

      await SendMessageHandler.handle(mockIoInstance, mockSocketInstance, data);

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockDatabase.set.member).toHaveBeenCalledTimes(1);
    });
  });
});
