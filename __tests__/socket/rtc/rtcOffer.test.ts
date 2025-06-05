import { jest } from '@jest/globals';
import { mockDataValidator } from '../../_testSetup';

// Mock所有相依模組
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));

jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// 被測試的模組和測試輔助工具
import { RTCOfferHandler } from '../../../src/api/socket/events/rtc/rtc.handler';
import { RTCOfferSchema } from '../../../src/api/socket/events/rtc/rtc.schemas';
import {
  createDefaultTestData,
  createRTCOfferVariant,
  createStandardMockInstances,
  DEFAULT_IDS,
  expectRTCEventData,
  findSocketEmitCall,
  setupAfterEach,
  setupBeforeEach,
  testValidationError,
} from './_testHelpers';

describe('RTCOfferHandler (RTC Offer處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances();
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功發送RTC offer', async () => {
    const data = testData.createRTCOfferData();

    await RTCOfferHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      RTCOfferSchema,
      data,
      'RTCOFFER',
    );

    expect(mockSocketInstance.to).toHaveBeenCalledWith(
      DEFAULT_IDS.targetSocketId,
    );

    const rtcOfferCall = findSocketEmitCall(mockSocketInstance, 'RTCOffer');
    expectRTCEventData(rtcOfferCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      offer: testData.defaultOffer,
    });
  });

  it('應正確傳遞offer資料', async () => {
    const customOffer = createRTCOfferVariant(testData.defaultOffer, {
      sdp: 'custom sdp data',
    });
    const data = testData.createRTCOfferData({
      offer: customOffer,
    });

    await RTCOfferHandler.handle(mockIoInstance, mockSocketInstance, data);

    const rtcOfferCall = findSocketEmitCall(mockSocketInstance, 'RTCOffer');
    expectRTCEventData(rtcOfferCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      offer: customOffer,
    });
  });

  it('應正確處理不同的目標Socket ID', async () => {
    const customTargetSocketId = 'custom-target-socket';
    const data = testData.createRTCOfferData({
      to: customTargetSocketId,
    });

    await RTCOfferHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockSocketInstance.to).toHaveBeenCalledWith(customTargetSocketId);

    const rtcOfferCall = findSocketEmitCall(mockSocketInstance, 'RTCOffer');
    expectRTCEventData(rtcOfferCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      offer: testData.defaultOffer,
    });
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const invalidData = { to: '', offer: {} };
    const validationError = new Error('Invalid data');

    await testValidationError(
      RTCOfferHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '連接 RTC 失敗，請稍後再試',
    );
  });

  describe('RTC Offer 資料處理', () => {
    it('應包含正確的socket資訊', async () => {
      const data = testData.createRTCOfferData();

      await RTCOfferHandler.handle(mockIoInstance, mockSocketInstance, data);

      const rtcOfferCall = findSocketEmitCall(mockSocketInstance, 'RTCOffer');
      expect(rtcOfferCall).toBeTruthy();
      if (rtcOfferCall) {
        expect(rtcOfferCall[1]).toEqual(
          expect.objectContaining({
            from: DEFAULT_IDS.socketId,
            userId: DEFAULT_IDS.operatorUserId,
            offer: expect.any(Object),
          }),
        );
      }
    });

    it('應正確處理不同類型的offer', async () => {
      const customOffer = createRTCOfferVariant(testData.defaultOffer, {
        type: 'offer',
        sdp: 'v=0\r\no=custom 1234567890 1234567891 IN IP4 custom.host.com\r\n...',
      });
      const data = testData.createRTCOfferData({
        offer: customOffer,
      });

      await RTCOfferHandler.handle(mockIoInstance, mockSocketInstance, data);

      const rtcOfferCall = findSocketEmitCall(mockSocketInstance, 'RTCOffer');
      expectRTCEventData(rtcOfferCall, {
        from: DEFAULT_IDS.socketId,
        userId: DEFAULT_IDS.operatorUserId,
        offer: customOffer,
      });
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createRTCOfferData();

      await RTCOfferHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        RTCOfferSchema,
        data,
        'RTCOFFER',
      );
    });

    it('應按正確順序執行發送流程', async () => {
      const data = testData.createRTCOfferData();

      await RTCOfferHandler.handle(mockIoInstance, mockSocketInstance, data);

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockSocketInstance.to).toHaveBeenCalledTimes(1);
    });
  });
});
