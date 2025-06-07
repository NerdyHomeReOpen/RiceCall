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
import { SendActionMessageHandler } from '../../../src/api/socket/events/message/message.handler';
import { SendActionMessageSchema } from '../../../src/api/socket/events/message/message.schemas';
import {
  createActionMessageVariant,
  createDefaultTestData,
  createMemberVariant,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testInsufficientPermission,
  testValidationError,
} from './_testHelpers';

describe('SendActionMessageHandler (發送動作訊息處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 設定操作者為管理員權限
    testData.operatorMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 5,
    });

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

  it('應成功發送頻道動作訊息', async () => {
    const data = testData.createSendActionMessageData();

    await SendActionMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SendActionMessageSchema,
      data,
      'SENDACTIONMESSAGE',
    );

    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;

    // 檢查發送到主頻道
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'onActionMessage',
      expect.objectContaining({
        content: '重要警告訊息',
        type: 'alert',
        serverId: DEFAULT_IDS.serverId,
        channelId: DEFAULT_IDS.channelId,
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent action message to server'),
    );
  });

  it('應成功發送伺服器動作訊息', async () => {
    const serverActionData = testData.createSendActionMessageData({
      channelId: null, // 伺服器級別的訊息
    });

    await SendActionMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      serverActionData,
    );

    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'onActionMessage',
      expect.objectContaining({
        content: '重要警告訊息',
        type: 'alert',
        serverId: DEFAULT_IDS.serverId,
        channelId: null,
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent action message to server'),
    );
  });

  it('權限不足時應拒絕（權限 < 3）', async () => {
    await testInsufficientPermission(
      SendActionMessageHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createSendActionMessageData(),
      2, // 權限不足
      'Cannot sent alert message without high permissionLevel',
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { serverId: '', channelId: '', message: {} };
    const validationError = new Error('動作訊息資料不正確');

    await testValidationError(
      SendActionMessageHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '傳送訊息失敗，請稍後再試',
    );
  });

  describe('動作訊息處理', () => {
    it('應包含完整的動作訊息資料', async () => {
      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      const messageCall = mockIoRoomEmit.mock.calls.find(
        (call: any) => call[0] === 'onActionMessage',
      );
      expect(messageCall).toBeTruthy();
      if (messageCall) {
        const message = messageCall[1];
        expect(message).toEqual(
          expect.objectContaining({
            content: '重要警告訊息',
            type: 'alert',
            sender: expect.objectContaining({
              userId: DEFAULT_IDS.operatorUserId,
              username: 'testuser',
              permissionLevel: 5,
            }),
            receiver: null,
            serverId: DEFAULT_IDS.serverId,
            channelId: DEFAULT_IDS.channelId,
            timestamp: expect.any(Number),
          }),
        );
      }
    });

    it('應正確處理不同類型的動作訊息', async () => {
      const infoData = testData.createSendActionMessageData({
        message: createActionMessageVariant(
          testData.createSendActionMessageData().message,
          {
            content: '資訊訊息',
            type: 'info',
          },
        ),
      });

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        infoData,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      const messageCall = mockIoRoomEmit.mock.calls.find(
        (call: any) => call[0] === 'onActionMessage',
      );
      expect(messageCall).toBeTruthy();
      if (messageCall) {
        const message = messageCall[1];
        expect(message.type).toBe('info');
        expect(message.content).toBe('資訊訊息');
      }
    });

    it('應正確處理不同伺服器ID', async () => {
      const customServerId = 'custom-server-id';

      // 為自定義伺服器設定 mock 成員資料
      mockDatabase.get.member.mockImplementation(
        async (userId: string, serverId: string) => {
          if (
            userId === DEFAULT_IDS.operatorUserId &&
            serverId === customServerId
          ) {
            return createMemberVariant(testData.operatorMember, {
              serverId: customServerId,
            }) as any;
          }
          if (
            userId === DEFAULT_IDS.operatorUserId &&
            serverId === DEFAULT_IDS.serverId
          ) {
            return testData.operatorMember as any;
          }
          return null;
        },
      );

      const customData = testData.createSendActionMessageData({
        serverId: customServerId,
      });

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        customData,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      const messageCall = mockIoRoomEmit.mock.calls.find(
        (call: any) => call[0] === 'onActionMessage',
      );
      expect(messageCall).toBeTruthy();
      if (messageCall) {
        const message = messageCall[1];
        expect(message.serverId).toBe(customServerId);
      }
    });

    it('應正確發送到子頻道（有同類別的子頻道）', async () => {
      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查發送到主頻道
      const mockIoTo = require('../../_testSetup').mockIoTo;
      expect(mockIoTo).toHaveBeenCalledWith(`channel_${DEFAULT_IDS.channelId}`);

      // 檢查發送到子頻道
      expect(mockIoTo).toHaveBeenCalledWith('channel_child-channel-1');
      expect(mockIoTo).toHaveBeenCalledWith('channel_child-channel-2');

      // 不應發送到其他類別的頻道
      expect(mockIoTo).not.toHaveBeenCalledWith('channel_other-channel');
    });
  });

  describe('權限檢查', () => {
    it('權限等級3應該允許發送', async () => {
      testData.operatorMember = createMemberVariant(testData.operatorMember, {
        permissionLevel: 3,
      });

      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'onActionMessage',
        expect.any(Object),
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('sent action message to server'),
      );
    });

    it('權限等級4應該允許發送', async () => {
      testData.operatorMember = createMemberVariant(testData.operatorMember, {
        permissionLevel: 4,
      });

      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'onActionMessage',
        expect.any(Object),
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('sent action message to server'),
      );
    });

    it('管理員權限等級5應該允許發送', async () => {
      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'onActionMessage',
        expect.any(Object),
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('sent action message to server'),
      );
    });
  });

  describe('Socket事件處理', () => {
    it('應正確發送頻道動作訊息到相關房間', async () => {
      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoTo = require('../../_testSetup').mockIoTo;
      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;

      // 檢查發送到主頻道和子頻道
      expect(mockIoTo).toHaveBeenCalledWith(`channel_${DEFAULT_IDS.channelId}`);
      expect(mockIoTo).toHaveBeenCalledWith('channel_child-channel-1');
      expect(mockIoTo).toHaveBeenCalledWith('channel_child-channel-2');

      // 檢查發送訊息
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'onActionMessage',
        expect.any(Object),
      );
    });

    it('應正確發送伺服器動作訊息到伺服器房間', async () => {
      const serverData = testData.createSendActionMessageData({
        channelId: null,
      });

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        serverData,
      );

      const mockIoTo = require('../../_testSetup').mockIoTo;
      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;

      expect(mockIoTo).toHaveBeenCalledWith(`server_${DEFAULT_IDS.serverId}`);

      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'onActionMessage',
        expect.any(Object),
      );
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        SendActionMessageSchema,
        data,
        'SENDACTIONMESSAGE',
      );
    });

    it('應查詢頻道和伺服器頻道資訊', async () => {
      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.get.channel).toHaveBeenCalledWith(
        DEFAULT_IDS.channelId,
      );
      expect(mockDatabase.get.serverChannels).toHaveBeenCalledWith(
        DEFAULT_IDS.serverId,
      );
    });

    it('應查詢操作者的用戶和成員資訊', async () => {
      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.get.user).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
      );
      expect(mockDatabase.get.member).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
      );
    });

    it('應按正確順序執行發送流程', async () => {
      const data = testData.createSendActionMessageData();

      await SendActionMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockDatabase.get.channel).toHaveBeenCalledTimes(1);
      expect(mockDatabase.get.serverChannels).toHaveBeenCalledTimes(1);
      expect(mockDatabase.get.user).toHaveBeenCalledTimes(1);
      expect(mockDatabase.get.member).toHaveBeenCalledTimes(1);
    });
  });
});
