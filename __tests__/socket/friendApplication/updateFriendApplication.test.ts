import { jest } from '@jest/globals';

// 被測試的模組
import { UpdateFriendApplicationHandler } from '../../../src/api/socket/events/friendApplication/friendApplication.handler';

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
import { UpdateFriendApplicationSchema } from '../../../src/api/socket/events/friendApplication/friendApplication.schema';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: { getSocket: require('../../_testSetup').mockSocketServerGetSocket },
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
  senderId: 'sender-user-id',
  receiverId: 'receiver-user-id',
  otherUserId: 'other-user-id',
} as const;

// 測試數據
const defaultUpdateData = {
  senderId: DEFAULT_IDS.senderId,
  receiverId: DEFAULT_IDS.receiverId,
  friendApplication: {
    description: '更新後的描述',
  },
};

describe('UpdateFriendApplicationHandler (好友申請更新處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 建立mock socket和io實例，操作者ID設為senderId
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.senderId,
      'test-socket-id',
    );
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    (mockDatabase.set.friendApplication as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultUpdateData);
  });

  it('應成功更新好友申請', async () => {
    await UpdateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateFriendApplicationSchema,
      defaultUpdateData,
      'UPDATEFRIENDAPPLICATION',
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated friend application'),
    );
  });

  it('發送者可以修改自己的好友申請', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.senderId;

    await UpdateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated friend application'),
    );
  });

  it('接收者可以修改好友申請', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.receiverId;

    await UpdateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated friend application'),
    );
  });

  it('操作者不能修改非自己相關的好友申請', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.otherUserId;

    await UpdateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot modify non-self friend applications'),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await UpdateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateFriendApplicationSchema,
      defaultUpdateData,
      'UPDATEFRIENDAPPLICATION',
    );
  });
});
