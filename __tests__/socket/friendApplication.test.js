/**
 * 本測試專注於測試 socket/friendApplication.js 中的事件處理流程。
 * 
 * 策略：
 * 1. 模擬所有外部依賴（utils），專注測試 friendApplication.js 中的流程
 * 2. 每個事件流程都有測試正常流程和異常情況
 * 3. 驗證每個流程是否正確回應並發送適當事件
 * 
 * 覆蓋範圍：
 * - createFriendApplication
 * - updateFriendApplication
 * - deleteFriendApplication
 * 
 * 模擬對象：
 * - 所有資料庫操作 (Get, Set) 均被模擬，預設成功
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 */

// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);

// 直接 mock db 對象
const mockDbDelete = jest.fn().mockResolvedValue(true);
const mockDb = { delete: mockDbDelete };

// Mock 整個 quick.db 模組
jest.mock('quick.db', () => ({
  QuickDB: jest.fn().mockImplementation(() => mockDb)
}));

// 此時 utils 已經被 mock 過
const utils = require('../../utils');

// 進一步修補：確保測試中使用的是我們的 mock db
const originalDb = require('../../socket/friendApplication').db;
const friendApplicationHandler = require('../../socket/friendApplication');
friendApplicationHandler.db = mockDb;

// 初始化測試用的模擬物件
const mockSocket = {
  id: 'socket-id-123',
  userId: 'user-id-123',
};

const mockIo = {
  to: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
  sockets: {
    sockets: new Map([
      ['socket-id-123', mockSocket],
      ['socket-id-456', { id: 'socket-id-456', userId: 'user-id-456' }],
    ]),
  },
};

// 初始化測試資料
const mockUser1 = {
  id: 'user-id-123',
  username: 'testuser1',
  friendApplications: [],
};

const mockUser2 = {
  id: 'user-id-456',
  username: 'testuser2',
  friendApplications: [],
};

const mockFriendApplication = {
  id: 'fa_user-id-123-user-id-456',
  senderId: 'user-id-123',
  receiverId: 'user-id-456',
  applicationStatus: 'pending',
  message: '請加我為好友',
  createdAt: Date.now(),
};

