# 📋 單元測試編寫指南

## 🎯 核心原則

### 1. **80/20 法則**

- 用 20% 的測試覆蓋 80% 的關鍵邏輯
- 專注於**業務邏輯**而非實作細節
- 優先測試**失敗路徑**勝過成功路徑

### 2. **邊界優先**

- 權限邊界 (`< vs <=`, `=== vs !==`)
- 數值邊界 (null, 0, 空陣列)
- 狀態轉換邊界 (登入 → 登出、連線 → 離線)

### 3. **可維護性 > 覆蓋率**

- 寧可少測但穩定，不要多測但脆弱
- 測試應該在重構時仍然有效
- 避免測試實作細節

### 4. **DRY 原則在測試中的應用**

- 抽取共用的測試邏輯到輔助函數
- 建立統一的測試資料生成器
- 使用標準化的錯誤測試模式

---

## 📁 測試組織結構

### **檔案組織**

```
__tests__/
├── _testSetup.ts                 # 全域 Mock 設置
└── [module]/
    ├── _testTypes.ts             # 模組專用類型
    ├── _testHelpers.ts           # 模組專用輔助函數
    └── [feature].test.ts         # 具體測試檔案
```

### **輔助檔案職責**

- **\_testTypes.ts**: 共用介面和枚舉
- **\_testHelpers.ts**: 測試數據生成、Mock 設置、輔助斷言、統一錯誤測試
- **\_testSetup.ts**: 全域 Mock 和通用工具

---

## 🔧 測試輔助函數設計模式

### **1. 標準化測試資料建立**

```typescript
// ✅ 統一的 ID 管理
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
  channelId: 'channel-id-123',
} as const;

// ✅ 標準化資料建立函數
export const createDefaultUser = (
  userId: string,
  overrides: Partial<User> = {},
): User => ({
  userId,
  name: `測試用戶-${userId}`,
  avatar: 'avatar.jpg',
  status: 'online',
  // ... 其他預設值
  ...overrides,
});

// ✅ 建立測試場景套組
export const createDefaultTestData = () => {
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId);
  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId);

  const searchResults = createSearchResults();
  const updateData = createUpdateData();

  return {
    operatorUser,
    targetUser,
    searchResults,
    updateData,
    // 預定義的測試場景
    searchQueries: {
      basic: { query: '測試用戶' },
      empty: { query: '不存在的用戶' },
      special: { query: '特殊字符!@#' },
    },
  };
};
```

### **2. 統一的 Mock 設置**

```typescript
// ✅ 標準化 mock 實例建立
export const createStandardMockInstances = () => {
  const mockSocketInstance = createMockSocket(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.socketId,
  );
  const mockIoInstance = require('../../_testSetup').createMockIo();

  return { mockSocketInstance, mockIoInstance };
};

// ✅ 統一的預設 mock 設置
export const setupDefaultDatabaseMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  mockDatabase.get.user.mockImplementation(async (userId: string) => {
    if (userId === DEFAULT_IDS.operatorUserId) return testData.operatorUser;
    if (userId === DEFAULT_IDS.targetUserId) return testData.targetUser;
    return null;
  });

  mockDatabase.get.searchUser.mockResolvedValue(testData.searchResults);
  mockDatabase.set.user.mockResolvedValue(true);
  mockDataValidator.validate.mockResolvedValue({});
};
```

### **3. 專用設置函數**

```typescript
// ✅ 通用設置 (適用於大部分測試)
export const setupBeforeEach = (
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(DEFAULT_TIME);

  setupDefaultDatabaseMocks(testData);
  setupSocketMocks(testData);
};

// ✅ 特殊場景專用設置 (connect/disconnect 測試)
export const setupConnectDisconnectBeforeEach = (
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: ReturnType<typeof createDefaultTestData>,
  serverHandlers: ReturnType<typeof createMockServerHandlers>,
) => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(DEFAULT_TIME);

  // connect/disconnect 特有的 mock 設置
  mockDatabase.get.user.mockResolvedValue(testData.operatorUser);
  mockDatabase.set.user.mockResolvedValue(true);

  (serverHandlers.disconnectServer.handle as any).mockResolvedValue(undefined);
  (serverHandlers.connectServer.handle as any).mockResolvedValue(undefined);
};
```

