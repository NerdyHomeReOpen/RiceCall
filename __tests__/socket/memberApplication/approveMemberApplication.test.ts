import { jest } from '@jest/globals';

// Mock SocketServer - 需要在jest.mock之前定義
const mockSocketServer = {
  getSocket: jest.fn(),
};

// Mock MemberApplicationHandlerServerSide - 需要在jest.mock之前定義
const mockMemberApplicationHandlerServerSide = {
  deleteMemberApplication: jest.fn(),
};

// Mock MemberHandlerServerSide - 需要在jest.mock之前定義
const mockMemberHandlerServerSide = {
  updateMember: jest.fn(),
};

// 被測試的模組
import { ApproveMemberApplicationHandler } from '../../../src/api/socket/events/memberApplication/memberApplication.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockInfo,
  mockIoRoomEmit,
} from '../../_testSetup';

// 錯誤類型和Schema
import { ApproveMemberApplicationSchema } from '../../../src/api/socket/events/memberApplication/memberApplication.schema';

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
jest.mock(
  '../../../src/api/socket/events/memberApplication/memberApplicationHandlerServerSide',
  () => ({
    MemberApplicationHandlerServerSide: mockMemberApplicationHandlerServerSide,
  }),
);
jest.mock(
  '../../../src/api/socket/events/member/memberHandlerServerSide',
  () => ({
    MemberHandlerServerSide: mockMemberHandlerServerSide,
  }),
);

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
} as const;

// 測試數據
const defaultApproveData = {
  userId: DEFAULT_IDS.targetUserId,
  serverId: DEFAULT_IDS.serverId,
  member: {
    permissionLevel: 2,
  },
};

describe('ApproveMemberApplicationHandler (成員申請批准處理)', () => {
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
    mockDatabase.get.user.mockImplementation((userId) => {
      return Promise.resolve({
        userId,
        username: `user-${userId}`,
        displayName: `用戶-${userId}`,
      });
    });

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
          permissionLevel: 1, // 目標用戶為訪客
          nickname: null,
          isBlocked: 0,
        });
      }
    });

    mockDatabase.get.memberApplication.mockResolvedValue({
      userId: DEFAULT_IDS.targetUserId,
      serverId: DEFAULT_IDS.serverId,
      description: '申請加入伺服器',
      createdAt: Date.now(),
    });

    mockDataValidator.validate.mockResolvedValue(defaultApproveData);
    mockSocketServer.getSocket.mockReturnValue(null); // 預設用戶離線
    (
      mockMemberApplicationHandlerServerSide.deleteMemberApplication as any
    ).mockResolvedValue(undefined);
    (mockMemberHandlerServerSide.updateMember as any).mockResolvedValue(
      undefined,
    );
  });

  it('應成功批准成員申請', async () => {
    const targetSocket = createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServer.getSocket.mockReturnValue(targetSocket);

    await ApproveMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultApproveData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ApproveMemberApplicationSchema,
      defaultApproveData,
      'APPROVEMEMBERAPPLICATION',
    );

    expect(mockDatabase.get.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );

    expect(
      mockMemberApplicationHandlerServerSide.deleteMemberApplication,
    ).toHaveBeenCalledWith(DEFAULT_IDS.targetUserId, DEFAULT_IDS.serverId);

    expect(mockMemberHandlerServerSide.updateMember).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      { permissionLevel: 2 },
    );

    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'onMessage',
      expect.objectContaining({
        serverId: DEFAULT_IDS.serverId,
        type: 'event',
        content: 'updateMemberMessage',
      }),
    );

    expect(targetSocket.emit).toHaveBeenCalledWith(
      'onActionMessage',
      expect.objectContaining({
        serverId: DEFAULT_IDS.serverId,
        type: 'info',
        content: 'upgradeMemberMessage',
      }),
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith('memberApproval', {
      userId: DEFAULT_IDS.targetUserId,
      serverId: DEFAULT_IDS.serverId,
    });

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('approve member application'),
    );
  });

  it('當目標用戶離線時不應發送個人事件', async () => {
    mockSocketServer.getSocket.mockReturnValue(null);

    await ApproveMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultApproveData,
    );

    expect(
      mockMemberApplicationHandlerServerSide.deleteMemberApplication,
    ).toHaveBeenCalled();
    expect(mockMemberHandlerServerSide.updateMember).toHaveBeenCalled();
    expect(mockIoRoomEmit).toHaveBeenCalled(); // 仍然發送到房間
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'memberApproval',
      expect.any(Object),
    );
  });

  it('當成員申請不存在時應處理錯誤', async () => {
    mockDatabase.get.memberApplication.mockResolvedValue(null);

    await ApproveMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultApproveData,
    );

    // 由於try-catch處理錯誤，應該emit error事件而不是拋出
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.any(Object),
    );
  });

  it('應包含操作者和目標用戶的完整資訊', async () => {
    await ApproveMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultApproveData,
    );

    // 檢查emit的事件包含正確的用戶資訊
    const onMessageCall = mockIoRoomEmit.mock.calls.find(
      (call) => call[0] === 'onMessage',
    );
    expect(onMessageCall).toBeTruthy();

    if (onMessageCall) {
      const messageData = onMessageCall[1] as any;
      expect(messageData.sender).toEqual(
        expect.objectContaining({
          userId: DEFAULT_IDS.operatorUserId,
          username: `user-${DEFAULT_IDS.operatorUserId}`,
        }),
      );
      expect(messageData.receiver).toEqual(
        expect.objectContaining({
          userId: DEFAULT_IDS.targetUserId,
          username: `user-${DEFAULT_IDS.targetUserId}`,
        }),
      );
    }
  });

  it('應正確呼叫資料驗證器', async () => {
    await ApproveMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultApproveData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ApproveMemberApplicationSchema,
      defaultApproveData,
      'APPROVEMEMBERAPPLICATION',
    );
  });
});
