import { jest } from '@jest/globals';

// Mock SocketServer - 需要在jest.mock之前定義
const mockSocketServer = {
  getSocket: jest.fn(),
};

// 被測試的模組
import { UpdateMemberHandler } from '../../../src/api/socket/events/member/member.handler';

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
import { UpdateMemberSchema } from '../../../src/api/socket/events/member/member.schema';

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
const defaultUpdateData = {
  userId: DEFAULT_IDS.targetUserId,
  serverId: DEFAULT_IDS.serverId,
  member: {
    nickname: '新暱稱',
    permissionLevel: 2,
  },
};

describe('UpdateMemberHandler (成員更新處理)', () => {
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
          nickname: '舊暱稱',
          isBlocked: 0,
        });
      }
    });

    mockDatabase.get.user.mockImplementation((userId) => {
      return Promise.resolve({
        userId,
        username: `user-${userId}`,
        displayName: `用戶-${userId}`,
      });
    });

    (mockDatabase.set.member as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultUpdateData);
    mockSocketServer.getSocket.mockReturnValue(null); // 預設用戶離線
  });

  it('應成功更新其他用戶的成員資料', async () => {
    const targetSocket = createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServer.getSocket.mockReturnValue(targetSocket);

    await UpdateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateMemberSchema,
      defaultUpdateData,
      'UPDATEMEMBER',
    );

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      defaultUpdateData.member,
    );

    expect(targetSocket.emit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      defaultUpdateData.member,
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberUpdate',
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      defaultUpdateData.member,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated member'),
    );
  });

  it('應成功更新自己的成員資料（移除成員身份）', async () => {
    const selfRemovalData = {
      ...defaultUpdateData,
      userId: DEFAULT_IDS.operatorUserId,
      member: { permissionLevel: 1 }, // 移除成員身份
    };
    mockDataValidator.validate.mockResolvedValue(selfRemovalData);

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await UpdateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      selfRemovalData,
    );

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      { permissionLevel: 1 },
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated member'),
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
        permissionLevel: 1, // 目標用戶權限更低
      });
    });

    const simpleUpdateData = {
      ...defaultUpdateData,
      member: { isBlocked: 1 }, // 更新封鎖狀態，不涉及nickname和權限
    };
    mockDataValidator.validate.mockResolvedValue(simpleUpdateData);

    await UpdateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      simpleUpdateData,
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

    const simpleUpdateData = {
      ...defaultUpdateData,
      member: { permissionLevel: 2 }, // 只更新權限，避免nickname問題
    };
    mockDataValidator.validate.mockResolvedValue(simpleUpdateData);

    await UpdateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      simpleUpdateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Permission lower than the target'),
    );
  });

  it('不能給予比自己更高的權限', async () => {
    const highPermissionData = {
      ...defaultUpdateData,
      member: { permissionLevel: 6 }, // 比操作者的5更高
    };
    mockDataValidator.validate.mockResolvedValue(highPermissionData);

    await UpdateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      highPermissionData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Permission level too high'),
    );
  });

  it('不能編輯自己的權限（非移除成員身份）', async () => {
    const invalidSelfData = {
      ...defaultUpdateData,
      userId: DEFAULT_IDS.operatorUserId,
      member: { permissionLevel: 3 }, // 非1的權限更新
    };
    mockDataValidator.validate.mockResolvedValue(invalidSelfData);

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await UpdateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      invalidSelfData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot edit self permission'),
    );
  });

  it('不能編輯群組創建者的權限', async () => {
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

    await UpdateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining("Cannot edit group creator's permission"),
    );
  });

  it('權限不足時不能編輯訪客權限', async () => {
    mockDatabase.get.member.mockImplementation((userId) => {
      if (userId === DEFAULT_IDS.operatorUserId) {
        return Promise.resolve({
          userId: DEFAULT_IDS.operatorUserId,
          serverId: DEFAULT_IDS.serverId,
          permissionLevel: 3, // 權限 < 5
        });
      }
      return Promise.resolve({
        userId: DEFAULT_IDS.targetUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 1, // 訪客
      });
    });

    const guestUpdateData = {
      ...defaultUpdateData,
      member: { permissionLevel: 2 }, // 只更新權限，避免nickname問題
    };
    mockDataValidator.validate.mockResolvedValue(guestUpdateData);

    await UpdateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      guestUpdateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot edit guest permission'),
    );
  });

  it('當目標用戶離線時不應發送個人事件', async () => {
    mockSocketServer.getSocket.mockReturnValue(null);

    await UpdateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDatabase.set.member).toHaveBeenCalled();
    expect(mockIoRoomEmit).toHaveBeenCalled(); // 仍然發送到房間
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated member'),
    );
  });
});
