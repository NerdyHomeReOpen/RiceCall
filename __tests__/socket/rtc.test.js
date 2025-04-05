/**
 * 本測試專注於測試 socket/rtc.js 中的事件處理流程。
 * 
 * 策略：
 * 1. 模擬所有外部依賴（utils），專注測試 rtc.js 中的流程
 * 2. 每個事件流程都有測試正常流程和異常情況
 * 3. 驗證每個流程是否正確回應並發送適當事件
 * 
 * 覆蓋範圍：
 * - offer
 * - answer
 * - candidate
 * - join
 * - leave
 * 
 * 模擬對象：
 * - 使用者驗證 (Func.validate) 邏輯被模擬，預設成功
 * - Socket.IO 事件發送被模擬，預設成功
 */

// 讀取共用 mock 物件
const { createMocks } = require('../_testSetup');
const { mockUtils } = createMocks();

// 在當前 jest 環境中 mock 相關依賴
jest.mock('../../utils', () => mockUtils);

// 此時 utils 已經被 mock 過
const utils = require('../../utils');

// 真正要測試的模組
const rtcHandler = require('../../socket/rtc');

// 初始化測試用的模擬物件
const mockSocket = {
  id: 'socket-id-123',
  userId: 'user-id-123',
  to: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
};

const mockIo = {
  to: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
};

