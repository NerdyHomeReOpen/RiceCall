import { jest } from '@jest/globals';

// Mock SocketServer - 需要在jest.mock之前定義
const mockSocketServer = {
  getSocket: jest.fn(),
};

// 被測試的模組
import { SendDirectMessageHandler } from '../../../src/api/socket/events/message/message.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

// 錯誤類型和Schema
import { SendDirectMessageSchema } from '../../../src/api/socket/events/message/message.schemas';

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
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: mockSocketServer,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
} as const;

// 測試數據
const defaultDirectData = {
  userId: DEFAULT_IDS.operatorUserId,
  targetId: DEFAULT_IDS.targetUserId,
  directMessage: {
    content: '私人訊息內容',
    type: 'dm' as const,
  },
};

describe('SendDirectMessageHandler (發送私人訊息處理)', () => {
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
    mockDatabase.get.user.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      username: 'sender',
      displayName: '發送者',
    });

    mockDataValidator.validate.mockResolvedValue(defaultDirectData);
    mockSocketServer.getSocket.mockReturnValue(null); // 預設目標用戶離線
  });

  it('應成功發送私人訊息（目標用戶在線）', async () => {
    const targetSocket = createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServer.getSocket.mockReturnValue(targetSocket);

    await SendDirectMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDirectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SendDirectMessageSchema,
      defaultDirectData,
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

    await SendDirectMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDirectData,
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
    const otherUserData = {
      ...defaultDirectData,
      userId: 'other-user-id',
    };
    mockDataValidator.validate.mockResolvedValue(otherUserData);

    await SendDirectMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      otherUserData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot send non-self direct message'),
    );
  });

  it('應正確排序用戶ID', async () => {
    // 測試user1Id和user2Id的排序邏輯
    await SendDirectMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDirectData,
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

  it('應正確呼叫資料驗證器', async () => {
    await SendDirectMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDirectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SendDirectMessageSchema,
      defaultDirectData,
      'SENDDIRECTMESSAGE',
    );
  });
});
