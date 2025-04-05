/**
 * 本測試專注於測試 socket/index.js 中的設定流程。
 * 
 * 策略：
 * 1. 模擬 Socket.IO 和 socket 物件
 * 2. 模擬所有相關處理模組 (userHandler, serverHandler 等)
 * 3. 測試中間件驗證和事件註冊
 * 
 * 覆蓋範圍：
 * - Socket.IO 中間件驗證流程
 *   - JWT 驗證成功
 *   - JWT 缺失情況
 *   - JWT 無效情況
 *   - JWT 驗證成功但無用戶 ID
 *   - 驗證過程發生意外錯誤
 * - 事件註冊機制
 *   - 所有事件處理器正確註冊
 *   - 斷線事件處理
 *   - 訊息事件處理
 * 
 * 模擬對象：
 * - Socket.IO (io)
 * - socket 物件
 * - JWT 驗證
 * - 所有事件處理模組
 */

// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid-v4'),
}));

// Mock 各處理器模組
const mockUserHandler = {
  connectUser: jest.fn(),
  disconnectUser: jest.fn(),
  searchUser: jest.fn(),
  updateUser: jest.fn(),
};

const mockServerHandler = {
  searchServer: jest.fn(),
  connectServer: jest.fn(),
  disconnectServer: jest.fn(),
  createServer: jest.fn(),
  updateServer: jest.fn(),
};

const mockChannelHandler = {
  connectChannel: jest.fn(),
  disconnectChannel: jest.fn(),
  createChannel: jest.fn(),
  updateChannel: jest.fn(),
  deleteChannel: jest.fn(),
};

const mockMemberHandler = {
  createMember: jest.fn(),
  updateMember: jest.fn(),
  deleteMember: jest.fn(),
};

const mockFriendGroupHandler = {
  createFriendGroup: jest.fn(),
  updateFriendGroup: jest.fn(),
  deleteFriendGroup: jest.fn(),
};

const mockFriendHandler = {
  createFriend: jest.fn(),
  updateFriend: jest.fn(),
  deleteFriend: jest.fn(),
};

const mockFriendApplicationHandler = {
  createFriendApplication: jest.fn(),
  updateFriendApplication: jest.fn(),
  deleteFriendApplication: jest.fn(),
};

const mockMemberApplicationHandler = {
  createMemberApplication: jest.fn(),
  updateMemberApplication: jest.fn(),
  deleteMemberApplication: jest.fn(),
};

const mockMessageHandler = {
  sendMessage: jest.fn(),
  sendDirectMessage: jest.fn(),
};

const mockRtcHandler = {
  offer: jest.fn(),
  answer: jest.fn(),
  candidate: jest.fn(),
};

jest.mock('../../socket/user', () => mockUserHandler);
jest.mock('../../socket/server', () => mockServerHandler);
jest.mock('../../socket/channel', () => mockChannelHandler);
jest.mock('../../socket/member', () => mockMemberHandler);
jest.mock('../../socket/friendGroup', () => mockFriendGroupHandler);
jest.mock('../../socket/friend', () => mockFriendHandler);
jest.mock('../../socket/friendApplication', () => mockFriendApplicationHandler);
jest.mock('../../socket/memberApplication', () => mockMemberApplicationHandler);
jest.mock('../../socket/message', () => mockMessageHandler);
jest.mock('../../socket/rtc', () => mockRtcHandler);

// 引入要測試的模組
const socketHandler = require('../../socket/index');

