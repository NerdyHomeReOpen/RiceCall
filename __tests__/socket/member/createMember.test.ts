import { jest } from '@jest/globals';

// Mock SocketServer - 需要在jest.mock之前定義
const mockSocketServer = {
  getSocket: jest.fn(),
};

// 被測試的模組
import { CreateMemberHandler } from '../../../src/api/socket/events/member/member.handler';

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
import { CreateMemberSchema } from '../../../src/api/socket/events/member/member.schema';

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
  ownerUserId: 'owner-user-id',
} as const;

// 測試數據
const defaultCreateData = {
  userId: DEFAULT_IDS.targetUserId,
  serverId: DEFAULT_IDS.serverId,
  member: {
    permissionLevel: 2,
    nickname: null,
    isBlocked: 0,
  },
};

describe('CreateMemberHandler (成員創建處理)', () => {
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
    mockDatabase.get.server.mockResolvedValue({
      serverId: DEFAULT_IDS.serverId,
      ownerId: DEFAULT_IDS.ownerUserId,
      name: '測試伺服器',
    });

    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 5, // 預設為伺服器管理員
      nickname: null,
      isBlocked: 0,
    });

    (mockDatabase.set.member as any).mockResolvedValue(true);
    (mockDatabase.set.userServer as any).mockResolvedValue(true);

    mockDatabase.get.userServer.mockResolvedValue({
      userId: DEFAULT_IDS.targetUserId,
      serverId: DEFAULT_IDS.serverId,
      timestamp: Date.now(),
    });

    mockDatabase.get.serverMember.mockResolvedValue({
      userId: DEFAULT_IDS.targetUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 2,
      nickname: null,
      isBlocked: 0,
    });

    mockDataValidator.validate.mockResolvedValue(defaultCreateData);
    mockSocketServer.getSocket.mockReturnValue(null); // 預設用戶離線
  });

  it('應成功創建新成員（操作者為其他人）', async () => {
    const targetSocket = createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServer.getSocket.mockReturnValue(targetSocket);

    await CreateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateMemberSchema,
      defaultCreateData,
      'CREATEMEMBER',
    );

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        permissionLevel: 2,
        nickname: null,
        isBlocked: 0,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      { timestamp: expect.any(Number) },
    );

    expect(targetSocket.emit).toHaveBeenCalledWith(
      'serverAdd',
      expect.any(Object),
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberAdd',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created member'),
    );
  });

  it('應成功創建自己的成員（非擁有者）', async () => {
    const selfCreateData = {
      ...defaultCreateData,
      userId: DEFAULT_IDS.operatorUserId,
      member: { permissionLevel: 1 }, // 必須是訪客
    };
    mockDataValidator.validate.mockResolvedValue(selfCreateData);

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await CreateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      selfCreateData,
    );

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        permissionLevel: 1,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created member'),
    );
  });

  it('應成功創建自己的成員（擁有者）', async () => {
    const ownerCreateData = {
      ...defaultCreateData,
      userId: DEFAULT_IDS.ownerUserId,
      member: { permissionLevel: 6 }, // 必須是擁有者權限
    };
    mockDataValidator.validate.mockResolvedValue(ownerCreateData);

    mockSocketInstance.data.userId = DEFAULT_IDS.ownerUserId;

    await CreateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      ownerCreateData,
    );

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.ownerUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        permissionLevel: 6,
        createdAt: expect.any(Number),
      }),
    );
  });

  it('操作者權限不足時應拒絕（權限 < 5）', async () => {
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 3, // 權限不足
    });

    await CreateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Not enough permission'),
    );
  });

  it('不能給予比自己更高的權限', async () => {
    const highPermissionData = {
      ...defaultCreateData,
      member: { permissionLevel: 6 }, // 比操作者的5更高
    };
    mockDataValidator.validate.mockResolvedValue(highPermissionData);

    await CreateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      highPermissionData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Permission level too high'),
    );
  });

  it('非擁有者創建自己成員時權限必須是1', async () => {
    const invalidSelfData = {
      ...defaultCreateData,
      userId: DEFAULT_IDS.operatorUserId,
      member: { permissionLevel: 2 }, // 應該是1
    };
    mockDataValidator.validate.mockResolvedValue(invalidSelfData);

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await CreateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      invalidSelfData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Permission level must be 1'),
    );
  });

  it('擁有者創建自己成員時權限必須是6', async () => {
    const invalidOwnerData = {
      ...defaultCreateData,
      userId: DEFAULT_IDS.ownerUserId,
      member: { permissionLevel: 5 }, // 應該是6
    };
    mockDataValidator.validate.mockResolvedValue(invalidOwnerData);

    mockSocketInstance.data.userId = DEFAULT_IDS.ownerUserId;

    await CreateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      invalidOwnerData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Permission level must be 6'),
    );
  });

  it('當目標用戶離線時不應發送serverAdd事件', async () => {
    mockSocketServer.getSocket.mockReturnValue(null);

    await CreateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCreateData,
    );

    expect(mockDatabase.set.member).toHaveBeenCalled();
    expect(mockIoRoomEmit).toHaveBeenCalled(); // 仍然發送到房間
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created member'),
    );
  });
});