### **4. 統一錯誤測試模式**

```typescript
// ✅ 資料庫錯誤測試輔助函數
export const testDatabaseError = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: any,
  errorType: 'get' | 'set',
  errorMessage: string,
  expectedErrorMessage: string,
) => {
  const dbError = new Error(errorMessage);

  // 先清除所有 mock 並重新設定
  jest.clearAllMocks();

  if (errorType === 'get') {
    mockDatabase.get.user.mockRejectedValue(dbError);
    mockDatabase.get.searchUser.mockRejectedValue(dbError);
  } else {
    // 確保前面的 get 操作成功，只有 set 失敗
    mockDatabase.get.user.mockResolvedValue(
      testData?.operatorUser || { userId: DEFAULT_IDS.operatorUserId },
    );
    mockDatabase.set.user.mockRejectedValue(dbError);
  }

  // 確保 validator 返回正確的數據
  if (testData) {
    mockDataValidator.validate.mockResolvedValue(testData);
  }

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  expect(mockSocketInstance.emit).toHaveBeenCalledWith(
    'error',
    expect.objectContaining({
      name: 'ServerError',
      message: expectedErrorMessage,
      tag: 'EXCEPTION_ERROR',
      statusCode: 500,
    }),
  );
};

// ✅ 驗證錯誤測試輔助函數
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
      message: expectedErrorMessage,
    }),
  );
};

// ✅ 權限檢查測試輔助函數
export const testUnauthorizedUpdate = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  unauthorizedData: UpdateUserData,
) => {
  jest.clearAllMocks();

  mockDataValidator.validate.mockResolvedValue(unauthorizedData);
  mockSocketInstance.data = { userId: DEFAULT_IDS.operatorUserId };

  await handler.handle(mockIoInstance, mockSocketInstance, unauthorizedData);

  // 檢查權限失敗的行為：不執行更新操作
  expect(mockDatabase.set.user).not.toHaveBeenCalled();
  expect(mockSocketInstance.emit).not.toHaveBeenCalledWith(
    'userUpdate',
    expect.anything(),
  );
};
```

### **5. 清理函數**

```typescript
// ✅ 統一的清理
export const setupAfterEach = () => {
  jest.restoreAllMocks();
};
```

---

## ✅ 該測試的場景

### **1. 核心業務邏輯**

```typescript
// ✅ 好的測試
it('應防止低權限用戶訪問管理功能', async () => {
  const lowPermUser = createUser({ permission: 1 });
  const result = await adminHandler(lowPermUser);
  expect(result).toThrowError('權限不足');
});
```

### **2. 邊界條件**

```typescript
// ✅ 關鍵邊界
it('權限等級相等時應允許操作', async () => {
  const user1 = createUser({ permission: 5 });
  const user2 = createUser({ permission: 5 });
  const result = await moveUser(user1, user2);
  expect(result).toBeSuccessful();
});
```

### **3. 錯誤處理 - 使用統一輔助函數**

```typescript
// ✅ 使用標準化錯誤測試
it('應處理資料庫錯誤', async () => {
  await testDatabaseError(
    SearchUserHandler,
    mockSocketInstance,
    mockIoInstance,
    testData.searchQueries.basic,
    'get',
    'Database connection failed',
    '搜尋使用者失敗，請稍後再試',
  );
});

it('應處理驗證錯誤', async () => {
  const invalidData = { query: '' };
  const validationError = new Error('搜尋關鍵字不能為空');

  await testValidationError(
    SearchUserHandler,
    mockSocketInstance,
    mockIoInstance,
    invalidData,
    validationError,
    '搜尋使用者失敗，請稍後再試',
  );
});
```

### **4. 權限檢查**