describe('RTC Socket 處理器', () => {
  // 在每個測試前重置 mock 並設置常用的默認值
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 默認設置常用的 mock 行為
    utils.func.validate.socket.mockResolvedValue('user-id-123');
  });

  describe('offer', () => {
    it('應該成功傳送 RTC offer', async () => {
      // 條件：有效的 offer 資料，socket 驗證成功
      const mockOffer = { sdp: 'mock-sdp', type: 'offer' };
      
      await rtcHandler.offer(mockIo, mockSocket, { 
        to: 'socket-id-456',
        offer: mockOffer
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).toHaveBeenCalledWith('socket-id-456');
      expect(mockSocket.to().emit).toHaveBeenCalledWith('RTCOffer', {
        from: 'socket-id-123',
        offer: mockOffer
      });
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await rtcHandler.offer(mockIo, mockSocket, { to: 'socket-id-456' });
      
      expect(utils.func.validate.socket).not.toHaveBeenCalled();
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'SENDRTCOFFER',
        error_code: 'DATA_INVALID',
      }));
    });
    
    it('應該處理 socket 驗證錯誤', async () => {
      // 條件：socket 驗證失敗
      utils.func.validate.socket.mockImplementation(() => {
        throw new Error('無效的 socket');
      });
      
      await rtcHandler.offer(mockIo, mockSocket, { 
        to: 'socket-id-456',
        offer: { sdp: 'mock-sdp', type: 'offer' }
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'SENDRTCOFFER',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });

  describe('answer', () => {
    it('應該成功傳送 RTC answer', async () => {
      // 條件：有效的 answer 資料，socket 驗證成功
      const mockAnswer = { sdp: 'mock-sdp', type: 'answer' };
      
      await rtcHandler.answer(mockIo, mockSocket, { 
        to: 'socket-id-456',
        answer: mockAnswer
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).toHaveBeenCalledWith('socket-id-456');
      expect(mockSocket.to().emit).toHaveBeenCalledWith('RTCAnswer', {
        from: 'socket-id-123',
        answer: mockAnswer
      });
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await rtcHandler.answer(mockIo, mockSocket, { to: 'socket-id-456' });
      
      expect(utils.func.validate.socket).not.toHaveBeenCalled();
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'SENDRTCANSWER',
        error_code: 'DATA_INVALID',
      }));
    });
    
    it('應該處理 socket 驗證錯誤', async () => {
      // 條件：socket 驗證失敗
      utils.func.validate.socket.mockImplementation(() => {
        throw new Error('無效的 socket');
      });
      
      await rtcHandler.answer(mockIo, mockSocket, { 
        to: 'socket-id-456',
        answer: { sdp: 'mock-sdp', type: 'answer' }
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'SENDRTCANSWER',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });

  describe('candidate', () => {
    it('應該成功傳送 RTC ICE candidate', async () => {
      // 條件：有效的 candidate 資料，socket 驗證成功
      const mockCandidate = { 
        candidate: 'candidate:1 1 UDP 2122260223 192.168.0.1 56789 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0
      };
      
      await rtcHandler.candidate(mockIo, mockSocket, { 
        to: 'socket-id-456',
        candidate: mockCandidate
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).toHaveBeenCalledWith('socket-id-456');
      expect(mockSocket.to().emit).toHaveBeenCalledWith('RTCIceCandidate', {
        from: 'socket-id-123',
        candidate: mockCandidate
      });
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await rtcHandler.candidate(mockIo, mockSocket, { to: 'socket-id-456' });
      
      expect(utils.func.validate.socket).not.toHaveBeenCalled();
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'SENDRTCCANDIDATE',
        error_code: 'DATA_INVALID',
      }));
    });
    
    it('應該處理 socket 驗證錯誤', async () => {
      // 條件：socket 驗證失敗
      utils.func.validate.socket.mockImplementation(() => {
        throw new Error('無效的 socket');
      });
      
      await rtcHandler.candidate(mockIo, mockSocket, { 
        to: 'socket-id-456',
        candidate: { 
          candidate: 'candidate:1 1 UDP 2122260223 192.168.0.1 56789 typ host',
          sdpMid: '0',
          sdpMLineIndex: 0
        }
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'SENDRTCICECANDIDATE',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });

  describe('join', () => {
    it('應該成功加入 RTC 頻道', async () => {
      // 條件：有效的頻道ID，socket 驗證成功
      
      await rtcHandler.join(mockIo, mockSocket, { 
        channelId: 'channel-id-123'
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).toHaveBeenCalledWith('channel_channel-id-123');
      expect(mockSocket.to().emit).toHaveBeenCalledWith('RTCJoin', 'socket-id-123');
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await rtcHandler.join(mockIo, mockSocket, {
        to: undefined, 
        channelId: undefined,
      });
      
      expect(utils.func.validate.socket).not.toHaveBeenCalled();
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'JOINRTCCHANNEL',
        error_code: 'DATA_INVALID',
      }));
    });
    
    it('應該處理 socket 驗證錯誤', async () => {
      // 條件：socket 驗證失敗
      utils.func.validate.socket.mockImplementation(() => {
        throw new Error('無效的 socket');
      });
      
      await rtcHandler.join(mockIo, mockSocket, { 
        channelId: 'channel-id-123'
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'JOINRTCCHANNEL',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });

  describe('leave', () => {
    it('應該成功離開 RTC 頻道', async () => {
      // 條件：有效的頻道ID，socket 驗證成功
      
      await rtcHandler.leave(mockIo, mockSocket, { 
        channelId: 'channel-id-123'
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).toHaveBeenCalledWith('channel_channel-id-123');
      expect(mockSocket.to().emit).toHaveBeenCalledWith('RTCLeave', 'socket-id-123');
    });
    
    it('應該在資料無效時拋出錯誤', async () => {
      // 條件：缺少必要參數
      await rtcHandler.leave(mockIo, mockSocket, {});
      
      expect(utils.func.validate.socket).not.toHaveBeenCalled();
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ValidationError',
        error_source: 'LEAVERTCCHANNEL',
        error_code: 'DATA_INVALID',
      }));
    });
    
    it('應該處理 socket 驗證錯誤', async () => {
      // 條件：socket 驗證失敗
      utils.func.validate.socket.mockImplementation(() => {
        throw new Error('無效的 socket');
      });
      
      await rtcHandler.leave(mockIo, mockSocket, { 
        channelId: 'channel-id-123'
      });
      
      expect(utils.func.validate.socket).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('socket-id-123');
      expect(mockIo.to().emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error_type: 'ServerError',
        error_source: 'LEAVERTCCHANNEL',
        error_code: 'EXCEPTION_ERROR',
      }));
    });
  });
});
