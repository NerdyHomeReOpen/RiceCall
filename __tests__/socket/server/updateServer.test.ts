import { jest } from '@jest/globals';

// 被測試的模組
import { UpdateServerHandler } from '../../../src/api/socket/events/server/server.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockError,
  mockInfo,
  mockIoRoomEmit,
  mockWarn,
} from '../../_testSetup';

// 錯誤類型和Schema
import { UpdateServerSchema } from '../../../src/api/socket/events/server/server.schema';

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
} as const;

// 測試數據
const defaultUpdateData = {
  serverId: DEFAULT_IDS.serverId,
  server: {
    name: '更新後的伺服器名稱',
    description: '更新後的描述',
    announcement: '重要公告',
  },
};

describe('UpdateServerHandler (更新伺服器處理)', () => {
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
    mockDataValidator.validate.mockResolvedValue(defaultUpdateData);

    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 5, // 管理員權限
      isBlocked: 0,
    });

    mockDatabase.set.server.mockResolvedValue(true);
  });

  it('應成功更新伺服器', async () => {
    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateServerSchema,
      defaultUpdateData,
      'UPDATESERVER',
    );

    expect(mockDatabase.get.member).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockDatabase.set.server).toHaveBeenCalledWith(
      DEFAULT_IDS.serverId,
      defaultUpdateData.server,
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      defaultUpdateData.server,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated server'),
    );
  });

  it('應處理部分更新', async () => {
    const partialUpdateData = {
      serverId: DEFAULT_IDS.serverId,
      server: {
        name: '只更新名稱',
      },
    };
    mockDataValidator.validate.mockResolvedValue(partialUpdateData);

    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      partialUpdateData,
    );

    expect(mockDatabase.set.server).toHaveBeenCalledWith(
      DEFAULT_IDS.serverId,
      partialUpdateData.server,
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      partialUpdateData.server,
    );
  });

  it('權限不足時應拒絕更新', async () => {
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 3, // 權限不足
      isBlocked: 0,
    });

    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Not enough permission'),
    );

    // 不應更新伺服器
    expect(mockDatabase.set.server).not.toHaveBeenCalled();
    expect(mockIoRoomEmit).not.toHaveBeenCalled();
  });

  it('應向伺服器房間廣播更新', async () => {
    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockIoInstance.to).toHaveBeenCalledWith(
      `server_${DEFAULT_IDS.serverId}`,
    );
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      defaultUpdateData.server,
    );
  });

  it('應處理不同類型的更新欄位', async () => {
    const complexUpdateData = {
      serverId: DEFAULT_IDS.serverId,
      server: {
        visibility: 'private' as const,
        type: 'entertainment' as const,
        receiveApply: false,
        slogan: '新標語',
      },
    };
    mockDataValidator.validate.mockResolvedValue(complexUpdateData);

    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      complexUpdateData,
    );

    expect(mockDatabase.set.server).toHaveBeenCalledWith(
      DEFAULT_IDS.serverId,
      complexUpdateData.server,
    );
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid update data');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '更新群組失敗，請稍後再試',
        part: 'UPDATESERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('資料庫更新失敗時應發送錯誤', async () => {
    const dbError = new Error('Database update failed');
    mockDatabase.set.server.mockRejectedValue(dbError);

    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockError).toHaveBeenCalledWith(dbError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '更新群組失敗，請稍後再試',
        part: 'UPDATESERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateServerSchema,
      defaultUpdateData,
      'UPDATESERVER',
    );
  });
});
