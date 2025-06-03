import { jest } from '@jest/globals';

// 被測試的模組
import { RTCCandidateHandler } from '../../../src/api/socket/events/rtc/rtc.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockError,
} from '../../_testSetup';

// 錯誤類型和Schema
import { RTCCandidateSchema } from '../../../src/api/socket/events/rtc/rtc.schemas';

// Mock所有相依模組
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetSocketId: 'target-socket-id',
} as const;

// 測試數據
const defaultCandidateData = {
  to: DEFAULT_IDS.targetSocketId,
  candidate: {
    candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54400 typ host',
    sdpMLineIndex: 0,
    sdpMid: '0',
  },
};

describe('RTCCandidateHandler (RTC Candidate處理)', () => {
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
    mockDataValidator.validate.mockResolvedValue(defaultCandidateData);
  });

  it('應成功發送RTC candidate', async () => {
    await RTCCandidateHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCandidateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      RTCCandidateSchema,
      defaultCandidateData,
      'RTCCANDIDATE',
    );

    expect(mockSocketInstance.to).toHaveBeenCalledWith(
      DEFAULT_IDS.targetSocketId,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcCandidateCall = emitCalls.find(
      (call: any) => call[0] === 'RTCIceCandidate',
    );
    expect(rtcCandidateCall).toBeTruthy();

    if (rtcCandidateCall) {
      expect(rtcCandidateCall[1]).toEqual({
        from: 'test-socket-id',
        userId: DEFAULT_IDS.operatorUserId,
        candidate: defaultCandidateData.candidate,
      });
    }
  });

  it('應正確傳遞candidate資料', async () => {
    const customCandidate = {
      candidate:
        'candidate:2 1 TCP 2130706431 10.0.0.1 9 typ host tcptype active',
      sdpMLineIndex: 1,
      sdpMid: '1',
    };
    const customData = {
      ...defaultCandidateData,
      candidate: customCandidate,
    };
    mockDataValidator.validate.mockResolvedValue(customData);

    await RTCCandidateHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      customData,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcCandidateCall = emitCalls.find(
      (call: any) => call[0] === 'RTCIceCandidate',
    );

    if (rtcCandidateCall) {
      expect(rtcCandidateCall[1].candidate).toEqual(customCandidate);
    }
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid candidate data');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await RTCCandidateHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCandidateData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '連接 RTC 失敗，請稍後再試',
        part: 'RTCCANDIDATE',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await RTCCandidateHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCandidateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      RTCCandidateSchema,
      defaultCandidateData,
      'RTCCANDIDATE',
    );
  });

  it('應包含正確的socket資訊', async () => {
    await RTCCandidateHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultCandidateData,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcCandidateCall = emitCalls.find(
      (call: any) => call[0] === 'RTCIceCandidate',
    );

    if (rtcCandidateCall) {
      expect(rtcCandidateCall[1]).toEqual(
        expect.objectContaining({
          from: 'test-socket-id',
          userId: DEFAULT_IDS.operatorUserId,
          candidate: expect.any(Object),
        }),
      );
    }
  });

  it('應處理空的candidate資料', async () => {
    const emptyCandidateData = {
      to: DEFAULT_IDS.targetSocketId,
      candidate: null,
    };
    mockDataValidator.validate.mockResolvedValue(emptyCandidateData);

    await RTCCandidateHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      emptyCandidateData,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcCandidateCall = emitCalls.find(
      (call: any) => call[0] === 'RTCIceCandidate',
    );

    if (rtcCandidateCall) {
      expect(rtcCandidateCall[1].candidate).toBeNull();
    }
  });
});
