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
import { RTCCandidateHandler } from '../../../src/api/socket/events/rtc/rtc.handler';
import { RTCCandidateSchema } from '../../../src/api/socket/events/rtc/rtc.schemas';
import {
  createDefaultTestData,
  createRTCCandidateVariant,
  createStandardMockInstances,
  DEFAULT_IDS,
  expectRTCEventData,
  findSocketEmitCall,
  setupAfterEach,
  setupBeforeEach,
  testValidationError,
} from './_testHelpers';

describe('RTCCandidateHandler (RTC Candidate處理)', () => {
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

  it('應成功發送RTC candidate', async () => {
    const data = testData.createRTCCandidateData();

    await RTCCandidateHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      RTCCandidateSchema,
      data,
      'RTCCANDIDATE',
    );

    expect(mockSocketInstance.to).toHaveBeenCalledWith(
      DEFAULT_IDS.targetSocketId,
    );

    const rtcCandidateCall = findSocketEmitCall(
      mockSocketInstance,
      'RTCIceCandidate',
    );
    expectRTCEventData(rtcCandidateCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      candidate: testData.defaultCandidate,
    });
  });

  it('應正確傳遞candidate資料', async () => {
    const customCandidate = createRTCCandidateVariant(
      testData.defaultCandidate,
      {
        candidate:
          'candidate:2 1 TCP 2130706431 10.0.0.1 9 typ host tcptype active',
        sdpMLineIndex: 1,
        sdpMid: '1',
      },
    );
    const data = testData.createRTCCandidateData({
      candidate: customCandidate,
    });

    await RTCCandidateHandler.handle(mockIoInstance, mockSocketInstance, data);

    const rtcCandidateCall = findSocketEmitCall(
      mockSocketInstance,
      'RTCIceCandidate',
    );
    expectRTCEventData(rtcCandidateCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      candidate: customCandidate,
    });
  });

  it('應正確處理不同的目標Socket ID', async () => {
    const customTargetSocketId = 'custom-target-socket';
    const data = testData.createRTCCandidateData({
      to: customTargetSocketId,
    });

    await RTCCandidateHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockSocketInstance.to).toHaveBeenCalledWith(customTargetSocketId);

    const rtcCandidateCall = findSocketEmitCall(
      mockSocketInstance,
      'RTCIceCandidate',
    );
    expectRTCEventData(rtcCandidateCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      candidate: testData.defaultCandidate,
    });
  });

  it('應處理空的candidate資料', async () => {
    const data = testData.createRTCCandidateData({
      candidate: null,
    });

    await RTCCandidateHandler.handle(mockIoInstance, mockSocketInstance, data);

    const rtcCandidateCall = findSocketEmitCall(
      mockSocketInstance,
      'RTCIceCandidate',
    );
    expectRTCEventData(rtcCandidateCall, {
      from: DEFAULT_IDS.socketId,
      userId: DEFAULT_IDS.operatorUserId,
      candidate: null,
    });
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const invalidData = { to: '', candidate: {} };
    const validationError = new Error('Invalid candidate data');

    await testValidationError(
      RTCCandidateHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '連接 RTC 失敗，請稍後再試',
    );
  });

  describe('RTC Candidate 資料處理', () => {
    it('應包含正確的socket資訊', async () => {
      const data = testData.createRTCCandidateData();

      await RTCCandidateHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const rtcCandidateCall = findSocketEmitCall(
        mockSocketInstance,
        'RTCIceCandidate',
      );
      expect(rtcCandidateCall).toBeTruthy();
      if (rtcCandidateCall) {
        expect(rtcCandidateCall[1]).toEqual(
          expect.objectContaining({
            from: DEFAULT_IDS.socketId,
            userId: DEFAULT_IDS.operatorUserId,
            candidate: expect.any(Object),
          }),
        );
      }
    });

    it('應正確處理不同類型的candidate', async () => {
      const customCandidate = createRTCCandidateVariant(
        testData.defaultCandidate,
        {
          candidate:
            'candidate:3 1 UDP 2130706431 192.168.2.100 12345 typ srflx raddr 192.168.2.1 rport 54321',
          sdpMLineIndex: 2,
          sdpMid: 'audio',
        },
      );
      const data = testData.createRTCCandidateData({
        candidate: customCandidate,
      });

      await RTCCandidateHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const rtcCandidateCall = findSocketEmitCall(
        mockSocketInstance,
        'RTCIceCandidate',
      );
      expectRTCEventData(rtcCandidateCall, {
        from: DEFAULT_IDS.socketId,
        userId: DEFAULT_IDS.operatorUserId,
        candidate: customCandidate,
      });
    });

    it('應正確處理 null candidate (終止指示)', async () => {
      const data = testData.createRTCCandidateData({
        candidate: null,
      });

      await RTCCandidateHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const rtcCandidateCall = findSocketEmitCall(
        mockSocketInstance,
        'RTCIceCandidate',
      );
      expect(rtcCandidateCall).toBeTruthy();
      if (rtcCandidateCall) {
        expect(rtcCandidateCall[1].candidate).toBeNull();
      }
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createRTCCandidateData();

      await RTCCandidateHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        RTCCandidateSchema,
        data,
        'RTCCANDIDATE',
      );
    });

    it('應按正確順序執行發送流程', async () => {
      const data = testData.createRTCCandidateData();

      await RTCCandidateHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockSocketInstance.to).toHaveBeenCalledTimes(1);
    });
  });
});
