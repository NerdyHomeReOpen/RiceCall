# 資料與認證 (Data & Auth)

本文件說明 RiceCall 如何處理數據獲取 (Data Fetching) 與使用者認證 (Authentication)。這些邏輯被設計為跨平台共用 (Shared Handlers)，位於 `src/platform/ipc/handlers/shared/` 目錄下。

## 1. 資料服務 (Data Service)

資料服務主要負責與後端 API 進行互動，並將結果回傳給前端 UI。

### 1.1 架構

- **位置**: `src/platform/ipc/handlers/shared/data.ts`
- **依賴**: `src/data.service.ts` (實際發送 HTTP 請求的服務)

所有資料請求都透過 `data-*` 開頭的 IPC 通道進行。這確保了無論是 Electron 還是 Web，UI 層都能使用統一的介面取得資料。

### 1.2 支援的資料類型

目前支援以下主要資料類型的 CRUD 與查詢：

- **使用者 (User)**: `data-user`, `data-searchUser`
- **好友 (Friend)**: `data-friend`, `data-friends`, `data-friendApplication`
- **伺服器 (Server)**: `data-server`, `data-servers`, `data-searchServer`, `data-recommendServers`
- **頻道 (Channel)**: `data-channel`, `data-channels`
- **成員 (Member)**: `data-member`, `data-serverMembers`
- **公告與通知**: `data-announcements`, `data-notifications`

### 1.3 範例流程

1. UI 呼叫 `ipc.invoke('data-user', { userId: '123' })`。
2. IPC 層將請求轉發至 `shared/data.ts` 中的 Handler。
3. Handler 呼叫 `DataService.user({ userId: '123' })`。
4. `DataService` 發送 HTTP GET 請求至 RiceCall API。
5. 結果經由 IPC 回傳至 UI。

## 2. 認證系統 (Authentication System)

認證系統處理使用者的登入、註冊與登出流程。它採用了 **Provider Pattern**，由平台層 (Platform Layer) 注入具體的實作。

### 2.1 架構

- **位置**: `src/platform/ipc/handlers/shared/auth.ts`
- **介面定義**: `AuthProvider`
  ```typescript
  export interface AuthProvider {
    login: (formData: any) => Promise<any>;
    logout: () => Promise<void>;
    register: (formData: any) => Promise<any>;
    autoLogin: (token: string) => Promise<any>;
  }
  ```

### 2.2 IPC 通道

- `auth-login`: 處理登入表單提交。
- `auth-logout`: 處理使用者登出。
- `auth-register`: 處理註冊。
- `auth-auto-login`: 處理 Token 自動登入。

## 3. 帳號管理 (Account Management)

除了認證本身，我們還需要管理「已記住的帳號」列表，以便快速切換或自動填入。這部分由 `Accounts Handler` 處理。

### 3.1 架構

- **位置**: `src/platform/ipc/handlers/shared/accounts.ts`
- **儲存**: 使用 `ctx.storage` (Electron Store 或 LocalStorage) 儲存帳號資訊。
- **Key**: `accounts`

### 3.2 功能

- **同步 (Sync)**:
  - `get-accounts`: 取得所有已儲存的帳號資訊。
- **操作 (Send)**:
  - `add-account`: 新增或更新一組帳號密碼。會觸發 `accounts` 廣播事件。
  - `delete-account`: 刪除指定帳號。會觸發 `accounts` 廣播事件。

## 4. 安全性考量

- 在 Web 版中，密碼等敏感資訊儲存在 `LocalStorage`，建議使用者不要在公用電腦使用「記住密碼」功能。
- 在 Electron 版中，使用 `electron-store` 進行本地文件儲存。
