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
import { RTCAnswerHandler } from '../../../src/api/socket/events/rtc/rtc.handler';
import { RTCAnswerSchema } from '../../../src/api/socket/events/rtc/rtc.schemas';
import {
  createDefaultTestData,
  createRTCAnswerVariant,
  createStandardMockInstances,
  DEFAULT_IDS,
  expectRTCEventData,
  findSocketEmitCall,
  setupAfterEach,
  setupBeforeEach,
  testValidationError,
} from './_testHelpers';

describe('RTCAnswerHandler (RTC Answer處理)', () => {
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

  it('應成功發送RTC answer', async () => {
    const data = testData.createRTCAnswerData();

    await RTCAnswerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      RTCAnswerSchema,
      data,
      'RTCANSWER',
    );

    expect(mockSocketInstance.to).toHaveBeenCalledWith(
      DEFAULT_IDS.targetSocketId,
    );

    const rtcAnswerCall = findSocketEmitCall(mockSocketInstance, 'RTCAnswer');
    expectRTCEventData(rtcAnswerCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      answer: testData.defaultAnswer,
    });
  });

  it('應正確傳遞answer資料', async () => {
    const customAnswer = createRTCAnswerVariant(testData.defaultAnswer, {
      sdp: 'custom answer sdp data',
    });
    const data = testData.createRTCAnswerData({
      answer: customAnswer,
    });

    await RTCAnswerHandler.handle(mockIoInstance, mockSocketInstance, data);

    const rtcAnswerCall = findSocketEmitCall(mockSocketInstance, 'RTCAnswer');
    expectRTCEventData(rtcAnswerCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      answer: customAnswer,
    });
  });

  it('應正確處理不同的目標Socket ID', async () => {
    const customTargetSocketId = 'custom-target-socket';
    const data = testData.createRTCAnswerData({
      to: customTargetSocketId,
    });

    await RTCAnswerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockSocketInstance.to).toHaveBeenCalledWith(customTargetSocketId);

    const rtcAnswerCall = findSocketEmitCall(mockSocketInstance, 'RTCAnswer');
    expectRTCEventData(rtcAnswerCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      answer: testData.defaultAnswer,
    });
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const invalidData = { to: '', answer: {} };
    const validationError = new Error('Invalid answer data');

    await testValidationError(
      RTCAnswerHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '連接 RTC 失敗，請稍後再試',
    );
  });

  describe('RTC Answer 資料處理', () => {
    it('應包含正確的socket資訊', async () => {
      const data = testData.createRTCAnswerData();

      await RTCAnswerHandler.handle(mockIoInstance, mockSocketInstance, data);

      const rtcAnswerCall = findSocketEmitCall(mockSocketInstance, 'RTCAnswer');
      expect(rtcAnswerCall).toBeTruthy();
      if (rtcAnswerCall) {
        expect(rtcAnswerCall[1]).toEqual(
          expect.objectContaining({
            from: DEFAULT_IDS.socketId,
            userId: DEFAULT_IDS.operatorUserId,
            answer: expect.any(Object),
          }),
        );
      }
    });

    it('應正確處理不同類型的answer', async () => {
      const customAnswer = createRTCAnswerVariant(testData.defaultAnswer, {
        type: 'answer',
        sdp: 'v=0\r\no=custom 9876543210 9876543211 IN IP4 custom.answer.com\r\n...',
      });
      const data = testData.createRTCAnswerData({
        answer: customAnswer,
      });

      await RTCAnswerHandler.handle(mockIoInstance, mockSocketInstance, data);

      const rtcAnswerCall = findSocketEmitCall(mockSocketInstance, 'RTCAnswer');
      expectRTCEventData(rtcAnswerCall, {
        from: DEFAULT_IDS.socketId,
        userId: DEFAULT_IDS.operatorUserId,
        answer: customAnswer,
      });
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createRTCAnswerData();

      await RTCAnswerHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        RTCAnswerSchema,
        data,
        'RTCANSWER',
      );
    });

    it('應按正確順序執行發送流程', async () => {
      const data = testData.createRTCAnswerData();

      await RTCAnswerHandler.handle(mockIoInstance, mockSocketInstance, data);

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockSocketInstance.to).toHaveBeenCalledTimes(1);
    });
  });
});
