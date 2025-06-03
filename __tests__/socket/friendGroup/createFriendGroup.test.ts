import { jest } from '@jest/globals';

// 被測試的模組
import { CreateFriendGroupHandler } from '../../../src/api/socket/events/friendGroup/friendGroup.handler';

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
import { CreateFriendGroupSchema } from '../../../src/api/socket/events/friendGroup/friendGroup.schema';

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
const defaultCreateData = {
  userId: DEFAULT_IDS.userId,
  group: {
    name: '我的好友群組',
    order: 0,
  },
};

describe('CreateFriendGroupHandler (好友群組創建處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 建立mock socket和io實例，操作者ID設為userId
    mockSocketInstance = createMockSocket(DEFAULT_IDS.userId, 'test-socket-id');
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    (mockDatabase.set.friendGroup as any).mockResolvedValue(true);
    mockDatabase.get.friendGroup.mockResolvedValue({
      friendGroupId: DEFAULT_IDS.friendGroupId,
      name: '我的好友群組',
      order: 0,
      userId: DEFAULT_IDS.userId,
      createdAt: Date.now(),
    });
    mockDataValidator.validate.mockResolvedValue(defaultCreateData);
  });

  it('應成功創建好友群組', async () => {
    await CreateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateFriendGroupSchema,
      defaultCreateData,
      'CREATEFRIENDGROUP',
    );

    expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: '我的好友群組',
        order: 0,
        userId: DEFAULT_IDS.userId,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendGroupAdd',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created friend group'),
    );
  });

  it('操作者不能創建非自己的好友群組', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.otherUserId;

    await CreateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot create non-self friend groups'),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await CreateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateFriendGroupSchema,
      defaultCreateData,
      'CREATEFRIENDGROUP',
    );
  });

  it('應生成UUID作為friendGroupId', async () => {
    await CreateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    const setFriendGroupCall = mockDatabase.set.friendGroup.mock.calls[0];
    const friendGroupId = setFriendGroupCall[0];

    // 檢查UUID格式 (36字符，包含連字符)
    expect(friendGroupId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('應包含創建時間戳', async () => {
    await CreateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    const setFriendGroupCall = mockDatabase.set.friendGroup.mock.calls[0];
    const friendGroupData = setFriendGroupCall[1];

    expect(friendGroupData.createdAt).toBeGreaterThan(0);
    expect(typeof friendGroupData.createdAt).toBe('number');
  });
});