describe('Socket.IO 入口點模組', () => {
  let mockIo;
  let middleware;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 設定 mock io 物件
    mockIo = {
      use: jest.fn(fn => { middleware = fn; }),
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    
    // 重置 utils 中的常用函數
    mockUtils.jwt.verifyToken.mockReset();
    mockUtils.map.createUserIdSessionIdMap.mockReset();
    mockUtils.map.createUserIdSocketIdMap.mockReset();
  });
  
  // 測試中間件
  describe('JWT 驗證中間件', () => {
    it('應該在 JWT 成功驗證時繼續處理', () => {
      // 條件：有效的 JWT，驗證成功返回用戶 ID
      const socket = {
        handshake: { query: { jwt: 'valid-jwt' } },
        id: 'socket-id-123',
      };
      const next = jest.fn();
      
      // 設置 JWT 驗證成功
      mockUtils.jwt.verifyToken.mockReturnValue({ valid: true, userId: 'user-id-123' });
      
      // 執行socketHandler 初始化中間件
      socketHandler(mockIo);
      expect(mockIo.use).toHaveBeenCalled();
      
      // 執行中間件
      middleware(socket, next);
      
      // 驗證結果
      expect(mockUtils.jwt.verifyToken).toHaveBeenCalledWith('valid-jwt');
      expect(socket.userId).toBe('user-id-123');
      expect(socket.jwt).toBe('valid-jwt');
      expect(socket.sessionId).toBe('mocked-uuid-v4');
      expect(mockUtils.map.createUserIdSessionIdMap).toHaveBeenCalledWith('user-id-123', 'mocked-uuid-v4');
      expect(mockUtils.map.createUserIdSocketIdMap).toHaveBeenCalledWith('user-id-123', 'socket-id-123');
      expect(next).toHaveBeenCalledWith();
    });
    
    it('應該在 JWT 缺失時拋出錯誤', () => {
      // 條件：請求中沒有提供 JWT
      const socket = {
        handshake: { query: {} },
      };
      const next = jest.fn();
      
      socketHandler(mockIo);
      
      middleware(socket, next);
      
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'AUTH',
        error_code: 'TOKEN_MISSING',
      }));
      expect(mockUtils.jwt.verifyToken).not.toHaveBeenCalled();
    });
    
    it('應該在 JWT 無效時拋出錯誤', () => {
      // 條件：JWT 驗證失敗
      const socket = {
        handshake: { query: { jwt: 'invalid-jwt' } },
      };
      const next = jest.fn();
      
      mockUtils.jwt.verifyToken.mockReturnValue({ valid: false });
      
      // 執行 socketHandler 初始化中間件
      socketHandler(mockIo);
      
      // 執行中間件
      middleware(socket, next);
      
      // 驗證結果
      expect(mockUtils.jwt.verifyToken).toHaveBeenCalledWith('invalid-jwt');
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'AUTH',
        error_code: 'TOKEN_INVALID',
      }));
    });
    
    it('應該在 JWT 有效但無用戶 ID 時拋出錯誤', () => {
      // 條件：JWT 驗證成功但沒有用戶 ID
      const socket = {
        handshake: { query: { jwt: 'valid-jwt-no-userid' } },
      };
      const next = jest.fn();
      
      mockUtils.jwt.verifyToken.mockReturnValue({ valid: true, userId: null });
      
      // 執行 socketHandler 初始化中間件
      socketHandler(mockIo);
      
      // 執行中間件
      middleware(socket, next);
      
      // 驗證結果
      expect(mockUtils.jwt.verifyToken).toHaveBeenCalledWith('valid-jwt-no-userid');
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'AUTH',
        error_code: 'TOKEN_INVALID',
      }));
    });
    
    it('應該處理驗證過程中的意外錯誤', () => {
      // 條件：驗證過程拋出意外錯誤
      const socket = {
        handshake: { query: { jwt: 'error-jwt' } },
      };
      const next = jest.fn();
      
      mockUtils.jwt.verifyToken.mockImplementation(() => {
        throw new Error('意外錯誤');
      });
      
      // 執行 socketHandler 初始化中間件
      socketHandler(mockIo);
      
      // 執行中間件
      middleware(socket, next);
      
      // 驗證結果
      expect(mockUtils.jwt.verifyToken).toHaveBeenCalledWith('error-jwt');
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'AUTH',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });
  
  // 測試事件註冊
  describe('事件處理註冊', () => {
    it('應該在連線時註冊所有處理器', () => {
      // 條件：socket 連線成功
      const mockSocket = {
        id: 'socket-id-123',
        on: jest.fn(),
      };
      
      // 設置 io.on 行為以觸發連線回調
      mockIo.on.mockImplementation((event, callback) => {
        if (event === 'connection') {
          callback(mockSocket);
        }
      });
      
      socketHandler(mockIo);
      
      // 驗證連線事件註冊
      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
      
      // 驗證用戶連線處理
      expect(mockUserHandler.connectUser).toHaveBeenCalledWith(mockIo, mockSocket);
      
      // 驗證關鍵事件註冊
      // 使用者相關
      expect(mockSocket.on.mock.calls).toContainEqual(['searchUser', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['updateUser', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['disconnect', expect.any(Function)]);
      
      // 伺服器相關
      expect(mockSocket.on.mock.calls).toContainEqual(['searchServer', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['connectServer', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['disconnectServer', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['createServer', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['updateServer', expect.any(Function)]);
      
      // 頻道相關
      expect(mockSocket.on.mock.calls).toContainEqual(['connectChannel', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['disconnectChannel', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['createChannel', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['updateChannel', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['deleteChannel', expect.any(Function)]);
      
      // 好友相關
      expect(mockSocket.on.mock.calls).toContainEqual(['createFriendGroup', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['updateFriendGroup', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['deleteFriendGroup', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['createFriend', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['updateFriend', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['deleteFriend', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['createFriendApplication', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['updateFriendApplication', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['deleteFriendApplication', expect.any(Function)]);
      
      // 成員相關
      expect(mockSocket.on.mock.calls).toContainEqual(['createMember', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['updateMember', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['deleteMember', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['createMemberApplication', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['updateMemberApplication', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['deleteMemberApplication', expect.any(Function)]);
      
      // 訊息相關
      expect(mockSocket.on.mock.calls).toContainEqual(['message', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['directMessage', expect.any(Function)]);
      
      // RTC 相關
      expect(mockSocket.on.mock.calls).toContainEqual(['RTCOffer', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['RTCAnswer', expect.any(Function)]);
      expect(mockSocket.on.mock.calls).toContainEqual(['RTCIceCandidate', expect.any(Function)]);
    });
  });
});
