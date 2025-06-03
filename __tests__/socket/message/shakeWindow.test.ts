import { jest } from '@jest/globals';

// Mock SocketServer - 需要在jest.mock之前定義
const mockSocketServer = {
  getSocket: jest.fn(),
};

// 被測試的模組
import { ShakeWindowHandler } from '../../../src/api/socket/events/message/message.handler';

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
import { ShakeWindowSchema } from '../../../src/api/socket/events/message/message.schemas';

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
const defaultShakeData = {
  userId: DEFAULT_IDS.operatorUserId,
  targetId: DEFAULT_IDS.targetUserId,
};

describe('ShakeWindowHandler (搖動視窗處理)', () => {
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
    mockDatabase.get.userFriend.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      friendId: DEFAULT_IDS.targetUserId,
      friendGroupId: 'default-group',
      displayName: '好友',
      addedAt: Date.now(),
    });

    mockDataValidator.validate.mockResolvedValue(defaultShakeData);
    mockSocketServer.getSocket.mockReturnValue(null); // 預設目標用戶離線
  });

  it('應成功搖動好友視窗（目標用戶在線）', async () => {
    const targetSocket = createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServer.getSocket.mockReturnValue(targetSocket);

    await ShakeWindowHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultShakeData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ShakeWindowSchema,
      defaultShakeData,
      'SHAKEWINDOW',
    );

    expect(mockDatabase.get.userFriend).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.operatorUserId,
    );

    expect(targetSocket.emit).toHaveBeenCalledWith(
      'onShakeWindow',
      expect.objectContaining({
        userId: DEFAULT_IDS.operatorUserId,
        friendId: DEFAULT_IDS.targetUserId,
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('shook window to User'),
    );
  });

  it('應處理目標用戶離線的情況', async () => {
    mockSocketServer.getSocket.mockReturnValue(null);

    await ShakeWindowHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultShakeData,
    );

    expect(mockDatabase.get.userFriend).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.operatorUserId,
    );

    // 目標用戶離線，不會發送事件
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('shook window to User'),
    );
  });

  it('不能為其他用戶搖動視窗', async () => {
    const otherUserData = {
      ...defaultShakeData,
      userId: 'other-user-id',
    };
    mockDataValidator.validate.mockResolvedValue(otherUserData);

    await ShakeWindowHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      otherUserData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot shake non-self window'),
    );
  });

  it('不能對非好友搖動視窗', async () => {
    mockDatabase.get.userFriend.mockResolvedValue(null); // 不是好友

    await ShakeWindowHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultShakeData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot shake non-friend window'),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await ShakeWindowHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultShakeData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ShakeWindowSchema,
      defaultShakeData,
      'SHAKEWINDOW',
    );
  });
});
