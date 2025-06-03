import { jest } from '@jest/globals';

// 被測試的模組
import { SendActionMessageHandler } from '../../../src/api/socket/events/message/message.handler';

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
import { SendActionMessageSchema } from '../../../src/api/socket/events/message/message.schemas';

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
  categoryId: 'category-id-123',
} as const;

// 測試數據
const defaultActionData = {
  serverId: DEFAULT_IDS.serverId,
  channelId: DEFAULT_IDS.channelId,
  message: {
    content: '重要警告訊息',
    type: 'alert' as const,
  },
};

describe('SendActionMessageHandler (發送動作訊息處理)', () => {
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
      categoryId: DEFAULT_IDS.categoryId,
    });

    mockDatabase.get.serverChannels.mockResolvedValue([
      {
        channelId: 'child-channel-1',
        categoryId: DEFAULT_IDS.categoryId,
        name: '子頻道1',
      },
      {
        channelId: 'child-channel-2',
        categoryId: DEFAULT_IDS.categoryId,
        name: '子頻道2',
      },
      {
        channelId: 'other-channel',
        categoryId: 'other-category',
        name: '其他頻道',
      },
    ]);

    mockDatabase.get.user.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      username: 'admin',
      displayName: '管理員',
    });

    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 5, // 管理員權限
      nickname: null,
      isBlocked: 0,
    });

    mockDataValidator.validate.mockResolvedValue(defaultActionData);
  });

  it('應成功發送頻道動作訊息', async () => {
    await SendActionMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultActionData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SendActionMessageSchema,
      defaultActionData,
      'SENDACTIONMESSAGE',
    );

    // 檢查發送到主頻道
    expect(mockIoInstance.to).toHaveBeenCalledWith(
      `channel_${DEFAULT_IDS.channelId}`,
    );

    // 檢查發送到子頻道
    expect(mockIoInstance.to).toHaveBeenCalledWith('channel_child-channel-1');
    expect(mockIoInstance.to).toHaveBeenCalledWith('channel_child-channel-2');

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent action message to server'),
    );
  });

  it('應成功發送伺服器動作訊息', async () => {
    const serverActionData = {
      ...defaultActionData,
      channelId: null, // 伺服器級別的訊息
    };
    mockDataValidator.validate.mockResolvedValue(serverActionData);

    await SendActionMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      serverActionData,
    );

    expect(mockIoInstance.to).toHaveBeenCalledWith(
      `server_${DEFAULT_IDS.serverId}`,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent action message to server'),
    );
  });

  it('權限不足時應拒絕（權限 < 3）', async () => {
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 2, // 權限不足
      nickname: null,
      isBlocked: 0,
    });

    await SendActionMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultActionData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Cannot sent alert message without high permissionLevel',
      ),
    );
  });

  it('應包含完整的動作訊息資料', async () => {
    await SendActionMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultActionData,
    );

    const ioEmitCall = mockIoInstance
      .to()
      .emit.mock.calls.find((call: any) => call[0] === 'onActionMessage');
    expect(ioEmitCall).toBeTruthy();
    if (ioEmitCall) {
      const message = ioEmitCall[1];
      expect(message).toEqual(
        expect.objectContaining({
          content: '重要警告訊息',
          type: 'alert',
          sender: expect.objectContaining({
            userId: DEFAULT_IDS.operatorUserId,
            username: 'admin',
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

  it('應正確呼叫資料驗證器', async () => {
    await SendActionMessageHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultActionData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SendActionMessageSchema,
      defaultActionData,
      'SENDACTIONMESSAGE',
    );
  });
});