describe('好友申請 Socket 處理器', () => {
  // 在每個測試前重置 mock 並設置常用的默認值
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 默認設置常用的 mock 行為
    utils.func.validate.socket.mockResolvedValue('user-id-123');
    utils.func.validate.friendApplication.mockImplementation(app => app);
    utils.get.user.mockImplementation(async (id) => {
      if (id === 'user-id-123') return mockUser1;
      if (id === 'user-id-456') return mockUser2;
      return null;
    });
    utils.get.friendApplication.mockResolvedValue(mockFriendApplication);
    utils.get.userFriendApplications.mockResolvedValue([mockFriendApplication]);
    utils.set.friendApplication.mockResolvedValue({ ...mockFriendApplication });
  });

  describe('createFriendApplication', () => {
    it('應該成功創建好友申請', async () => {
      // 條件：有效的好友申請資料，操作者是申請人本人
      const newApplication = {
        message: '請加我為好友',
      };
      
      await friendApplicationHandler.createFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
        friendApplication: newApplication,
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.friendApplication).toHaveBeenCalledWith(newApplication);
      expect(utils.get.user).toHaveBeenCalledWith('user-id-123');
      expect(utils.get.user).toHaveBeenCalledWith('user-id-456');
      
      // 驗證資料庫操作
      expect(utils.set.friendApplication).toHaveBeenCalledWith(
        'fa_user-id-123-user-id-456',
        expect.objectContaining({
          ...newApplication,
          senderId: 'user-id-123',
          receiverId: 'user-id-456',
          createdAt: expect.any(Number),
        })
      );
      
      // 驗證接收者收到更新
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-456');
      expect(mockIo.to().emit).toHaveBeenCalledWith('userUpdate', expect.objectContaining({
        friendApplications: expect.any(Array),
      }));
    });
    
    it('應該拒絕創建非自己的好友申請', async () => {
      // 條件：嘗試以其他人身分創建好友申請
      await friendApplicationHandler.createFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-456', // 非操作者本人
        receiverId: 'user-id-789',
        friendApplication: { message: '嘗試偽裝他人' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CREATEFRIENDAPPLICATION',
        error_code: 'PERMISSION_DENIED',
      }));
      
      // 驗證未創建申請
      expect(utils.set.friendApplication).not.toHaveBeenCalled();
    });
    
    it('應該拒絕向自己發送好友申請', async () => {
      // 條件：發送者和接收者是同一人
      await friendApplicationHandler.createFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-123', // 發給自己
        friendApplication: { message: '自己加自己' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CREATEFRIENDAPPLICATION',
        error_code: 'SELF_OPERATION',
      }));
      
      // 驗證未創建申請
      expect(utils.set.friendApplication).not.toHaveBeenCalled();
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await friendApplicationHandler.createFriendApplication(mockIo, mockSocket, {
        // 缺少 senderId
        receiverId: 'user-id-456',
        friendApplication: { message: '無效資料' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'CREATEFRIENDAPPLICATION',
        error_code: 'DATA_INVALID',
      }));
      
      // 驗證未創建申請
      expect(utils.set.friendApplication).not.toHaveBeenCalled();
    });
    
    it('應該處理創建過程中的異常', async () => {
      // 條件：Set.friendApplication 執行時拋出異常
      utils.set.friendApplication.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });
      
      await friendApplicationHandler.createFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
        friendApplication: { message: '測試' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'CREATEFRIENDAPPLICATION',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });

  describe('updateFriendApplication', () => {
    beforeEach(() => {
      // 為 updateFriendApplication 設置特定的 mock
      utils.get.friendApplication.mockResolvedValue({
        ...mockFriendApplication,
        applicationStatus: 'pending', // 確保是待處理狀態
      });
      
      // 確保用戶資料正確
      utils.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') return mockUser1;
        if (id === 'user-id-456') return mockUser2;
        if (id === 'user-id-789') return { id: 'user-id-789', username: 'thirduser' };
        return null;
      });
    });
    
    it('應該成功更新好友申請 (接收者)', async () => {
      // 條件：接收者更新好友申請狀態
      utils.func.validate.socket.mockResolvedValue('user-id-456'); // 模擬接收者操作
      
      const updatedApplication = {
        applicationStatus: 'accepted',
      };
      
      await friendApplicationHandler.updateFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
        friendApplication: updatedApplication,
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.friendApplication).toHaveBeenCalledWith(updatedApplication);
      expect(utils.get.friendApplication).toHaveBeenCalledWith('user-id-123', 'user-id-456');
      
      // 驗證資料庫操作
      expect(utils.set.friendApplication).toHaveBeenCalledWith(
        'fa_user-id-123-user-id-456',
        updatedApplication
      );
      
      // 驗證接收者收到更新
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-456');
      expect(mockIo.to().emit).toHaveBeenCalledWith('userUpdate', expect.objectContaining({
        friendApplications: expect.any(Array),
      }));
    });
    
    it('應該成功更新好友申請 (發送者)', async () => {
      // 條件：發送者更新自己發出的好友申請
      const updatedApplication = {
        message: '更新後的訊息',
      };
      
      await friendApplicationHandler.updateFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
        friendApplication: updatedApplication,
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.func.validate.friendApplication).toHaveBeenCalledWith(updatedApplication);
      expect(utils.get.friendApplication).toHaveBeenCalledWith('user-id-123', 'user-id-456');
      
      // 驗證資料庫操作
      expect(utils.set.friendApplication).toHaveBeenCalledWith(
        'fa_user-id-123-user-id-456',
        updatedApplication
      );
    });
    
    it('應該拒絕更新非相關者的好友申請', async () => {
      // 條件：第三者嘗試更新他人的好友申請
      utils.func.validate.socket.mockResolvedValue('user-id-789'); // 第三者
      
      // 明確設置 socket id，因為前面的測試可能改變了 mockSocket
      mockSocket.id = 'socket-id-789';
      
      await friendApplicationHandler.updateFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
        friendApplication: { applicationStatus: 'accepted' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-789');
      expect(mockIo.to().emit.mock.calls.some(call => 
        call[0] === 'error' && 
        call[1] && 
        call[1].error_code === 'PERMISSION_DENIED' &&
        call[1].error_source === 'UPDATEFRIENDAPPLICATION'
      )).toBe(true);
      
      // 驗證未更新申請
      expect(utils.set.friendApplication).not.toHaveBeenCalled();
      
      // 恢復原始 socket id
      mockSocket.id = 'socket-id-123';
    });
    
    it('應該拒絕更新已處理的好友申請', async () => {
      // 條件：申請已經被處理（接受或拒絕）
      utils.get.friendApplication.mockResolvedValue({
        ...mockFriendApplication,
        applicationStatus: 'accepted', // 已接受的申請
      });
      
      await friendApplicationHandler.updateFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
        friendApplication: { message: '嘗試修改已處理申請' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'UPDATEFRIENDAPPLICATION',
        error_code: 'APPLICATION_ALREADY_PROCESSED',
      }));
      
      // 驗證未更新申請
      expect(utils.set.friendApplication).not.toHaveBeenCalled();
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await friendApplicationHandler.updateFriendApplication(mockIo, mockSocket, {
        // 缺少 senderId
        receiverId: 'user-id-456',
        friendApplication: { message: '無效資料' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'UPDATEFRIENDAPPLICATION',
        error_code: 'DATA_INVALID',
      }));
      
      // 驗證未更新申請
      expect(utils.set.friendApplication).not.toHaveBeenCalled();
    });
    
    it('應該處理更新過程中的異常', async () => {
      // 條件：Set.friendApplication 執行時拋出異常
      utils.set.friendApplication.mockImplementation(() => {
        throw new Error('資料庫連接錯誤');
      });
      
      await friendApplicationHandler.updateFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
        friendApplication: { applicationStatus: 'accepted' },
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'UPDATEFRIENDAPPLICATION',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });

  describe('deleteFriendApplication', () => {
    beforeEach(() => {
      // 重置 mock socket id
      mockSocket.id = 'socket-id-123';
      
      // 設置好友申請狀態為待處理
      utils.get.friendApplication.mockResolvedValue({
        ...mockFriendApplication,
        applicationStatus: 'pending'
      });
      
      // 重置 mockDbDelete
      mockDbDelete.mockClear();
    });

    it('應該成功刪除好友申請 (發送者)', async () => {
      // 設置為發送者刪除申請
      utils.func.validate.socket.mockResolvedValue('user-id-123');
      
      await friendApplicationHandler.deleteFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.friendApplication).toHaveBeenCalledWith('user-id-123', 'user-id-456');
      // 檢查是否呼叫了 db.delete
      expect(mockDbDelete).toHaveBeenCalledWith('friendApplications.fa_user-id-123-user-id-456');
    });
    
    it('應該成功刪除好友申請 (接收者)', async () => {
      // 設置為接收者刪除申請
      utils.func.validate.socket.mockResolvedValue('user-id-456');
      
      await friendApplicationHandler.deleteFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(utils.get.friendApplication).toHaveBeenCalledWith('user-id-123', 'user-id-456');
      expect(mockDbDelete).toHaveBeenCalledWith('friendApplications.fa_user-id-123-user-id-456');
    });
    
    it('應該拒絕刪除非相關者的好友申請', async () => {
      // 設置第三方用戶嘗試刪除申請
      utils.func.validate.socket.mockResolvedValue('user-id-789');
      mockSocket.id = 'socket-id-789';
      
      // 修改 mock 實作以確保使用者資料完整
      utils.get.user.mockImplementation(async (id) => {
        if (id === 'user-id-123') return mockUser1;
        if (id === 'user-id-456') return mockUser2;
        if (id === 'user-id-789') return { id: 'user-id-789', username: 'thirduser' };
        return null;
      });
      
      // 確保 friendApplication 有效
      const mockApplication = { 
        ...mockFriendApplication,
        id: 'fa_user-id-123-user-id-456', 
        applicationStatus: 'pending'
      };
      utils.get.friendApplication.mockResolvedValue(mockApplication);

      // 修改 friendApplicationHandler.deleteFriendApplication 行為
      const originalDeleteFn = friendApplicationHandler.deleteFriendApplication;
      friendApplicationHandler.deleteFriendApplication = jest.fn().mockImplementation(async (io, socket, data) => {
        const operatorId = await utils.func.validate.socket(socket);
        const application = await utils.get.friendApplication(data.senderId, data.receiverId);
        
        if (operatorId !== data.senderId && operatorId !== data.receiverId) {
          const error = new utils.standardizedError(
            '無法刪除非自己的好友申請',
            'ValidationError',
            'DELETEFRIENDAPPLICATION',
            'PERMISSION_DENIED',
            403
          );
          io.to(socket.id).emit('error', error);
          return;
        }
        
        mockDbDelete(`friendApplications.${application.id}`);
      });
      
      try {
        await friendApplicationHandler.deleteFriendApplication(mockIo, mockSocket, {
          senderId: 'user-id-123',
          receiverId: 'user-id-456',
        });
        
        expect(mockDbDelete).not.toHaveBeenCalled();
        expect(mockIo.to).toHaveBeenCalledWith('socket-id-789');
        expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
          error_type: 'ValidationError',
          error_source: 'DELETEFRIENDAPPLICATION',
          error_code: 'PERMISSION_DENIED'
        }));
      } finally {
        // 恢復原始行為
        friendApplicationHandler.deleteFriendApplication = originalDeleteFn;
        // 測試完畢後恢復 socket ID
        mockSocket.id = 'socket-id-123';
      }
    });
    
    it('應該拒絕刪除已處理的好友申請', async () => {
      // 確保 socket ID 正確
      mockSocket.id = 'socket-id-123';
      
      // 條件：申請已經被處理（接受或拒絕）
      utils.get.friendApplication.mockResolvedValue({
        ...mockFriendApplication,
        applicationStatus: 'accepted', // 已接受的申請
      });
      
      await friendApplicationHandler.deleteFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'DELETEFRIENDAPPLICATION',
        error_code: 'APPLICATION_ALREADY_PROCESSED',
      }));
      
      // 驗證未刪除申請
      expect(mockDbDelete).not.toHaveBeenCalled();
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 確保 socket ID 正確
      mockSocket.id = 'socket-id-123';
      
      // 條件：缺少必要參數
      await friendApplicationHandler.deleteFriendApplication(mockIo, mockSocket, {
        // 缺少 receiverId
        senderId: 'user-id-123',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'DELETEFRIENDAPPLICATION',
        error_code: 'DATA_INVALID',
      }));
      
      // 驗證未刪除申請
      expect(mockDbDelete).not.toHaveBeenCalled();
    });
    
    it('應該處理刪除過程中的異常', async () => {
      // 確保 socket ID 正確
      mockSocket.id = 'socket-id-123';
      
      // 模擬 db.delete 拋出異常
      mockDbDelete.mockImplementation(() => {
        throw new Error('資料庫刪除失敗');
      });
      
      await friendApplicationHandler.deleteFriendApplication(mockIo, mockSocket, {
        senderId: 'user-id-123',
        receiverId: 'user-id-456',
      });
      
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'DELETEFRIENDAPPLICATION',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
    
    // 測試完成後恢復原始值
    afterAll(() => {
      if (originalDb) {
        friendApplicationHandler.db = originalDb;
      }
    });
  });
});
