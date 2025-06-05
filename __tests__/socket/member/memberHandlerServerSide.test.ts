import { jest } from '@jest/globals';
import { mockDatabase, mockInfo } from '../../_testSetup';

// Mock Database
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));

// Mock SocketServer
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: require('./_testHelpers').mockSocketServer,
}));

// 被測試的模組和測試輔助工具
import { MemberHandlerServerSide } from '../../../src/api/socket/events/member/memberHandlerServerSide';
import {
  createDefaultTestData,
  DEFAULT_IDS,
  mockSocketServer,
  setupAfterEach,
  setupBeforeEach,
  setupTargetUserOnline,
} from './_testHelpers';

describe('MemberHandlerServerSide (成員伺服器端處理)', () => {
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 設定通用的 beforeEach（不需要 socket 實例）
    jest.clearAllMocks();

    // 預設mock回傳值
    (mockDatabase.set.member as any).mockResolvedValue(true);
    (mockDatabase.set.userServer as any).mockResolvedValue(true);
    (mockDatabase.delete.memberApplication as any).mockResolvedValue(true);
    (mockDatabase.delete.member as any).mockResolvedValue(true);

    mockDatabase.get.userServer.mockResolvedValue(testData.userServer as any);
    mockDatabase.get.serverMember.mockResolvedValue(testData.serverMember as any);

    mockSocketServer.getSocket.mockReturnValue(null); // 預設用戶離線
  });

  afterEach(() => {
    setupAfterEach();
  });

  describe('createMember', () => {
    it('應成功創建成員', async () => {
      const memberPreset = {
        permissionLevel: 2,
        nickname: '新成員',
        isBlocked: 0,
      };

      await MemberHandlerServerSide.createMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        memberPreset,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        expect.objectContaining({
          ...memberPreset,
          createdAt: expect.any(Number),
        }),
      );

      expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
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
      const targetSocket = setupTargetUserOnline();

      await MemberHandlerServerSide.createMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { permissionLevel: 2 },
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverAdd',
        expect.any(Object),
      );
    });

    it('應正確處理自定義成員屬性', async () => {
      const memberPreset = {
        permissionLevel: 4,
        nickname: '管理員',
        isBlocked: 1,
      };

      await MemberHandlerServerSide.createMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        memberPreset,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        expect.objectContaining({
          permissionLevel: 4,
          nickname: '管理員',
          isBlocked: 1,
          createdAt: expect.any(Number),
        }),
      );
    });

    it('應為不同用戶和伺服器創建成員', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';

      await MemberHandlerServerSide.createMember(
        customUserId,
        customServerId,
        { permissionLevel: 2 },
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        customUserId,
        customServerId,
        expect.any(Object),
      );

      expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
        customUserId,
        customServerId,
        expect.any(Object),
      );
    });

    it('應包含創建時間戳', async () => {
      await MemberHandlerServerSide.createMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { permissionLevel: 2 },
      );

      const setMemberCall = mockDatabase.set.member.mock.calls[0];
      const memberData = setMemberCall[2];

      expect(memberData.createdAt).toBeGreaterThan(0);
      expect(typeof memberData.createdAt).toBe('number');
    });
  });

  describe('updateMember', () => {
    it('應成功更新成員', async () => {
      const memberUpdate = {
        nickname: '更新暱稱',
        permissionLevel: 3,
      };

      await MemberHandlerServerSide.updateMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        memberUpdate,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        memberUpdate,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberUpdate',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        memberUpdate,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('updated member'),
      );
    });

    it('當用戶在線時應發送serverUpdate事件', async () => {
      const targetSocket = setupTargetUserOnline();

      const update = { nickname: '新暱稱' };
      await MemberHandlerServerSide.updateMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        update,
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverUpdate',
        DEFAULT_IDS.serverId,
        update,
      );
    });

    it('應能只更新部分屬性', async () => {
      const partialUpdate = { nickname: '只更新暱稱' };

      await MemberHandlerServerSide.updateMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        partialUpdate,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        partialUpdate,
      );
    });

    it('應正確處理權限更新', async () => {
      const permissionUpdate = { permissionLevel: 5 };

      await MemberHandlerServerSide.updateMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        permissionUpdate,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        permissionUpdate,
      );
    });

    it('應處理不同用戶和伺服器的更新', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';
      const update = { isBlocked: 1 };

      await MemberHandlerServerSide.updateMember(
        customUserId,
        customServerId,
        update,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        customUserId,
        customServerId,
        update,
      );
    });
  });

  describe('deleteMemberApplication', () => {
    it('應成功刪除成員申請', async () => {
      await MemberHandlerServerSide.deleteMemberApplication(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberApplicationDelete',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );
    });

    it('應處理不同用戶和伺服器的申請刪除', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';

      await MemberHandlerServerSide.deleteMemberApplication(
        customUserId,
        customServerId,
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        customUserId,
        customServerId,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${customServerId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberApplicationDelete',
        customUserId,
        customServerId,
      );
    });
  });

  describe('deleteMember', () => {
    it('應成功刪除成員', async () => {
      await MemberHandlerServerSide.deleteMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      expect(mockDatabase.delete.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberDelete',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );
    });

    it('當用戶在線時應發送serverDelete事件', async () => {
      const targetSocket = setupTargetUserOnline();

      await MemberHandlerServerSide.deleteMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverDelete',
        DEFAULT_IDS.serverId,
      );
    });

    it('應處理不同用戶和伺服器的成員刪除', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';

      await MemberHandlerServerSide.deleteMember(
        customUserId,
        customServerId,
      );

      expect(mockDatabase.delete.member).toHaveBeenCalledWith(
        customUserId,
        customServerId,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${customServerId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberDelete',
        customUserId,
        customServerId,
      );
    });
  });

  describe('Socket事件處理', () => {
    it('應正確發送房間事件', async () => {
      await MemberHandlerServerSide.createMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { permissionLevel: 2 },
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberAdd',
        expect.any(Object),
      );
    });

    it('應在用戶離線時只發送房間事件', async () => {
      // 確保用戶離線
      mockSocketServer.getSocket.mockReturnValue(null);

      await MemberHandlerServerSide.updateMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { nickname: '測試' },
      );

      // 應該發送房間事件
      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberUpdate',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { nickname: '測試' },
      );

      // 但不應該發送個人事件
      expect(mockSocketServer.getSocket).toHaveBeenCalledWith(DEFAULT_IDS.targetUserId);
    });

    it('應在用戶在線時發送個人事件和房間事件', async () => {
      const targetSocket = setupTargetUserOnline();

      await MemberHandlerServerSide.deleteMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      // 應該發送房間事件
      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberDelete',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      // 也應該發送個人事件
      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverDelete',
        DEFAULT_IDS.serverId,
      );
    });
  });

  describe('資料庫操作', () => {
    it('createMember 應設定 UserServer 記錄', async () => {
      await MemberHandlerServerSide.createMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { permissionLevel: 2 },
      );

      expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { timestamp: expect.any(Number) },
      );
    });

    it('應正確處理資料庫操作參數', async () => {
      const memberData = {
        permissionLevel: 3,
        nickname: '測試成員',
        isBlocked: 0,
      };

      await MemberHandlerServerSide.createMember(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        memberData,
      );

      const setMemberCall = mockDatabase.set.member.mock.calls[0];
      expect(setMemberCall[0]).toBe(DEFAULT_IDS.targetUserId);
      expect(setMemberCall[1]).toBe(DEFAULT_IDS.serverId);
      expect(setMemberCall[2]).toMatchObject(memberData);
    });
  });
});
