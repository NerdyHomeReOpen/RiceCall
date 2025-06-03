import { jest } from '@jest/globals';

// Mock SocketServer - 需要在jest.mock之前定義
const mockSocketServer = {
  getSocket: jest.fn(),
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
};

// 被測試的模組
import { MemberHandlerServerSide } from '../../../src/api/socket/events/member/memberHandlerServerSide';

// 測試設定
import { createMockSocket, mockDatabase, mockInfo } from '../../_testSetup';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: mockSocketServer,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  userId: 'user-id-123',
  serverId: 'server-id-123',
} as const;

describe('MemberHandlerServerSide (成員伺服器端處理)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 預設mock回傳值
    (mockDatabase.set.member as any).mockResolvedValue(true);
    (mockDatabase.set.userServer as any).mockResolvedValue(true);
    (mockDatabase.delete.memberApplication as any).mockResolvedValue(true);
    (mockDatabase.delete.member as any).mockResolvedValue(true);

    mockDatabase.get.userServer.mockResolvedValue({
      userId: DEFAULT_IDS.userId,
      serverId: DEFAULT_IDS.serverId,
      timestamp: Date.now(),
    });

    mockDatabase.get.serverMember.mockResolvedValue({
      userId: DEFAULT_IDS.userId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 2,
      nickname: null,
      isBlocked: 0,
    });

    mockSocketServer.getSocket.mockReturnValue(null); // 預設用戶離線
  });

  describe('createMember', () => {
    it('應成功創建成員', async () => {
      const memberPreset = {
        permissionLevel: 2,
        nickname: '新成員',
        isBlocked: 0,
      };

      await MemberHandlerServerSide.createMember(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
        memberPreset,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
        expect.objectContaining({
          ...memberPreset,
          createdAt: expect.any(Number),
        }),
      );

      expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
        { timestamp: expect.any(Number) },
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberAdd',
        expect.any(Object),
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('created member'),
      );
    });

    it('當用戶在線時應發送serverAdd事件', async () => {
      const targetSocket = createMockSocket(
        DEFAULT_IDS.userId,
        'target-socket-id',
      );
      mockSocketServer.getSocket.mockReturnValue(targetSocket);

      await MemberHandlerServerSide.createMember(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
        { permissionLevel: 2 },
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverAdd',
        expect.any(Object),
      );
    });
  });

  describe('updateMember', () => {
    it('應成功更新成員', async () => {
      const memberUpdate = {
        nickname: '更新暱稱',
        permissionLevel: 3,
      };

      await MemberHandlerServerSide.updateMember(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
        memberUpdate,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
        memberUpdate,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberUpdate',
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
        memberUpdate,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('updated member'),
      );
    });

    it('當用戶在線時應發送serverUpdate事件', async () => {
      const targetSocket = createMockSocket(
        DEFAULT_IDS.userId,
        'target-socket-id',
      );
      mockSocketServer.getSocket.mockReturnValue(targetSocket);

      const update = { nickname: '新暱稱' };
      await MemberHandlerServerSide.updateMember(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
        update,
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverUpdate',
        DEFAULT_IDS.serverId,
        update,
      );
    });
  });

  describe('deleteMemberApplication', () => {
    it('應成功刪除成員申請', async () => {
      await MemberHandlerServerSide.deleteMemberApplication(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberApplicationDelete',
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted member application'),
      );
    });
  });

  describe('deleteMember', () => {
    it('應成功刪除成員', async () => {
      await MemberHandlerServerSide.deleteMember(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockDatabase.delete.member).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberDelete',
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted member'),
      );
    });

    it('當用戶在線時應發送serverDelete事件', async () => {
      const targetSocket = createMockSocket(
        DEFAULT_IDS.userId,
        'target-socket-id',
      );
      mockSocketServer.getSocket.mockReturnValue(targetSocket);

      await MemberHandlerServerSide.deleteMember(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverDelete',
        DEFAULT_IDS.serverId,
      );
    });
  });
});
