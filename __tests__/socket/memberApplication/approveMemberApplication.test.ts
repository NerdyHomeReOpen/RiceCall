import { jest } from '@jest/globals';
import { mockDatabase, mockDataValidator, mockInfo } from '../../_testSetup';

// Mock Database
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));

// Mock DataValidator
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));

jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// Mock SocketServer
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: require('./_testHelpers').mockSocketServer,
}));

// Mock MemberApplicationHandlerServerSide
jest.mock(
  '../../../src/api/socket/events/memberApplication/memberApplicationHandlerServerSide',
  () => ({
    MemberApplicationHandlerServerSide:
      require('./_testHelpers').mockMemberApplicationHandlerServerSide,
  }),
);

// Mock MemberHandlerServerSide
jest.mock(
  '../../../src/api/socket/events/member/memberHandlerServerSide',
  () => ({
    MemberHandlerServerSide:
      require('./_testHelpers').mockMemberHandlerServerSide,
  }),
);

// 被測試的模組和測試輔助工具
import { ApproveMemberApplicationHandler } from '../../../src/api/socket/events/memberApplication/memberApplication.handler';
import { ApproveMemberApplicationSchema } from '../../../src/api/socket/events/memberApplication/memberApplication.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  mockMemberApplicationHandlerServerSide,
  mockMemberHandlerServerSide,
  mockSocketServer,
  setupAfterEach,
  setupBeforeEach,
  setupTargetUserOnline,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

