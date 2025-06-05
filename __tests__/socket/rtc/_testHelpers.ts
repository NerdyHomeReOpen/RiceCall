import { jest } from '@jest/globals';
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
} from '../../_testSetup';
import {
  RTCAnswer,
  RTCAnswerRequest,
  RTCCandidate,
  RTCCandidateRequest,
  RTCOffer,
  RTCOfferRequest,
} from './_testTypes';

// 常用的測試數據ID
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetSocketId: 'target-socket-id',
  socketId: 'test-socket-id',
} as const;

// 預設時間
export const DEFAULT_TIME = 1640995200000;

// 預設 RTC Offer 資料
export const createDefaultRTCOffer = (
  overrides: Partial<RTCOffer> = {},
): RTCOffer => ({
  type: 'offer',
  sdp: 'v=0\r\no=alice 2890844526 2890844527 IN IP4 host.atlanta.com\r\n...',
  ...overrides,
});

// 預設 RTC Answer 資料
export const createDefaultRTCAnswer = (
  overrides: Partial<RTCAnswer> = {},
): RTCAnswer => ({
  type: 'answer',
  sdp: 'v=0\r\no=bob 2890844527 2890844528 IN IP4 host.atlanta.com\r\n...',
  ...overrides,
});

// 預設 RTC Candidate 資料
export const createDefaultRTCCandidate = (
  overrides: Partial<RTCCandidate> = {},
): RTCCandidate => ({
  candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54400 typ host',
  sdpMLineIndex: 0,
  sdpMid: '0',
  ...overrides,
});

// RTC Offer 變種創建函數
export const createRTCOfferVariant = (
  baseOffer: RTCOffer,
  overrides: Partial<RTCOffer>,
): RTCOffer => ({
  ...baseOffer,
  ...overrides,
});

// RTC Answer 變種創建函數
export const createRTCAnswerVariant = (
  baseAnswer: RTCAnswer,
  overrides: Partial<RTCAnswer>,
): RTCAnswer => ({
  ...baseAnswer,
  ...overrides,
});

// RTC Candidate 變種創建函數
export const createRTCCandidateVariant = (
  baseCandidate: RTCCandidate,
  overrides: Partial<RTCCandidate>,
): RTCCandidate => ({
  ...baseCandidate,
  ...overrides,
});

// 創建預設測試資料
export const createDefaultTestData = () => {
  const defaultOffer = createDefaultRTCOffer();
  const defaultAnswer = createDefaultRTCAnswer();
  const defaultCandidate = createDefaultRTCCandidate();

  // 常用的測試資料創建函數
  const createRTCOfferData = (
    overrides: Partial<RTCOfferRequest> = {},
  ): RTCOfferRequest => ({
    to: DEFAULT_IDS.targetSocketId,
    offer: defaultOffer,
    ...overrides,
  });

  const createRTCAnswerData = (
    overrides: Partial<RTCAnswerRequest> = {},
  ): RTCAnswerRequest => ({
    to: DEFAULT_IDS.targetSocketId,
    answer: defaultAnswer,
    ...overrides,
  });

  const createRTCCandidateData = (
    overrides: Partial<RTCCandidateRequest> = {},
  ): RTCCandidateRequest => ({
    to: DEFAULT_IDS.targetSocketId,
    candidate: defaultCandidate,
    ...overrides,
  });

  return {
    defaultOffer,
    defaultAnswer,
    defaultCandidate,
    // 輔助資料建立函數
    createRTCOfferData,
    createRTCAnswerData,
    createRTCCandidateData,
  };
};

// 創建標準的 Mock 實例設定
export const createStandardMockInstances = (
  operatorUserId: string = DEFAULT_IDS.operatorUserId,
  socketId: string = DEFAULT_IDS.socketId,
) => {
  const mockSocketInstance = createMockSocket(operatorUserId, socketId);
  const mockIoInstance = createMockIo();

  mockSocketInstance.data.userId = operatorUserId;

  return { mockSocketInstance, mockIoInstance };
};

// 通用的 beforeEach 設定
export const setupBeforeEach = (
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  jest.clearAllMocks();

  // Mock Date.now()
  jest.spyOn(Date, 'now').mockReturnValue(DEFAULT_TIME);

  // Data validator mock - 設定預設回傳值
  mockDataValidator.validate.mockImplementation(
    async (schema, data, part) => data,
  );
};

// 通用的 afterEach 清理
export const setupAfterEach = () => {
  jest.restoreAllMocks();
};

// 統一驗證錯誤測試輔助函數
export const testValidationError = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  invalidData: any,
  validationError: Error,
  expectedErrorMessage: string,
) => {
  jest.clearAllMocks();

  mockDataValidator.validate.mockRejectedValue(validationError);

  await handler.handle(mockIoInstance, mockSocketInstance, invalidData);

  expect(mockSocketInstance.emit).toHaveBeenCalledWith(
    'error',
    expect.objectContaining({
      message: expect.stringContaining(expectedErrorMessage),
    }),
  );
};

// 檢查 Socket 事件發送的輔助函數
export const findSocketEmitCall = (
  mockSocketInstance: any,
  eventName: string,
) => {
  const emitCalls = mockSocketInstance.to().emit.mock.calls;
  return emitCalls.find((call: any) => call[0] === eventName);
};

// 驗證 RTC 事件資料的輔助函數
export const expectRTCEventData = (
  emitCall: any,
  expectedData: {
    from: string;
    userId: string;
    [key: string]: any;
  },
) => {
  expect(emitCall).toBeTruthy();
  if (emitCall) {
    expect(emitCall[1]).toEqual(expectedData);
  }
};
