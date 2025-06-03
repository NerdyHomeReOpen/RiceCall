import { jest } from '@jest/globals';

// 被測試的模組
import { DeleteFriendApplicationHandler } from '../../../src/api/socket/events/friendApplication/friendApplication.handler';

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
import { DeleteFriendApplicationSchema } from '../../../src/api/socket/events/friendApplication/friendApplication.schema';

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
const defaultDeleteData = {
  senderId: DEFAULT_IDS.senderId,
  receiverId: DEFAULT_IDS.receiverId,
};

describe('DeleteFriendApplicationHandler (好友申請刪除處理)', () => {
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
    (mockDatabase.delete.friendApplication as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultDeleteData);
  });

  it('應成功刪除好友申請', async () => {
    await DeleteFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteFriendApplicationSchema,
      defaultDeleteData,
      'DELETEFRIENDAPPLICATION',
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted friend application'),
    );
  });

  it('發送者可以刪除自己的好友申請', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.senderId;

    await DeleteFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted friend application'),
    );
  });

  it('接收者可以刪除好友申請', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.receiverId;

    await DeleteFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted friend application'),
    );
  });

  it('操作者不能刪除非自己相關的好友申請', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.otherUserId;

    await DeleteFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot delete non-self friend applications'),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await DeleteFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteFriendApplicationSchema,
      defaultDeleteData,
      'DELETEFRIENDAPPLICATION',
    );
  });
});
