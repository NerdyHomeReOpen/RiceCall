import path from 'path';
import { createImageTestData } from './_testHelpers';

// Mock 所有依賴
jest.mock('fs/promises');
jest.mock('@/utils/logger');
jest.mock('@/config', () => ({
  appConfig: {
    filePrefix: 'prefix_',
  },
}));

// 匯入 mocked 模組

describe('ImagesHandler (圖片處理)', () => {
  let testData: ReturnType<typeof createImageTestData>;
  let ImagesHandler: any;

  beforeEach(() => {
    testData = createImageTestData();
    jest.clearAllMocks();

    // 清理所有模組緩存
    jest.resetModules();

    // 重新導入模組
    const {
      ImagesHandler: FreshImagesHandler,
    } = require('@/api/http/routers/images/images.handler');
    ImagesHandler = FreshImagesHandler;

    // 重新 mock fs 因為 resetModules 會清理所有 mock
    const freshFs = require('fs/promises');
    jest
      .spyOn(freshFs, 'readFile')
      .mockResolvedValue(testData.fileData.validImage);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功讀取圖片文件', async () => {
      const request = testData.validRequests.basic;

      const result = await ImagesHandler.handle(request);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toBe(testData.fileData.validImage);

      // 驗證文件路徑轉換正確：/images/path/to/image.webp -> uploads\path\to\prefix_image.webp
      const expectedPath = path.join(
        'uploads',
        'path',
        'to',
        'prefix_image.webp',
      );
      const freshFs = require('fs/promises');
      expect(freshFs.readFile).toHaveBeenCalledWith(expectedPath);
    });

    it('應正確處理預設圖片請求', async () => {
      const request = testData.validRequests.defaultImage;

      const result = await ImagesHandler.handle(request);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');

      // /images/ -> uploads/__default.webp
      const expectedPath = path.join('uploads', '__default.webp');
      const freshFs = require('fs/promises');
      expect(freshFs.readFile).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('🚀 緩存機制', () => {
    it('應從緩存返回已緩存的圖片', async () => {
      const request = testData.validRequests.basic;

      // 第一次請求 - 從文件系統讀取
      await ImagesHandler.handle(request);
      const freshFs = require('fs/promises');
      expect(freshFs.readFile).toHaveBeenCalledTimes(1);

      // 第二次請求 - 從緩存讀取
      const cachedResult = await ImagesHandler.handle(request);

      expect(cachedResult.statusCode).toBe(200);
      expect(cachedResult.message).toBe('success');
      expect(cachedResult.data).toBe(testData.fileData.validImage);

      // 驗證沒有再次讀取文件
      expect(freshFs.readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理文件不存在並包裝為 StandardizedError', async () => {
      const request = testData.invalidRequests.nonExistent;
      const enoentError = new Error('File not found');
      (enoentError as any).code = 'ENOENT';

      const freshFs = require('fs/promises');
      jest.spyOn(freshFs, 'readFile').mockRejectedValue(enoentError);

      const result = await ImagesHandler.handle(request);

      // 驗證錯誤被正確包裝
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('讀取圖片失敗，請稍後再試');
      expect(result.data.error.part).toBe('IMAGES');
    });

    it('應處理一般文件讀取錯誤', async () => {
      const request = testData.validRequests.basic;
      const readError = new Error('Permission denied');

      const freshFs = require('fs/promises');
      jest.spyOn(freshFs, 'readFile').mockRejectedValue(readError);

      const result = await ImagesHandler.handle(request);

      // 驗證一般錯誤也被包裝為 StandardizedError
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('讀取圖片失敗，請稍後再試');
    });
  });
});
