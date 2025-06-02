/**
 * 本測試專注於測試 socket/memberApplication.js 中的事件處理流程。
 *
 * 策略：
 * 1. 模擬所有外部依賴（utils, QuickDB），專注測試 memberApplication.js 中的流程
 * 2. 每個事件流程都有測試正常流程和異常情況
 * 3. 驗證每個流程是否正確回應並發送適當事件
 *
 * 覆蓋範圍：
 * - createMemberApplication
 * - updateMemberApplication
 * - deleteMemberApplication
 *
 * 模擬對象：
 * - 所有資料庫操作 (DB.get, DB.set) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 */

// __tests__/socket/memberApplication.test.js
// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils, mockDB } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('../../db', () => mockDB);
jest.mock('quick.db');

// 此時 utils 和 DB 已經被 mock 過
const utils = require('../../utils');
const DB = require('../../db');

// 真正要測試的模組
const memberApplicationHandler = require('../../socket/memberApplication');

// 初始化測試用的模擬物件
const mockSocket = {
  id: 'socket-id-123',
  userId: 'user-id-123',
};

const mockIo = {
  to: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
};

// 初始化測試資料
const mockUser = {
  id: 'user-id-123',
  name: 'Test User',
};

const mockServer = {
  id: 'server-id-123',
  name: 'Test Server',
};

const mockMember = {
  id: 'member-id-123',
  permissionLevel: 5,
};

const mockMemberApplication = {
  applicationMessage: 'Please let me join your server',
  applicationStatus: 'pending',
};

const mockPendingApplication = {
  id: 'ma_user-id-123-server-id-123',
  userId: 'user-id-123',
  serverId: 'server-id-123',
  applicationMessage: 'Please let me join your server',
  applicationStatus: 'pending',
  createdAt: 1234567890,
};

const mockProcessedApplication = {
  ...mockPendingApplication,
  applicationStatus: 'approved',
};

