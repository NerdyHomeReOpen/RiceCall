import { jest } from '@jest/globals';

// 被測試的模組
import { RTCAnswerHandler } from '../../../src/api/socket/events/rtc/rtc.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockError,
} from '../../_testSetup';

// 錯誤類型和Schema
import { RTCAnswerSchema } from '../../../src/api/socket/events/rtc/rtc.schemas';

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
const defaultAnswerData = {
  to: DEFAULT_IDS.targetSocketId,
  answer: {
    type: 'answer',
    sdp: 'v=0\r\no=bob 2890844527 2890844528 IN IP4 host.atlanta.com\r\n...',
  },
};

describe('RTCAnswerHandler (RTC Answer處理)', () => {
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
    mockDataValidator.validate.mockResolvedValue(defaultAnswerData);
  });

  it('應成功發送RTC answer', async () => {
    await RTCAnswerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultAnswerData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      RTCAnswerSchema,
      defaultAnswerData,
      'RTCANSWER',
    );

    expect(mockSocketInstance.to).toHaveBeenCalledWith(
      DEFAULT_IDS.targetSocketId,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcAnswerCall = emitCalls.find(
      (call: any) => call[0] === 'RTCAnswer',
    );
    expect(rtcAnswerCall).toBeTruthy();

    if (rtcAnswerCall) {
      expect(rtcAnswerCall[1]).toEqual({
        from: 'test-socket-id',
        userId: DEFAULT_IDS.operatorUserId,
        answer: defaultAnswerData.answer,
      });
    }
  });

  it('應正確傳遞answer資料', async () => {
    const customAnswer = {
      type: 'answer',
      sdp: 'custom answer sdp data',
    };
    const customData = {
      ...defaultAnswerData,
      answer: customAnswer,
    };
    mockDataValidator.validate.mockResolvedValue(customData);

    await RTCAnswerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      customData,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcAnswerCall = emitCalls.find(
      (call: any) => call[0] === 'RTCAnswer',
    );

    if (rtcAnswerCall) {
      expect(rtcAnswerCall[1].answer).toEqual(customAnswer);
    }
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid answer data');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await RTCAnswerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultAnswerData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '連接 RTC 失敗，請稍後再試',
        part: 'RTCANSWER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await RTCAnswerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultAnswerData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      RTCAnswerSchema,
      defaultAnswerData,
      'RTCANSWER',
    );
  });

  it('應包含正確的socket資訊', async () => {
    await RTCAnswerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultAnswerData,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcAnswerCall = emitCalls.find(
      (call: any) => call[0] === 'RTCAnswer',
    );

    if (rtcAnswerCall) {
      expect(rtcAnswerCall[1]).toEqual(
        expect.objectContaining({
          from: 'test-socket-id',
          userId: DEFAULT_IDS.operatorUserId,
          answer: expect.any(Object),
        }),
      );
    }
  });
});
