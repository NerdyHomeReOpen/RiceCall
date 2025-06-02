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
- **\_testHelpers.ts**: 測試數據生成、Mock 設置、輔助斷言
- **\_testSetup.ts**: 全域 Mock 和通用工具

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

### **3. 錯誤處理**

```typescript
// ✅ 重要錯誤路徑
it('資料庫連線失敗時應返回標準錯誤', async () => {
  mockDatabase.get.user.mockRejectedValue(new Error('DB Error'));
  const result = await userService.getUser('123');
  expect(result).toMatchObject({
    error: { name: 'ServerError', message: '服務暫時不可用' },
  });
});
```

### **4. 狀態變更**

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

### **1. 使用輔助函數**

```typescript
// ✅ 好的方式
const setupPasswordTest = (userPerm: number) => {
  const channel = createChannel({ password: 'secret' });
  const user = createUser({ permission: userPerm });
  mockDatabase.get.channel.mockResolvedValue(channel);
  mockDatabase.get.user.mockResolvedValue(user);
  return { channel, user };
};

it('低權限用戶錯誤密碼應被阻止', async () => {
  const { channel } = setupPasswordTest(2);
  const result = await connectChannel({ password: 'wrong' });
  expect(result).toBeRejected();
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

## 📊 測試數量指南

### **單一 Handler/Service 建議測試數量**

- **基本功能**: 1-2 個成功案例
- **錯誤處理**: 1 個通用錯誤測試
- **權限檢查**: 3-5 個關鍵權限邊界
- **業務規則**: 2-4 個核心業務邏輯
- **邊界條件**: 1-3 個真正關鍵的邊界

**總計**: 8-15 個測試 (超過 20 個請重新檢視必要性)

---

## 🚨 警告信號

### **測試過多的徵象**

- 單一檔案超過 500 行
- 大量重複的設置代碼
- 測試描述高度相似
- 修改實作時需要修改大量測試

### **測試不足的徵象**

- 關鍵權限邊界未覆蓋
- 錯誤處理路徑未測試
- 核心業務規則未驗證
- 邊界值未檢查

---

## 🎯 實用檢查清單

### **編寫測試前問自己**

- [ ] 這個邏輯如果出錯會影響用戶嗎？
- [ ] 這是業務規則還是實作細節？
- [ ] 這個邊界條件在現實中會遇到嗎？
- [ ] 我能用更少的測試覆蓋同樣的風險嗎？

### **測試完成後檢查**

- [ ] 測試名稱清楚表達意圖
- [ ] 不依賴測試執行順序
- [ ] Mock 設置合理且最小化
- [ ] 斷言具體且有意義

---

## 💡 最佳實踐範例

### **好的測試模式**

```typescript
describe('UserPermissionService', () => {
  let testData: ReturnType<typeof createTestData>;

  beforeEach(() => {
    testData = createTestData();
    setupDefaultMocks(testData);
  });

  describe('關鍵邊界情況', () => {
    it('權限相等時應允許操作', async () => {
      const result = await checkPermission(
        createUser({ permission: 5 }),
        createUser({ permission: 5 }),
      );
      expect(result).toBe(true);
    });
  });
});
```

### **避免的反模式**

```typescript
// ❌ 避免：巨大的測試檔案
// ❌ 避免：測試實作細節
// ❌ 避免：重複的設置代碼
// ❌ 避免：模糊的測試描述
```

---

**記住**: 好的測試是**預防回歸**的安全網，不是**證明程式正確**的文件。專注於**真正重要**的邏輯，保持測試**簡潔有力**！
