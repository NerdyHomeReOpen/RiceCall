import { jest } from '@jest/globals';

// 被測試的模組
import { UpdateFriendGroupHandler } from '../../../src/api/socket/events/friendGroup/friendGroup.handler';

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
import { UpdateFriendGroupSchema } from '../../../src/api/socket/events/friendGroup/friendGroup.schema';

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
  userId: 'user-id-123',
  otherUserId: 'other-user-id',
  friendGroupId: 'friend-group-id-123',
} as const;

// 測試數據
const defaultUpdateData = {
  userId: DEFAULT_IDS.userId,
  friendGroupId: DEFAULT_IDS.friendGroupId,
  group: {
    name: '更新後的群組名稱',
    order: 1,
  },
};

describe('UpdateFriendGroupHandler (好友群組更新處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 建立mock socket和io實例，操作者ID設為userId
    mockSocketInstance = createMockSocket(DEFAULT_IDS.userId, 'test-socket-id');
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    (mockDatabase.set.friendGroup as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultUpdateData);
  });

  it('應成功更新好友群組', async () => {
    await UpdateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateFriendGroupSchema,
      defaultUpdateData,
      'UPDATEFRIENDGROUP',
    );

    expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
      DEFAULT_IDS.friendGroupId,
      defaultUpdateData.group,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendGroupUpdate',
      DEFAULT_IDS.friendGroupId,
      defaultUpdateData.group,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated friend group'),
    );
  });

  it('操作者不能更新非自己的好友群組', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.otherUserId;

    await UpdateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot update non-self friend groups'),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await UpdateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateFriendGroupSchema,
      defaultUpdateData,
      'UPDATEFRIENDGROUP',
    );
  });

  it('應能只更新部分屬性', async () => {
    const partialUpdateData = {
      ...defaultUpdateData,
      group: {
        name: '只更新名稱',
      },
    };
    mockDataValidator.validate.mockResolvedValue(partialUpdateData);

    await UpdateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      partialUpdateData,
    );

    expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
      DEFAULT_IDS.friendGroupId,
      { name: '只更新名稱' },
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendGroupUpdate',
      DEFAULT_IDS.friendGroupId,
      { name: '只更新名稱' },
    );
  });

  it('應能更新群組順序', async () => {
    const orderUpdateData = {
      ...defaultUpdateData,
      group: {
        order: 5,
      },
    };
    mockDataValidator.validate.mockResolvedValue(orderUpdateData);

    await UpdateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      orderUpdateData,
    );

    expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
      DEFAULT_IDS.friendGroupId,
      { order: 5 },
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated friend group'),
    );
  });
});
