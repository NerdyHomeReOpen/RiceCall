import { jest } from '@jest/globals';

// 被測試的模組
import { CreateFriendApplicationHandler } from '../../../src/api/socket/events/friendApplication/friendApplication.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockInfo,
  mockSocketServerGetSocket,
  mockWarn,
} from '../../_testSetup';

// 錯誤類型和Schema
import { CreateFriendApplicationSchema } from '../../../src/api/socket/events/friendApplication/friendApplication.schema';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: { getSocket: require('../../_testSetup').mockSocketServerGetSocket },
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));
jest.mock('@/api/socket/events/friend/friend.handler', () => ({
  FriendHandlerServerSide: {
    createFriend: jest.fn(),
    updateFriendGroup: jest.fn(),
  },
}));

// 常用的測試ID
const DEFAULT_IDS = {
  senderId: 'sender-user-id',
  receiverId: 'receiver-user-id',
  otherUserId: 'other-user-id',
} as const;

// 測試數據
const defaultFriendApplicationData = {
  senderId: DEFAULT_IDS.senderId,
  receiverId: DEFAULT_IDS.receiverId,
  friendApplication: {
    description: '想要成為好友',
  },
};

describe('CreateFriendApplicationHandler (好友申請創建處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 建立mock socket和io實例，操作者ID設為senderId
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.senderId,
      'test-socket-id',
    );
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    mockDatabase.get.friendApplication.mockResolvedValue(null);
    mockDatabase.get.userFriendApplication.mockResolvedValue({
      senderId: DEFAULT_IDS.senderId,
      receiverId: DEFAULT_IDS.receiverId,
      description: '想要成為好友',
      createdAt: Date.now(),
    });
    (mockDatabase.set.friendApplication as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultFriendApplicationData);
  });

  it('應成功創建好友申請', async () => {
    const targetSocket = createMockSocket(
      DEFAULT_IDS.receiverId,
      'target-socket-id',
    );
    mockSocketServerGetSocket.mockReturnValue(targetSocket);

    await CreateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFriendApplicationData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalled();
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent friend application'),
    );
  });

  it('操作者不能發送非自己的好友申請', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.otherUserId;

    await CreateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFriendApplicationData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot send non-self friend applications'),
    );
  });

  it('不能發送好友申請給自己', async () => {
    const selfApplicationData = {
      ...defaultFriendApplicationData,
      senderId: DEFAULT_IDS.senderId,
      receiverId: DEFAULT_IDS.senderId,
    };
    mockDataValidator.validate.mockResolvedValue(selfApplicationData);

    await CreateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      selfApplicationData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot send friend application to self'),
    );
  });

  it('當已經發送申請時，應阻止重複發送', async () => {
    mockDatabase.get.friendApplication.mockImplementation(
      (senderId, receiverId) => {
        if (
          senderId === DEFAULT_IDS.senderId &&
          receiverId === DEFAULT_IDS.receiverId
        ) {
          return Promise.resolve({
            senderId,
            receiverId,
            description: '之前的申請',
          });
        }
        return Promise.resolve(null);
      },
    );

    await CreateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFriendApplicationData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Already sent friend application'),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await CreateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFriendApplicationData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateFriendApplicationSchema,
      defaultFriendApplicationData,
      'CREATEFRIENDAPPLICATION',
    );
  });
});
