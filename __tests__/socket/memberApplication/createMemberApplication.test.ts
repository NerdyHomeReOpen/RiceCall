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

// 被測試的模組和測試輔助工具
import { CreateMemberApplicationHandler } from '../../../src/api/socket/events/memberApplication/memberApplication.handler';
import { CreateMemberApplicationSchema } from '../../../src/api/socket/events/memberApplication/memberApplication.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

describe('CreateMemberApplicationHandler (成員申請創建處理)', () => {
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

  it('應成功創建成員申請（操作者為自己）', async () => {
    // 設定為訪客身份
    testData.operatorMember.permissionLevel = 1;
    const data = testData.createMemberApplicationCreateData({
      userId: DEFAULT_IDS.operatorUserId,
    });

    await CreateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateMemberApplicationSchema,
      data,
      'CREATEMEMBERAPPLICATION',
    );

    expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        description: '申請加入伺服器',
        createdAt: expect.any(Number),
      }),
    );

    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberApplicationAdd',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created member application'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', serverId: '', memberApplication: {} };
    const validationError = new Error('成員申請資料不正確');

    await testValidationError(
      CreateMemberApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '創建成員申請失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    testData.operatorMember.permissionLevel = 1; // 設定為訪客
    const data = testData.createMemberApplicationCreateData({
      userId: DEFAULT_IDS.operatorUserId,
    });

    await testDatabaseError(
      CreateMemberApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      data,
      'set',
      'Database connection failed',
      '創建成員申請失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('不能為其他用戶創建申請', async () => {
      const otherUserData = testData.createMemberApplicationCreateData({
        userId: 'other-user-id',
      });
      mockDataValidator.validate.mockResolvedValue(otherUserData);

      await CreateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        otherUserData,
      );

      expect(mockDatabase.set.memberApplication).not.toHaveBeenCalled();

      const mockWarnFromSetup = require('../../_testSetup').mockWarn;
      expect(mockWarnFromSetup).toHaveBeenCalledWith(
        expect.stringContaining('Cannot create non-self member application'),
      );
    });

    it('非訪客不能創建成員申請', async () => {
      // 設定操作者為已有成員權限
      testData.operatorMember.permissionLevel = 2;
      const data = testData.createMemberApplicationCreateData({
        userId: DEFAULT_IDS.operatorUserId,
      });

      await CreateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.memberApplication).not.toHaveBeenCalled();

      const mockWarnFromSetup = require('../../_testSetup').mockWarn;
      expect(mockWarnFromSetup).toHaveBeenCalledWith(
        expect.stringContaining(
          'Cannot create member application as non-guest',
        ),
      );
    });
  });

  describe('成員申請資料處理', () => {
    it('應包含創建時間戳', async () => {
      testData.operatorMember.permissionLevel = 1; // 設定為訪客
      const data = testData.createMemberApplicationCreateData({
        userId: DEFAULT_IDS.operatorUserId,
      });

      await CreateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const setMemberApplicationCall =
        mockDatabase.set.memberApplication.mock.calls[0];
      const memberApplicationData = setMemberApplicationCall[2];

      expect(memberApplicationData.createdAt).toBeGreaterThan(0);
      expect(typeof memberApplicationData.createdAt).toBe('number');
    });

    it('應正確處理自定義描述', async () => {
      testData.operatorMember.permissionLevel = 1; // 設定為訪客
      const customDescription = '我想加入這個伺服器，請批准我的申請';
      const data = testData.createMemberApplicationCreateData({
        userId: DEFAULT_IDS.operatorUserId,
        memberApplication: {
          description: customDescription,
        },
      });

      await CreateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        expect.objectContaining({
          description: customDescription,
        }),
      );
    });

    it('應正確處理不同的伺服器ID', async () => {
      testData.operatorMember.permissionLevel = 1; // 設定為訪客
      const customServerId = 'custom-server-id';
      const data = testData.createMemberApplicationCreateData({
        userId: DEFAULT_IDS.operatorUserId,
        serverId: customServerId,
      });

      await CreateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        customServerId,
        expect.any(Object),
      );
    });
  });

  describe('Socket事件處理', () => {
    it('應發送正確的房間事件', async () => {
      testData.operatorMember.permissionLevel = 1; // 設定為訪客
      const data = testData.createMemberApplicationCreateData({
        userId: DEFAULT_IDS.operatorUserId,
      });

      await CreateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'serverMemberApplicationAdd',
        expect.any(Object),
      );
    });

    it('應在socket事件中包含正確的申請資料', async () => {
      testData.operatorMember.permissionLevel = 1; // 設定為訪客
      const data = testData.createMemberApplicationCreateData({
        userId: DEFAULT_IDS.operatorUserId,
      });

      await CreateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      const emitCall = mockIoRoomEmit.mock.calls.find(
        (call: any[]) => call[0] === 'serverMemberApplicationAdd',
      );

      expect(emitCall).toBeDefined();
      if (emitCall) {
        expect(emitCall[1]).toBeDefined();
      }
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      testData.operatorMember.permissionLevel = 1; // 設定為訪客
      const data = testData.createMemberApplicationCreateData({
        userId: DEFAULT_IDS.operatorUserId,
      });

      await CreateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        CreateMemberApplicationSchema,
        data,
        'CREATEMEMBERAPPLICATION',
      );
    });

    it('應按正確順序執行創建流程', async () => {
      testData.operatorMember.permissionLevel = 1; // 設定為訪客
      const data = testData.createMemberApplicationCreateData({
        userId: DEFAULT_IDS.operatorUserId,
      });

      await CreateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockDatabase.set.memberApplication).toHaveBeenCalledTimes(1);
    });
  });
});