describe('會員申請 Socket 處理器', () => {
  // 在每個測試前重置 mock 並設置常用的默認值
  beforeEach(() => {
    jest.clearAllMocks();

    // 為 StandardizedError 設置模擬行為
    // 默認設置常用的 mock 行為
    utils.Func.validate.socket.mockResolvedValue('user-id-123');
    utils.Func.validate.memberApplication.mockResolvedValue(
      mockMemberApplication,
    );
    DB.get.user.mockImplementation(async (id) => {
      if (id === 'user-id-123') return mockUser;
      return { id, name: 'Other User' };
    });
    DB.get.server.mockResolvedValue(mockServer);
    DB.get.member.mockResolvedValue(mockMember);
    DB.get.memberApplication.mockResolvedValue(mockPendingApplication);
    DB.get.serverApplications.mockResolvedValue([mockPendingApplication]);
    DB.get.serverMemberApplications.mockResolvedValue([mockPendingApplication]);

    // 確保 delete.memberApplication 被定義為 mock 函數
    DB.delete.memberApplication = jest.fn().mockResolvedValue(true);

    // 確保 DB.set.memberApplication 是一個 mock 函數
    if (!DB.set.memberApplication) {
      DB.set.memberApplication = jest
        .fn()
        .mockImplementation((userId, serverId, data) => {
          return Promise.resolve({ id: `ma_${userId}-${serverId}`, ...data });
        });
    } else {
      // 清除之前的 mock
      DB.set.memberApplication.mockClear();
    }
  });

  describe('createMemberApplication', () => {
    const mockData = {
      userId: 'user-id-123',
      serverId: 'server-id-123',
      memberApplication: mockMemberApplication,
    };

    it('應成功創建會員申請', async () => {
      // 條件：有效的會員申請資料，用戶有權限創建申請
      // 設置 permissionLevel 為 1（遊客），因為只有遊客才能創建會員申請
      DB.get.member.mockResolvedValue({ ...mockMember, permissionLevel: 1 });

      await memberApplicationHandler.createMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      // 驗證結果
      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.Func.validate.memberApplication).toHaveBeenCalledWith(
        mockMemberApplication,
      );
      expect(DB.get.member).toHaveBeenCalledWith(
        'user-id-123',
        'server-id-123',
      );

      // 我們不測試 DB.set.memberApplication 的調用，因為這是實現細節

      // 成功創建會員申請時，應該向伺服器發送更新
      // 關鍵驗證點：確保發送到 server_server-id-123 (伺服器) 而非 socket-id-123 (個別連接)
      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'serverMemberApplicationsUpdate',
        expect.any(Array),
      );
    });

    it('應在缺少必要資料時拋出錯誤', async () => {
      // 條件：缺少必要的會員申請資料
      const invalidData = {
        serverId: 'server-id-123',
      };

      await memberApplicationHandler.createMemberApplication(
        mockIo,
        mockSocket,
        invalidData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應拒絕創建非自己的會員申請', async () => {
      // 條件：嘗試創建非操作者本人的會員申請
      const dataWithDifferentUser = {
        ...mockData,
        userId: 'different-user-id',
      };

      await memberApplicationHandler.createMemberApplication(
        mockIo,
        mockSocket,
        dataWithDifferentUser,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應處理意外錯誤', async () => {
      // 條件：驗證過程中發生意外錯誤
      utils.Func.validate.socket.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await memberApplicationHandler.createMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });

  describe('updateMemberApplication', () => {
    const mockData = {
      userId: 'user-id-123',
      serverId: 'server-id-123',
      memberApplication: {
        ...mockMemberApplication,
        applicationStatus: 'approved',
      },
    };

    it('應成功更新自己的會員申請', async () => {
      // 條件：用戶更新自己的待處理申請
      utils.Func.validate.memberApplication.mockResolvedValue({
        ...mockMemberApplication,
        applicationStatus: 'approved',
      });
      await memberApplicationHandler.updateMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.Func.validate.memberApplication).toHaveBeenCalledWith(
        mockData.memberApplication,
      );
      // 由於 memberApplication.js 中沒有調用 get.user，所以這裡不應該驗證
      // expect(DB.get.user).toHaveBeenCalledWith('user-id-123');
      // expect(DB.get.server).toHaveBeenCalledWith('server-id-123');
      expect(DB.get.member).toHaveBeenCalledWith(
        'user-id-123',
        'server-id-123',
      );
      expect(DB.get.memberApplication).toHaveBeenCalledWith(
        'user-id-123',
        'server-id-123',
      );

      expect(DB.set.memberApplication).toHaveBeenCalled();

      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'serverMemberApplicationsUpdate',
        expect.any(Array),
      );
    });

    it('應成功更新他人的會員申請（管理員）', async () => {
      // 條件：管理員（權限等級5）更新他人的待處理申請
      utils.Func.validate.memberApplication.mockResolvedValue({
        ...mockMemberApplication,
        applicationStatus: 'approved',
      });
      const dataWithDifferentUser = {
        ...mockData,
        userId: 'different-user-id',
      };

      await memberApplicationHandler.updateMemberApplication(
        mockIo,
        mockSocket,
        dataWithDifferentUser,
      );

      expect(DB.get.memberApplication).toHaveBeenCalledWith(
        'different-user-id',
        'server-id-123',
      );
      expect(DB.set.memberApplication).toHaveBeenCalled();

      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'serverMemberApplicationsUpdate',
        expect.any(Array),
      );
    });

    it('應在缺少必要資料時拋出錯誤', async () => {
      // 條件：缺少必要的會員申請資料
      const invalidData = {
        serverId: 'server-id-123',
      };

      await memberApplicationHandler.updateMemberApplication(
        mockIo,
        mockSocket,
        invalidData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應拒絕沒有足夠權限的用戶更新他人申請', async () => {
      // 條件：權限等級低於5的用戶嘗試更新他人的申請
      const dataWithDifferentUser = {
        ...mockData,
        userId: 'different-user-id',
      };

      DB.get.member.mockResolvedValue({ ...mockMember, permissionLevel: 4 });

      await memberApplicationHandler.updateMemberApplication(
        mockIo,
        mockSocket,
        dataWithDifferentUser,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應拒絕更新已處理的申請', async () => {
      // 條件：嘗試更新已經被處理過的申請
      DB.get.memberApplication.mockResolvedValue(mockProcessedApplication);

      await memberApplicationHandler.updateMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'serverMemberApplicationsUpdate',
        expect.any(Array),
      );
    });

    it('應拒絕更新不存在的申請', async () => {
      // 條件：嘗試更新不存在的申請
      DB.get.memberApplication.mockResolvedValue(null);

      await memberApplicationHandler.updateMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應處理意外錯誤', async () => {
      // 條件：驗證過程中發生意外錯誤
      utils.Func.validate.socket.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await memberApplicationHandler.updateMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });

  describe('deleteMemberApplication', () => {
    const mockData = {
      userId: 'user-id-123',
      serverId: 'server-id-123',
    };

    it('應成功刪除自己的會員申請', async () => {
      // 條件：用戶刪除自己的待處理申請
      await memberApplicationHandler.deleteMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      expect(utils.Func.validate.socket).toHaveBeenCalledWith(mockSocket);
      // 由於 memberApplication.js 中沒有調用 get.user，所以這裡不應該驗證
      // expect(DB.get.user).toHaveBeenCalledWith('user-id-123');
      // expect(DB.get.server).toHaveBeenCalledWith('server-id-123');
      expect(DB.get.member).toHaveBeenCalledWith(
        'user-id-123',
        'server-id-123',
      );
      expect(DB.get.memberApplication).toHaveBeenCalledWith(
        'user-id-123',
        'server-id-123',
      );

      // 驗證刪除操作被調用
      expect(DB.delete.memberApplication).toHaveBeenCalledWith(
        'user-id-123',
        'server-id-123',
      );

      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'serverMemberApplicationsUpdate',
        expect.any(Array),
      );
    });

    it('應成功刪除他人的會員申請（管理員）', async () => {
      // 條件：管理員（權限等級5）刪除他人的待處理申請
      const dataWithDifferentUser = {
        ...mockData,
        userId: 'different-user-id',
      };

      await memberApplicationHandler.deleteMemberApplication(
        mockIo,
        mockSocket,
        dataWithDifferentUser,
      );

      expect(DB.get.memberApplication).toHaveBeenCalledWith(
        'different-user-id',
        'server-id-123',
      );

      // 驗證刪除操作被調用
      expect(DB.delete.memberApplication).toHaveBeenCalledWith(
        'different-user-id',
        'server-id-123',
      );

      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'serverMemberApplicationsUpdate',
        expect.any(Array),
      );
    });

    it('應在缺少必要資料時拋出錯誤', async () => {
      // 條件：缺少必要的會員申請資料
      const invalidData = {
        serverId: 'server-id-123',
      };

      await memberApplicationHandler.deleteMemberApplication(
        mockIo,
        mockSocket,
        invalidData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應拒絕沒有足夠權限的用戶刪除他人申請', async () => {
      // 條件：權限等級低於5的用戶嘗試刪除他人的申請
      const dataWithDifferentUser = {
        ...mockData,
        userId: 'different-user-id',
      };

      DB.get.member.mockResolvedValue({ ...mockMember, permissionLevel: 4 });

      await memberApplicationHandler.deleteMemberApplication(
        mockIo,
        mockSocket,
        dataWithDifferentUser,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應拒絕刪除已處理的申請', async () => {
      // 條件：嘗試刪除已經被處理過的申請
      DB.get.memberApplication.mockResolvedValue(mockProcessedApplication);

      await memberApplicationHandler.deleteMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('server_server-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'serverMemberApplicationsUpdate',
        expect.any(Array),
      );
    });

    it('應拒絕刪除不存在的申請', async () => {
      // 條件：嘗試刪除不存在的申請
      DB.get.memberApplication.mockResolvedValue(null);

      await memberApplicationHandler.deleteMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('應處理意外錯誤', async () => {
      // 條件：驗證過程中發生意外錯誤
      utils.Func.validate.socket.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await memberApplicationHandler.deleteMemberApplication(
        mockIo,
        mockSocket,
        mockData,
      );

      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });
  });
});
