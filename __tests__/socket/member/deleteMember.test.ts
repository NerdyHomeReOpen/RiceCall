import { jest } from '@jest/globals';

// Mock SocketServer - 需要在jest.mock之前定義
const mockSocketServer = {
  getSocket: jest.fn(),
};

// 被測試的模組
import { DeleteMemberHandler } from '../../../src/api/socket/events/member/member.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockInfo,
  mockIoRoomEmit,
  mockWarn,
} from '../../_testSetup';

// 錯誤類型和Schema
import { DeleteMemberSchema } from '../../../src/api/socket/events/member/member.schema';

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
  serverId: 'server-id-123',
} as const;

// 測試數據
const defaultDeleteData = {
  userId: DEFAULT_IDS.targetUserId,
  serverId: DEFAULT_IDS.serverId,
};

describe('DeleteMemberHandler (成員刪除處理)', () => {
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
    mockDatabase.get.member.mockImplementation((userId) => {
      if (userId === DEFAULT_IDS.operatorUserId) {
        return Promise.resolve({
          userId: DEFAULT_IDS.operatorUserId,
          serverId: DEFAULT_IDS.serverId,
          permissionLevel: 5, // 操作者權限
          nickname: null,
          isBlocked: 0,
        });
      } else {
        return Promise.resolve({
          userId: DEFAULT_IDS.targetUserId,
          serverId: DEFAULT_IDS.serverId,
          permissionLevel: 2, // 目標用戶權限
          nickname: '用戶暱稱',
          isBlocked: 0,
        });
      }
    });

    (mockDatabase.delete.member as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultDeleteData);
    mockSocketServer.getSocket.mockReturnValue(null); // 預設用戶離線
  });

  it('應成功刪除其他用戶的成員', async () => {
    const targetSocket = createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServer.getSocket.mockReturnValue(targetSocket);

    await DeleteMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteMemberSchema,
      defaultDeleteData,
      'DELETEMEMBER',
    );

    expect(mockDatabase.delete.member).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberDelete',
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );

    expect(targetSocket.emit).toHaveBeenCalledWith(
      'serverDelete',
      DEFAULT_IDS.serverId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted member'),
    );
  });

  it('操作者權限不足時應拒絕（權限 < 3）', async () => {
    mockDatabase.get.member.mockImplementation((userId) => {
      if (userId === DEFAULT_IDS.operatorUserId) {
        return Promise.resolve({
          userId: DEFAULT_IDS.operatorUserId,
          serverId: DEFAULT_IDS.serverId,
          permissionLevel: 2, // 權限不足
        });
      }
      return Promise.resolve({
        userId: DEFAULT_IDS.targetUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 1, // 目標用戶權限更低，確保不觸發其他錯誤
      });
    });

    await DeleteMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Not enough permission'),
    );
  });

  it('操作者權限不能低於目標用戶', async () => {
    mockDatabase.get.member.mockImplementation((userId) => {
      if (userId === DEFAULT_IDS.operatorUserId) {
        return Promise.resolve({
          userId: DEFAULT_IDS.operatorUserId,
          serverId: DEFAULT_IDS.serverId,
          permissionLevel: 3, // 操作者權限
        });
      }
      return Promise.resolve({
        userId: DEFAULT_IDS.targetUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 4, // 目標用戶權限更高
      });
    });

    await DeleteMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Permission lower than the target'),
    );
  });

  it('不能刪除群組創建者的成員', async () => {
    mockDatabase.get.member.mockImplementation((userId) => {
      if (userId === DEFAULT_IDS.operatorUserId) {
        return Promise.resolve({
          userId: DEFAULT_IDS.operatorUserId,
          serverId: DEFAULT_IDS.serverId,
          permissionLevel: 5,
        });
      }
      return Promise.resolve({
        userId: DEFAULT_IDS.targetUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 6, // 群組創建者
      });
    });

    await DeleteMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining("Cannot delete group creator's member"),
    );
  });

  it('不能刪除自己的成員', async () => {
    const selfDeleteData = {
      ...defaultDeleteData,
      userId: DEFAULT_IDS.operatorUserId,
    };
    mockDataValidator.validate.mockResolvedValue(selfDeleteData);

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await DeleteMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      selfDeleteData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot delete self member'),
    );
  });

  it('當目標用戶離線時不應發送個人事件', async () => {
    mockSocketServer.getSocket.mockReturnValue(null);

    await DeleteMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockDatabase.delete.member).toHaveBeenCalled();
    expect(mockIoRoomEmit).toHaveBeenCalled(); // 仍然發送到房間
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted member'),
    );
  });
});
