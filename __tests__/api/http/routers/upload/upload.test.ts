import { UploadHandler } from '@/api/http/routers/upload/upload.handler';
import { createUploadTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 所有依賴
jest.mock('fs/promises');
jest.mock('sharp');
jest.mock('@/utils/logger');
jest.mock('@/middleware/data.validator');
jest.mock('@/config', () => ({
  appConfig: {
    filePrefix: 'upload-',
    serverAvatarDir: 'uploads/serverAvatars',
    userAvatarDir: 'uploads/userAvatars',
    uploadsDir: 'uploads',
    allowedMimeTypes: {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    },
  },
  serverConfig: {
    url: 'http://localhost',
  },
}));

// 匯入 mocked 模組
import { DataValidator } from '@/middleware/data.validator';
import fs from 'fs/promises';
import sharp from 'sharp';

// 正確型別定義 sharp mock
const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

describe('UploadHandler (檔案上傳處理)', () => {
  let testData: ReturnType<typeof createUploadTestData>;

  // Mock sharp 轉換鏈
  const mockSharpChain = {
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    testData = createUploadTestData();
    jest.clearAllMocks();

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue(
      testData.validRequests.userAvatar,
    );
    (fs.readdir as jest.Mock).mockResolvedValue([]);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    mockSharp.mockReturnValue(mockSharpChain as any);
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功上傳並處理圖片', async () => {
      const result = await UploadHandler.handle(
        testData.validRequests.userAvatar,
      );

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data.avatar).toBe(DEFAULT_IDS.fileName);
      expect(result.data.avatarUrl).toContain('test-avatar.webp');

      // 驗證核心流程：資料驗證 → 文件操作 → 圖片轉換
      expect(DataValidator.validate).toHaveBeenCalledWith(
        expect.any(Object),
        testData.validRequests.userAvatar,
        'UPLOAD',
      );
      expect(mockSharp).toHaveBeenCalledWith(expect.any(Buffer));
      expect(mockSharpChain.webp).toHaveBeenCalledWith({ quality: 80 });
      expect(mockSharpChain.toFile).toHaveBeenCalledWith(
        expect.stringContaining('upload-test-avatar.webp'),
      );
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理文件驗證失敗', async () => {
      // 測試無效檔案格式
      (DataValidator.validate as jest.Mock).mockResolvedValue(
        testData.invalidRequests.invalidFileFormat,
      );

      const result = await UploadHandler.handle(
        testData.invalidRequests.invalidFileFormat,
      );

      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ValidationError');
      expect(result.data.error.message).toBe('無效的檔案');
      expect(result.data.error.tag).toBe('INVALID_FILE_TYPE');

      // 驗證不會進行後續處理
      expect(mockSharp).not.toHaveBeenCalled();
    });

    it('應處理系統錯誤', async () => {
      const sharpError = new Error('Sharp conversion failed');
      mockSharpChain.toFile.mockRejectedValue(sharpError);

      const result = await UploadHandler.handle(
        testData.validRequests.userAvatar,
      );

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('上傳圖片失敗，請稍後再試');
      expect(result.data.error.part).toBe('UPLOAD');
    });
  });
});
