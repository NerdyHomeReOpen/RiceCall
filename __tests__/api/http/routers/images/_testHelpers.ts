export const DEFAULT_IDS = {
  imageFile: 'test-image.webp',
  defaultFile: '__default.webp',
  filePrefix: 'prefix_',
  invalidFile: 'nonexistent.webp',
} as const;

export const DEFAULT_TIME = 1640995200000; // 2022-01-01 00:00:00

// 創建簡化的 mock IncomingMessage 對象
const createMockIncomingMessage = (url: string): any => ({
  url,
  aborted: false,
  httpVersion: '1.1',
  httpVersionMajor: 1,
  httpVersionMinor: 1,
  complete: true,
  connection: null,
  socket: null,
  headers: {},
  rawHeaders: [],
  trailers: {},
  rawTrailers: [],
  method: 'GET',
  statusCode: null,
  statusMessage: null,
  readable: true,
  readableEncoding: null,
  readableEnded: false,
  readableFlowing: null,
  readableHighWaterMark: 16384,
  readableLength: 0,
  readableObjectMode: false,
  destroyed: false,
  closed: false,
  errored: null,
});

export interface ImageTestData {
  validRequests: {
    basic: any;
    withQuery: any;
    defaultImage: any;
  };
  invalidRequests: {
    nonExistent: any;
    invalidPath: any;
  };
  fileData: {
    validImage: Buffer;
    largeImage: Buffer;
  };
}

export const createImageTestData = (): ImageTestData => {
  // 創建模擬的圖片數據
  const validImageBuffer = Buffer.from('mock-image-data');
  const largeImageBuffer = Buffer.alloc(1024, 'large-image-data');

  return {
    validRequests: {
      basic: createMockIncomingMessage('/images/path/to/image.webp'),
      withQuery: createMockIncomingMessage(
        '/images/path/to/image.webp?v=123&cache=false',
      ),
      defaultImage: createMockIncomingMessage('/images/'),
    },
    invalidRequests: {
      nonExistent: createMockIncomingMessage(
        '/images/path/to/nonexistent.webp',
      ),
      invalidPath: createMockIncomingMessage('/images/invalid//path.webp'),
    },
    fileData: {
      validImage: validImageBuffer,
      largeImage: largeImageBuffer,
    },
  };
};

export const createMockRequest = (url: string): any =>
  createMockIncomingMessage(url);

// 輔助函數：創建緩存相關的測試
export const createCacheTestScenario = () => {
  const cacheKey = 'path/to/prefix_image.webp';
  const cachedData = Buffer.from('cached-image-data');

  return {
    cacheKey,
    cachedData,
    request: createMockIncomingMessage('/images/path/to/image.webp'),
  };
};