```typescript
// ✅ 使用統一權限測試
it('應拒絕更新其他用戶的資料', async () => {
  const otherUserUpdateData = createUpdateData(DEFAULT_IDS.targetUserId, {
    name: '嘗試更新其他用戶',
  });

  await testUnauthorizedUpdate(
    UpdateUserHandler,
    mockSocketInstance,
    mockIoInstance,
    otherUserUpdateData,
  );
});
```

### **5. 狀態變更**

```typescript
// ✅ 重要狀態轉換
it('用戶離開頻道時應清理相關資源', async () => {
  await connectToChannel(user, channel);
  await disconnectFromChannel(user);

  expect(mockXpSystem.delete).toHaveBeenCalledWith(user.id);
  expect(user.currentChannelId).toBeNull();
});
```

---

## ❌ 不該測試的場景

### **1. 實作細節**

```typescript
// ❌ 過度細節
it('應按正確順序發送 Socket 事件', async () => {
  await connectToChannel(user, channel);

  // 測試 emit 調用順序是實作細節
  expect(socket.emit).toHaveBeenNthCalledWith(1, 'leave');
  expect(socket.emit).toHaveBeenNthCalledWith(2, 'join');
});
```

### **2. 框架行為**

```typescript
// ❌ 測試框架
it('Express 路由應正確解析參數', async () => {
  // Express 已經有自己的測試，不需要再測
});
```

### **3. 簡單對應**

```typescript
// ❌ 無邏輯的對應
it('不同語音模式應發送對應訊息', async () => {
  // 純字串對應，沒有業務邏輯
  expect(getVoiceMessage('free')).toBe('voiceChangeToFreeSpeech');
  expect(getVoiceMessage('queue')).toBe('voiceChangeToQueue');
});
```

### **4. 已有反例的正例**

```typescript
// ❌ 重複測試
// 如果已經測試了權限不足的情況
// 就不需要再測試權限足夠的每一種情況
```

---

## 🔧 測試代碼品質

### **1. 使用標準化測試設置**

```typescript
// ✅ 好的方式 - 使用統一的測試資料和設置
describe('SearchUserHandler (搜尋用戶處理)', () => {
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

  it('應成功搜尋用戶', async () => {
    const searchData = createSearchData('測試用戶');

    mockDataValidator.validate.mockResolvedValue(searchData);
    mockDatabase.get.searchUser.mockResolvedValue(testData.searchResults);

    await SearchUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      searchData,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'userSearch',
      testData.searchResults,
    );
  });
});
```

### **2. 使用 describe 分組**

```typescript
describe('權限檢查', () => {
  describe('密碼保護', () => {
    // 相關測試
  });

  describe('頻道限制', () => {
    // 相關測試
  });
});
```

### **3. 清晰的測試名稱**

```typescript
// ✅ 清晰的意圖
it('若操作者權限 < 5，移動其他使用者應失敗');

// ❌ 模糊的描述
it('應正確處理權限');
```

---

## 🚀 測試輔助函數最佳實踐

### **1. 統一的常數管理**

```typescript
// ✅ 使用集中管理的 ID
export const DEFAULT_IDS = {
  /* ... */
};

// ✅ 統一的預設時間
export const DEFAULT_TIME = 1640995200000;
```

### **2. 彈性的資料建立器**

```typescript
// ✅ 支援覆寫的預設資料建立
export const createDefaultUser = (
  userId: string,
  overrides: Partial<User> = {},
): User => ({
  userId,
  name: `測試用戶-${userId}`,
  status: 'online',
  ...overrides, // 允許覆寫任何欄位
});

// ✅ 批量建立資料
export const createUsers = (
  count: number,
  baseOverrides: Partial<User> = {},
): User[] => {
  return Array.from({ length: count }, (_, index) =>
    createDefaultUser(`user-${index + 1}`, {
      ...baseOverrides,
      name: `測試用戶${index + 1}`,
    }),
  );
};
```

### **3. 場景特化的設置函數**

```typescript
// ✅ 根據不同測試需求提供專用設置
export const setupBeforeEach = (/* 一般測試 */) => {
  /* ... */
};
export const setupConnectDisconnectBeforeEach = (/* 連接測試 */) => {
  /* ... */
};
export const setupPermissionBeforeEach = (/* 權限測試 */) => {
  /* ... */
};
```

