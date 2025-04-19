/**
 * 共享測試設置和輔助工具
 *
 * 此文件提供所有 Socket 相關測試所需的常用 mock 物件和設置。
 * 主要 mock 對象為與 Socket 流程本身無關的依賴，如 utils、rtcHandler 等。
 * 集中管理測試依賴，減少重複程式碼。
 *
 * 後續維護：
 * - 當 Socket 流程所使用的外部依賴有變更時，需要更新
 */

// 模擬 utils 依賴
// __tests__/socket/testSetup.js
module.exports = {
  createMocks: () => {
    // 返回所有需要的模擬物件
    const mockUtils = {
      standardizedError: class StandardizedError extends Error {
        constructor(
          error_message,
          error_type,
          error_source,
          error_code,
          status_code,
        ) {
          super(error_message);
          this.error_message = error_message;
          this.error_type = error_type;
          this.error_source = error_source;
          this.error_code = error_code;
          this.status_code = status_code;

          // 設置錯誤的名稱以便更好地識別
          this.name = this.error_type;

          // 捕獲堆棧跟踪
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StandardizedError);
          }
        }

        // 轉換為JSON時的行為
        toJSON() {
          return {
            error_message: this.error_message,
            error_type: this.error_type,
            error_source: this.error_source,
            error_code: this.error_code,
            status_code: this.status_code,
          };
        }

        // 增加更容易比較的字串化方法
        toString() {
          return JSON.stringify(this.toJSON());
        }
      },
      Logger: jest.fn().mockImplementation((moduleName) => ({
        // 如果 Logger 本身是個工廠函式
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn(),
      })),
      map: {
        deleteUserIdSessionIdMap: jest.fn(),
        deleteUserIdSocketIdMap: jest.fn(),
        createUserIdSessionIdMap: jest.fn(),
        createUserIdSocketIdMap: jest.fn(),
      },
      JWT: {
        verifyToken: jest.fn(),
        generateToken: jest.fn(),
      },

      Func: {
        validate: {
          socket: jest.fn(),
          server: jest.fn(),
          user: jest.fn(),
          message: jest.fn(),
          memberApplication: jest.fn(),
          member: jest.fn(),
          friendGroup: jest.fn(),
          friend: jest.fn(),
          channel: jest.fn(),
          friendApplication: jest.fn(),
        },
        generateUniqueDisplayId: jest.fn(),
      },
      Xp: {
        delete: jest.fn(),
        create: jest.fn(),
      },
      specialUsers: {
        getSpecialPermissionLevel: jest.fn(),
      },
      Session: {
        deleteUserIdSessionIdMap: jest.fn(),
      },
    };

    const mockDB = {
      get: {
        searchUser: jest.fn(),
        searchServer: jest.fn(),
        user: jest.fn(),
        server: jest.fn(),
        member: jest.fn(),
        message: jest.fn(),
        serverMembers: jest.fn(),
        serverUsers: jest.fn(),
        channel: jest.fn(),
        channelMessages: jest.fn(),
        channelInfoMessages: jest.fn(),
        channelChildren: jest.fn(),
        channelUsers: jest.fn(),
        directMessages: jest.fn(),
        memberApplication: jest.fn(),
        serverApplications: jest.fn(),
        serverMemberApplications: jest.fn(),
        friendGroup: jest.fn(),
        userFriendGroups: jest.fn(),
        friend: jest.fn(),
        userFriends: jest.fn(),
        friendApplication: jest.fn(),
        userFriendApplications: jest.fn(),
        serverChannels: jest.fn(),
        friendGroupFriends: jest.fn(),
        userServers: jest.fn(),
      },
      set: {
        user: jest.fn(),
        server: jest.fn(),
        channel: jest.fn(),
        userServer: jest.fn(),
        directMessage: jest.fn(),
        message: jest.fn(),
        member: jest.fn(),
        memberApplication: jest.fn(),
        serverApplication: jest.fn(),
        friendGroup: jest.fn(),
        friend: jest.fn(),
        friendApplication: jest.fn(),
      },
      delete: {
        channel: jest.fn(),
        message: jest.fn(),
        friend: jest.fn(),
        friendApplication: jest.fn(),
        friendGroup: jest.fn(),
        userServer: jest.fn(),
      },
    };

    // Mock StandardizedError
    const mockStandardizedError = class StandardizedError extends Error {
      constructor(
        error_message,
        error_type,
        error_source,
        error_code,
        status_code,
      ) {
        super(error_message);
        this.error_message = error_message;
        this.error_type = error_type;
        this.error_source = error_source;
        this.error_code = error_code;
        this.status_code = status_code;
        this.name = 'StandardizedError';
      }
    };

    return {
      mockUtils,
      mockDB,
      mockStandardizedError,
      // 其他模擬物件
    };
  },
};
