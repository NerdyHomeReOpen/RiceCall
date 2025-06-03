import { jest } from '@jest/globals';

// 被測試的模組
import { RTCOfferHandler } from '../../../src/api/socket/events/rtc/rtc.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockError,
} from '../../_testSetup';

// 錯誤類型和Schema
import { RTCOfferSchema } from '../../../src/api/socket/events/rtc/rtc.schemas';

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
const defaultOfferData = {
  to: DEFAULT_IDS.targetSocketId,
  offer: {
    type: 'offer',
    sdp: 'v=0\r\no=alice 2890844526 2890844527 IN IP4 host.atlanta.com\r\n...',
  },
};

describe('RTCOfferHandler (RTC Offer處理)', () => {
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
    mockDataValidator.validate.mockResolvedValue(defaultOfferData);
  });

  it('應成功發送RTC offer', async () => {
    await RTCOfferHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultOfferData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      RTCOfferSchema,
      defaultOfferData,
      'RTCOFFER',
    );

    expect(mockSocketInstance.to).toHaveBeenCalledWith(
      DEFAULT_IDS.targetSocketId,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcOfferCall = emitCalls.find((call: any) => call[0] === 'RTCOffer');
    expect(rtcOfferCall).toBeTruthy();

    if (rtcOfferCall) {
      expect(rtcOfferCall[1]).toEqual({
        from: 'test-socket-id',
        userId: DEFAULT_IDS.operatorUserId,
        offer: defaultOfferData.offer,
      });
    }
  });

  it('應正確傳遞offer資料', async () => {
    const customOffer = {
      type: 'offer',
      sdp: 'custom sdp data',
    };
    const customData = {
      ...defaultOfferData,
      offer: customOffer,
    };
    mockDataValidator.validate.mockResolvedValue(customData);

    await RTCOfferHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      customData,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcOfferCall = emitCalls.find((call: any) => call[0] === 'RTCOffer');

    if (rtcOfferCall) {
      expect(rtcOfferCall[1].offer).toEqual(customOffer);
    }
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid data');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await RTCOfferHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultOfferData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '連接 RTC 失敗，請稍後再試',
        part: 'RTCOFFER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await RTCOfferHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultOfferData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      RTCOfferSchema,
      defaultOfferData,
      'RTCOFFER',
    );
  });

  it('應包含正確的socket資訊', async () => {
    await RTCOfferHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultOfferData,
    );

    const emitCalls = mockSocketInstance.to().emit.mock.calls;
    const rtcOfferCall = emitCalls.find((call: any) => call[0] === 'RTCOffer');

    if (rtcOfferCall) {
      expect(rtcOfferCall[1]).toEqual(
        expect.objectContaining({
          from: 'test-socket-id',
          userId: DEFAULT_IDS.operatorUserId,
          offer: expect.any(Object),
        }),
      );
    }
  });
});