### **4. Mock 重置的一致性**

```typescript
// ✅ 在錯誤測試輔助函數中確保 mock 狀態一致
export const testDatabaseError = async (...) => {
  // 重要：先清除所有 mock
  jest.clearAllMocks();

  // 然後設定特定的錯誤情境
  if (errorType === 'set') {
    // 確保前置操作成功，只有目標操作失敗
    mockDatabase.get.user.mockResolvedValue(testData?.operatorUser);
  }

  // ...
};
```

---

## 📊 測試數量指南

### **單一 Handler/Service 建議測試數量**

- **基本功能**: 1-2 個成功案例
- **錯誤處理**: 2-3 個 (使用統一輔助函數)
  - 資料庫錯誤
  - 驗證錯誤
  - 權限錯誤 (如適用)
- **權限檢查**: 2-3 個關鍵權限邊界
- **業務規則**: 2-4 個核心業務邏輯
- **邊界條件**: 1-3 個真正關鍵的邊界

**總計**: 8-15 個測試 (超過 20 個請重新檢視必要性)

---

## 🚨 警告信號

### **測試過多的徵象**

- 單一檔案超過 500 行
- 大量重複的設置代碼 (應抽取到輔助函數)
- 測試描述高度相似
- 修改實作時需要修改大量測試

### **測試不足的徵象**

- 關鍵權限邊界未覆蓋
- 錯誤處理路徑未測試
- 核心業務規則未驗證
- 邊界值未檢查

### **輔助函數設計不當的徵象**

- 測試間有大量重複的 mock 設置代碼
- beforeEach 設置過於複雜或通用性不足
- 錯誤測試邏輯散落在各個測試中
- 測試資料建立不一致

---

## 🎯 實用檢查清單

### **編寫測試前問自己**

- [ ] 這個邏輯如果出錯會影響用戶嗎？
- [ ] 這是業務規則還是實作細節？
- [ ] 這個邊界條件在現實中會遇到嗎？
- [ ] 我能用更少的測試覆蓋同樣的風險嗎？
- [ ] 是否有現成的輔助函數可以簡化測試？

### **測試完成後檢查**

- [ ] 測試名稱清楚表達意圖
- [ ] 不依賴測試執行順序
- [ ] Mock 設置合理且最小化
- [ ] 斷言具體且有意義
- [ ] 使用了適當的輔助函數避免重複代碼

### **輔助函數檢查清單**

- [ ] 建立了統一的測試資料生成器
- [ ] 實現了標準化的錯誤測試函數
- [ ] 提供了場景特化的設置函數
- [ ] 確保 mock 重置的一致性
- [ ] 測試間的重複代碼已抽取

---

## 💡 最佳實踐範例

### **完整的測試模組結構**

```typescript
// _testHelpers.ts
export const DEFAULT_IDS = { /* ... */ };
export const createDefaultTestData = () => { /* ... */ };
export const setupBeforeEach = (...) => { /* ... */ };
export const testDatabaseError = async (...) => { /* ... */ };

// feature.test.ts
describe('FeatureHandler', () => {
  let testData: ReturnType<typeof createDefaultTestData>;
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    testData = createDefaultTestData();
    const mockInstances = createStandardMockInstances();
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功處理有效請求', async () => {
    // 使用 testData 中的預設資料
    // 簡潔的測試邏輯
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(/* ... */);
  });
});
```

### **避免的反模式**

```typescript
// ❌ 避免：巨大的測試檔案
// ❌ 避免：測試實作細節
// ❌ 避免：重複的設置代碼
// ❌ 避免：模糊的測試描述
// ❌ 避免：手寫重複的錯誤測試邏輯
```

---

**記住**: 好的測試是**預防回歸**的安全網，不是**證明程式正確**的文件。專注於**真正重要**的邏輯，使用**統一的輔助函數**保持測試**簡潔有力**且**易於維護**！
