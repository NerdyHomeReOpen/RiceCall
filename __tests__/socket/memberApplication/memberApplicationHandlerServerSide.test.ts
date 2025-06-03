import { jest } from '@jest/globals';

// Mock SocketServer - 需要在jest.mock之前定義
const mockSocketServer = {
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
};

// 被測試的模組
import { MemberApplicationHandlerServerSide } from '../../../src/api/socket/events/memberApplication/memberApplicationHandlerServerSide';

// 測試設定
import { mockDatabase, mockInfo } from '../../_testSetup';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: mockSocketServer,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  userId: 'user-id-123',
  serverId: 'server-id-123',
} as const;

describe('MemberApplicationHandlerServerSide (成員申請伺服器端處理)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 預設mock回傳值
    (mockDatabase.delete.memberApplication as any).mockResolvedValue(true);
  });

  describe('deleteMemberApplication', () => {
    it('應成功刪除成員申請', async () => {
      await MemberApplicationHandlerServerSide.deleteMemberApplication(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberApplicationDelete',
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted member application'),
      );
    });

    it('應發送正確的Socket事件', async () => {
      await MemberApplicationHandlerServerSide.deleteMemberApplication(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockSocketServer.io.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockSocketServer.io.emit).toHaveBeenCalledWith(
        'serverMemberApplicationDelete',
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );
    });

    it('應記錄成功日誌', async () => {
      await MemberApplicationHandlerServerSide.deleteMemberApplication(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        `User(${DEFAULT_IDS.userId}) deleted member application(${DEFAULT_IDS.serverId})`,
      );
    });
  });
});
