import { jest } from '@jest/globals';
import {
  mockDatabase,
  mockDataValidator,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

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

// Mock SocketServer
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: require('./_testHelpers').mockSocketServer,
}));

// 被測試的模組和測試輔助工具
import { SendDirectMessageHandler } from '../../../src/api/socket/events/message/message.handler';
import { SendDirectMessageSchema } from '../../../src/api/socket/events/message/message.schemas';
import {
  createDefaultTestData,
  createDirectMessageVariant,
  createStandardMockInstances,
  DEFAULT_IDS,
  mockSocketServer,
  setupAfterEach,
  setupBeforeEach,
  setupTargetUserOnline,
  testValidationError,
} from './_testHelpers';

describe('SendDirectMessageHandler (發送私人訊息處理)', () => {
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

  it('應成功發送私人訊息（目標用戶在線）', async () => {
    const targetSocket = setupTargetUserOnline();
    const data = testData.createSendDirectMessageData();

    await SendDirectMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SendDirectMessageSchema,
      data,
      'SENDDIRECTMESSAGE',
    );

    // 檢查發送者收到訊息
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'onDirectMessage',
      expect.objectContaining({
        content: '私人訊息內容',
        type: 'dm',
        senderId: DEFAULT_IDS.operatorUserId,
        user1Id: expect.any(String),
        user2Id: expect.any(String),
        timestamp: expect.any(Number),
      }),
    );

    // 檢查目標用戶收到訊息
    expect(targetSocket.emit).toHaveBeenCalledWith(
      'onDirectMessage',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent direct message to User'),
    );
  });

  it('應成功發送私人訊息（目標用戶離線）', async () => {
    mockSocketServer.getSocket.mockReturnValue(null);
    const data = testData.createSendDirectMessageData();

    await SendDirectMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    // 檢查發送者收到訊息
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'onDirectMessage',
      expect.any(Object),
    );

    // 目標用戶離線，不會收到訊息
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent direct message to User'),
    );
  });

  it('不能為其他用戶發送私人訊息', async () => {
    const otherUserData = testData.createSendDirectMessageData({
      userId: 'other-user-id',
    });

    await SendDirectMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      otherUserData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot send non-self direct message'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', targetId: '', directMessage: {} };
    const validationError = new Error('私人訊息資料不正確');

    await testValidationError(
      SendDirectMessageHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '傳送私訊失敗，請稍後再試',
    );
  });

  describe('訊息資料處理', () => {
    it('應正確排序用戶ID', async () => {
      const data = testData.createSendDirectMessageData();

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const emitCall = mockSocketInstance.emit.mock.calls.find(
        (call: any) => call[0] === 'onDirectMessage',
      );
      expect(emitCall).toBeTruthy();
      if (emitCall) {
        const message = emitCall[1];
        const sortedIds = [
          DEFAULT_IDS.operatorUserId,
          DEFAULT_IDS.targetUserId,
        ].sort();
        expect(message.user1Id).toBe(sortedIds[0]);
        expect(message.user2Id).toBe(sortedIds[1]);
      }
    });

    it('應包含用戶資訊在訊息中', async () => {
      const data = testData.createSendDirectMessageData();

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const emitCall = mockSocketInstance.emit.mock.calls.find(
        (call: any) => call[0] === 'onDirectMessage',
      );
      expect(emitCall).toBeTruthy();
      if (emitCall) {
        const message = emitCall[1];
        expect(message).toEqual(
          expect.objectContaining({
            content: '私人訊息內容',
            type: 'dm',
            senderId: DEFAULT_IDS.operatorUserId,
            userId: DEFAULT_IDS.operatorUserId,
            username: 'testuser',
            displayName: '測試用戶',
            timestamp: expect.any(Number),
          }),
        );
      }
    });

    it('應正確處理不同類型的私人訊息', async () => {
      const imageData = testData.createSendDirectMessageData({
        directMessage: createDirectMessageVariant(
          testData.createSendDirectMessageData().directMessage,
          {
            content: 'image_data_here',
            type: 'image',
          },
        ),
      });

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        imageData,
      );

      const emitCall = mockSocketInstance.emit.mock.calls.find(
        (call: any) => call[0] === 'onDirectMessage',
      );
      expect(emitCall).toBeTruthy();
      if (emitCall) {
        const message = emitCall[1];
        expect(message.type).toBe('image');
        expect(message.content).toBe('image_data_here');
      }
    });

    it('應正確處理不同的目標用戶', async () => {
      const customTargetId = 'custom-target-user';
      const data = testData.createSendDirectMessageData({
        targetId: customTargetId,
      });

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const emitCall = mockSocketInstance.emit.mock.calls.find(
        (call: any) => call[0] === 'onDirectMessage',
      );
      expect(emitCall).toBeTruthy();
      if (emitCall) {
        const message = emitCall[1];
        const sortedIds = [DEFAULT_IDS.operatorUserId, customTargetId].sort();
        expect(message.user1Id).toBe(sortedIds[0]);
        expect(message.user2Id).toBe(sortedIds[1]);
      }
    });
  });

  describe('Socket事件處理', () => {
    it('應發送訊息給發送者和目標用戶（目標用戶在線）', async () => {
      const targetSocket = setupTargetUserOnline();
      const data = testData.createSendDirectMessageData();

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查發送者收到訊息
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'onDirectMessage',
        expect.any(Object),
      );

      // 檢查目標用戶收到訊息
      expect(targetSocket.emit).toHaveBeenCalledWith(
        'onDirectMessage',
        expect.any(Object),
      );
    });

    it('只發送訊息給發送者（目標用戶離線）', async () => {
      mockSocketServer.getSocket.mockReturnValue(null);
      const data = testData.createSendDirectMessageData();

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查發送者收到訊息
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'onDirectMessage',
        expect.any(Object),
      );

      // 檢查是否嘗試取得目標用戶的 socket
      expect(mockSocketServer.getSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
      );
    });

    it('應發送相同的訊息內容給發送者和目標用戶', async () => {
      const targetSocket = setupTargetUserOnline();
      const data = testData.createSendDirectMessageData();

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const senderCall = mockSocketInstance.emit.mock.calls.find(
        (call: any) => call[0] === 'onDirectMessage',
      );
      const targetCall = targetSocket.emit.mock.calls.find(
        (call: any) => call[0] === 'onDirectMessage',
      );

      expect(senderCall).toBeTruthy();
      expect(targetCall).toBeTruthy();

      if (senderCall && targetCall) {
        expect(senderCall[1]).toEqual(targetCall[1]);
      }
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createSendDirectMessageData();

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        SendDirectMessageSchema,
        data,
        'SENDDIRECTMESSAGE',
      );
    });

    it('應查詢發送者的用戶資訊', async () => {
      const data = testData.createSendDirectMessageData();

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.get.user).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
      );
    });

    it('應按正確順序執行發送流程', async () => {
      const data = testData.createSendDirectMessageData();

      await SendDirectMessageHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockDatabase.get.user).toHaveBeenCalledTimes(1);
      expect(mockSocketInstance.emit).toHaveBeenCalledTimes(1);
    });
  });
});