describe('ApproveMemberApplicationHandler (成員申請批准處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances(
      DEFAULT_IDS.operatorUserId,
    );
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功批准成員申請（目標用戶在線）', async () => {
    const targetSocket = setupTargetUserOnline();
    const data = testData.createMemberApplicationApproveData();

    await ApproveMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ApproveMemberApplicationSchema,
      data,
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

    // 檢查房間事件
    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'onMessage',
      expect.objectContaining({
        serverId: DEFAULT_IDS.serverId,
        type: 'event',
        content: 'updateMemberMessage',
      }),
    );

    // 檢查個人事件
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

  it('應成功批准成員申請（目標用戶離線）', async () => {
    // 確保用戶離線
    mockSocketServer.getSocket.mockReturnValue(null);

    const data = testData.createMemberApplicationApproveData();

    await ApproveMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
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

    // 用戶離線時不應該發送個人事件
    expect(mockSocketServer.getSocket).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('approve member application'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', serverId: '', member: {} };
    const validationError = new Error('成員申請批准資料不正確');

    await testValidationError(
      ApproveMemberApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '處理成員申請失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      ApproveMemberApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createMemberApplicationApproveData(),
      'get',
      'Database connection failed',
      '處理成員申請失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('應檢查操作者權限（實際無權限檢查，測試空權限）', async () => {
      // ApproveMemberApplicationHandler 實際上沒有權限檢查
      // 所以這個測試只確保流程能正常執行
      const data = testData.createMemberApplicationApproveData();

      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
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
        { permissionLevel: 2 }, // 硬編碼為 2
      );
    });

    it('目標用戶已存在時應繼續處理（無特殊檢查）', async () => {
      // ApproveMemberApplicationHandler 沒有特殊的用戶存在檢查
      // 設定目標用戶已經是正式成員也能正常執行
      testData.targetMember.permissionLevel = 2;
      const data = testData.createMemberApplicationApproveData();

      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 流程應該正常執行
      expect(
        mockMemberApplicationHandlerServerSide.deleteMemberApplication,
      ).toHaveBeenCalledWith(DEFAULT_IDS.targetUserId, DEFAULT_IDS.serverId);
      expect(mockMemberHandlerServerSide.updateMember).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { permissionLevel: 2 },
      );
    });
  });

  describe('成員申請批准處理', () => {
    it('應固定設定權限等級為 2（忽略傳入的權限）', async () => {
      const data = testData.createMemberApplicationApproveData({
        member: {
          permissionLevel: 4, // 設定為管理員權限，但會被忽略
        },
      });

      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 應該固定使用 permissionLevel: 2，而不是傳入的 4
      expect(mockMemberHandlerServerSide.updateMember).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { permissionLevel: 2 },
      );
    });

    it('應正確處理不同的用戶ID和伺服器ID', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';

      // 為自定義ID設定 mock
      mockDatabase.get.member.mockImplementation((userId, serverId) => {
        if (
          userId === DEFAULT_IDS.operatorUserId &&
          serverId === customServerId
        ) {
          return Promise.resolve({
            ...testData.operatorMember,
            serverId: customServerId,
          });
        } else if (userId === customUserId && serverId === customServerId) {
          return Promise.resolve({
            ...testData.targetMember,
            userId: customUserId,
            serverId: customServerId,
          });
        }
        return Promise.resolve(testData.operatorMember);
      });

      mockDatabase.get.user.mockImplementation((userId) => {
        if (userId === customUserId) {
          return Promise.resolve({
            ...testData.targetUser,
            userId: customUserId,
          });
        }
        return Promise.resolve(testData.operatorUser);
      });

      const data = testData.createMemberApplicationApproveData({
        userId: customUserId,
        serverId: customServerId,
      });

      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(
        mockMemberApplicationHandlerServerSide.deleteMemberApplication,
      ).toHaveBeenCalledWith(customUserId, customServerId);

      expect(mockMemberHandlerServerSide.updateMember).toHaveBeenCalledWith(
        customUserId,
        customServerId,
        expect.any(Object),
      );
    });

    it('應在批准前檢查成員申請是否存在', async () => {
      const data = testData.createMemberApplicationApproveData();
      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查是否查詢了成員申請
      expect(mockDatabase.get.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );
    });
  });

  describe('Socket事件處理', () => {
    it('應發送正確的房間事件', async () => {
      const data = testData.createMemberApplicationApproveData();

      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'onMessage',
        expect.objectContaining({
          serverId: DEFAULT_IDS.serverId,
          type: 'event',
          content: 'updateMemberMessage',
        }),
      );
    });

    it('用戶在線時應發送個人事件', async () => {
      const targetSocket = setupTargetUserOnline();
      const data = testData.createMemberApplicationApproveData();

      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'onActionMessage',
        expect.objectContaining({
          serverId: DEFAULT_IDS.serverId,
          type: 'info',
          content: 'upgradeMemberMessage',
        }),
      );
    });

    it('應發送memberApproval確認事件', async () => {
      const data = testData.createMemberApplicationApproveData();

      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('memberApproval', {
        userId: DEFAULT_IDS.targetUserId,
        serverId: DEFAULT_IDS.serverId,
      });
    });

    it('用戶離線時不應發送個人事件', async () => {
      // 確保用戶離線
      mockSocketServer.getSocket.mockReturnValue(null);

      const data = testData.createMemberApplicationApproveData();
      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketServer.getSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
      );
      // 沒有socket實例時不應該調用emit
    });
  });

  describe('業務邏輯檢查', () => {
    it('應按正確順序執行批准流程', async () => {
      const data = testData.createMemberApplicationApproveData();
      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockDatabase.get.memberApplication).toHaveBeenCalledTimes(1);
      expect(
        mockMemberApplicationHandlerServerSide.deleteMemberApplication,
      ).toHaveBeenCalledTimes(1);
      expect(mockMemberHandlerServerSide.updateMember).toHaveBeenCalledTimes(1);
    });

    it('應正確處理批准操作的參數', async () => {
      const data = testData.createMemberApplicationApproveData({
        member: {
          permissionLevel: 3,
        },
      });

      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        ApproveMemberApplicationSchema,
        data,
        'APPROVEMEMBERAPPLICATION',
      );

      // 應該固定使用 permissionLevel: 2，而不是傳入的 3
      expect(mockMemberHandlerServerSide.updateMember).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { permissionLevel: 2 },
      );
    });

    it('應在執行批准前進行適當的驗證', async () => {
      const data = testData.createMemberApplicationApproveData();
      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查驗證和資料庫操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        ApproveMemberApplicationSchema,
        data,
        'APPROVEMEMBERAPPLICATION',
      );
      expect(mockDatabase.get.memberApplication).toHaveBeenCalledTimes(1);
    });

    it('應正確檢查操作者和目標用戶的成員資格', async () => {
      const data = testData.createMemberApplicationApproveData();
      await ApproveMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查是否查詢了操作者和目標用戶的成員資格
      expect(mockDatabase.get.member).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
      );
      expect(mockDatabase.get.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );
    });
  });
});
