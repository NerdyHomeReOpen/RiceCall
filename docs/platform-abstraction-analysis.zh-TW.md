# RiceCall 平台抽象化可行性分析（Electron → Web）

> 目的：把底層與 Electron/本機相關操作抽象化，讓核心邏輯可移植到瀏覽器並支援 CI/CD。
>
> 範圍：**僅針對目前 repo 程式碼做分析評估，不修改任何程式碼。**
>
> 參考檔案（本次分析主要依據）：
>
> - `main.ts`（Electron main process：所有 OS/本機能力集中處）
> - `src/ipc.ts`（Renderer 對主程式的 IPC 抽象；非 Electron 會大量降級 return 預設值/空函式）
> - `src/utils/popup.ts`、`src/app/popup/page.tsx`（popup 呼叫與 UI 端呈現）

---

## TL;DR（先給結論）

### 「100% 做不到」要先定義 100% 是什麼

- 若 100% 的意思是：**Web 版功能與桌面版能力/體驗完全等價（桌面 = Web，不降級）**
  - ✅ 這在目前需求/程式碼結構下 **確實做不到**。
  - 原因：你們現有功能包含 OS 層級能力（tray、開機自啟、全域 hotkey、always on top、loopback audio、桌面 auto-updater、任意路徑寫檔、列舉系統字體等），Web 的安全模型不允許等價。

- 若 100% 的意思是：**把 Electron/本機操作抽象成平台介面，讓 core/業務邏輯可在 Web 上跑**
  - ✅ 這是**做得到的**，而且你們已經有雛形：`src/ipc.ts`。
  - 差異點應由 **Platform Adapter** 承接：ElectronAdapter / WebAdapter。

### 但「做不到就空函式」是高風險策略

你們目前在 `src/ipc.ts` 的確用了大量「非 Electron → return 預設值/空函式」的策略。

- 這對「先讓程式跑起來」有效
- 但若要正式支援 Web 版，**空函式會造成靜默失敗**（UI 看起來成功、實際沒有任何效果），帶來 UX 與資料一致性問題。

建議至少把能力拆成三態：

- supported & implemented
- supported but needs permission/user gesture/backend
- not supported (explicit error/feature flag/hide UI)

---

## 目前 repo 的平台耦合點盤點（以 `src/ipc.ts` 的 API 為準）

### 已存在的「抽象層雛形」：`src/ipc.ts`

`src/ipc.ts` 使用以下模式：

- 透過 `window.require('electron')` 取得 `ipcRenderer`
- `const isElectron = !!ipcRenderer`
- 於非 Electron 時大量方法直接 `return`（預設值/空 unsubscribe）

這代表：你們目前已經把許多「平台能力」集中在 `ipc` 這個 facade 上。

---

## 前端組提出的幾個說法：逐條驗證

### 1) 「並不能 100% 替換」

這句話若指「等價替換能力」：*成立*。

原因：`main.ts` 集中大量只存在於 Electron/Node/OS 的能力，例如：

- `electron-updater` auto updater
- `Tray`、`Menu`、`nativeImage`
- `app.setLoginItemSettings()`（開機自啟）
- Node `fs/path/net/stream`
- `font-list`（列舉系統字體）
- `electron-audio-loopback-josh`（loopback audio）
- 以 `BrowserWindow` 建立多視窗 popup

Web 端無法完全等價。

但若指「抽象成 interface」：*不成立*（抽象是可行的）。

你們已經用 `src/ipc.ts` 做了第一層抽象；接下來的工作是補齊 WebAdapter 的行為契約，而不是停止抽象。

---

### 2) 「有些東西網頁版做不到，比如自動存檔」

這句話要看「自動存檔」的定義。

#### A. 若指「靜默寫入到使用者指定資料夾/固定路徑」

在 Electron 你們目前做得到（`main.ts` 有 `fs` 與 `recordSavePath` 等設定；`ipc.record.save()` 會送到主程式處理）。

在 Web：

- **不能**任意寫檔到使用者檔案系統固定路徑
- 多數情況 **不能**靜默寫入（即使使用 File System Access API，也受權限/互動/相容性限制）

➡️ 因此「桌面等價的自動存檔」在 Web 端 **確實做不到**。

#### B. 若指「自動保存資料（設定/草稿/狀態）」

Web 其實完全做得到：

- `IndexedDB` / `localStorage` 保存設定或草稿
- 或透過後端儲存，做到跨裝置同步

➡️ 所以若自動存檔指的是廣義「持久化」，那不是做不到，是要拆清楚語意。

#### C. 對照你們專案實際需求：錄音輸出（偏 A 類）

`src/ipc.ts` 可見：

- `ipc.record.save(record: ArrayBuffer)`
- `ipc.record.savePath.select()`（Electron dialog）

Web 的合理替代：

- 下載檔案（`Blob` + `a[download]`）
- 或 File System Access API（有相容性與 UX 限制）
- 或上傳到後端（變雲端錄音）

**注意：空函式會造成「看起來存了、實際沒存」**，風險很高。

---

### 3) 「popup 的呼叫跟實現完全不一樣，從邏輯層次上就長得不一樣」

這句話就「實作形態」而言：*成立*。

#### Electron popup：本質是第二個 `BrowserWindow`

`main.ts` 的 `createPopup(type, id, initialData, ...)`：

- `new BrowserWindow(...)`
- `popups[id].loadURL(`${BASE_URI}/popup?type=${type}&id=${id}`)`
- 用 `ipcMain.on('open-popup'...)` 進入建立流程
- 用 `ipcMain.on('popup-submit'...)` 做跨視窗訊息
- 用 `ipcMain.on('close-popup'...)` 控制視窗
- 提供 `get-initial-data?id=${id}` 的 sync 回傳

前端呼叫在 `src/utils/popup.ts`：

- `ipc.popup.open(type, id, initialData)`
- `ipc.popup.onSubmit(host, cb)`

UI 呈現在 `src/app/popup/page.tsx`：

- popup header 的 minimize/maximize/close 直接呼叫 `ipc.window.*`
- 根據 `type`/`id` 來渲染不同 popup component

#### Web popup：典型是 Modal / Drawer / Route overlay

Web 端通常是：

- 在同一個 window 內用 React modal
- 或 route-based popup
- 或 `window.open`（但有 popup blocker / 通訊機制差異）

因此「完全一樣」做不到很正常。

#### 但「因此不能抽象」不成立

你們其實已經有 interface 雛形：

- `ipc.popup.open(type, id, initialData)`
- `ipc.popup.close(id)`
- `ipc.popup.submit(to, data)`
- `ipc.popup.onSubmit(host, callback)`

抽象方向是：把 **popup 的契約** 定成 UI 可依賴的行為（open/close/submit/initialData），由不同平台 adapter 來實作。

> 補充觀察：`ipc.popup.onSubmit()` 有 `ipcRenderer.removeAllListeners('popup-submit')` 的全域副作用，這在多 popup/多訂閱場景比較危險；WebAdapter 做法會更需要明確的事件語意（非本次需求，但抽象設計時要注意）。

---

## 哪些能力在 Web 端很難做到「等價」？（依目前程式碼）

以下列的是「Web 無法 1:1 等價」的能力；但多數仍可做替代/降級。

1) **OS 全域快捷鍵 / global hotkey**
   - e.g. `hotKeyOpenMainWindow`、`hotKeyIncreaseVolume` 等
   - Web 無 OS-global hotkey；只能在頁面 focus 時攔截。

2) **開機自啟（autoLaunch/login item）**
   - Electron 可 `app.setLoginItemSettings()`
   - Web 不可。

3) **Tray / close-to-tray / flashFrame / alwaysOnTop**
   - Tray 與視窗管理屬 OS 權限。
   - Web 不可等價。

4) **桌面 auto updater（`electron-updater`）**
   - Web 更新語意是部署即更新 / PWA service worker update。
   - 不等價但可替代。

5) **列舉系統字體 `font-list`**
   - Web 不能完整列舉系統字體清單。

6) **任意路徑寫檔 / 靜默存檔**
   - Web 的檔案系統權限受限制。

7) **loopback audio（抓系統輸出聲音）**
   - Electron 可使用 native 能力
   - Web 非常受限（可能要走螢幕分享 system audio、權限與 UX 不同）。

8) **Discord RPC（桌面 presence）**
   - Web 通常做不到同等整合（可改後端或其他 integration）。

---

## 抽象化建議（不改碼的設計結論）

### 1) 把「平台能力」視為 Adapter，不是把 Electron code 搬去 Web

建議抽象層分為：

- **Core（可跨平台）**：domain state / business rules / UI state machine
- **Platform adapters**：
  - ElectronAdapter：實作 tray/hotkey/fs/dialog/window-control/updater 等
  - WebAdapter：用 Web API/後端/降級策略來實作

你們目前的 `ipc` 其實已是 ElectronAdapter 的一種 facade。

### 2) 不建議用「空函式」當正式方案

可以允許「暫時空」，但正式化時應改成：

- **顯式回傳 not supported**（例如回傳 `false`、`null` 之外，最好附帶 reason）
- UI 要能 hide/disable 或提醒
- 或改成 feature flag

### 3) 對 CI/CD 的含意

- Web 版只要有穩定的 WebAdapter，核心邏輯即可在 browser runtime（甚至 headless）跑測試
- Electron-only 的能力則可透過 mock adapter 測試介面契約

---

## 結論

- 「Web 版完全等價」：**真的做不到**（是能力邊界，不是工程偷懶）。
- 「抽象化讓 core 可移植」：**做得到**，你們 `src/ipc.ts` 已經在做一部分。
- 風險點不是「能不能抽象」，而是：
  - 抽象層契約是否明確
  - 不支援能力是否採用「明確降級」而非「靜默空函式」
  - popup 的語意（多視窗 vs modal）如何在 core 層用一致語言描述

---

## PoC：Popup 抽象化（已實作）

為了驗證「popup 無法整合」是否為真，本 repo 已加入一個**最小可行**的 popup 平台抽象層：

- `src/platform/popup/types.ts`：`PopupController` 契約
- `src/platform/popup/electronPopupController.ts`：Electron adapter（包裝既有 `ipc.popup.*`）
- `src/platform/popup/webPopupController.ts`：Web adapter（PoC 版：用 `/popup` route + `window.open` + `BroadcastChannel`）
- `src/platform/popup/index.ts`：`getPopupController()` 依環境選擇 adapter

並已將 `src/utils/popup.ts` 的 popup 呼叫改為走 `getPopupController()`。

### Web PoC 行為說明

- `open()`：把 `initialData` 寫入 `sessionStorage`（key: `ricecall:popup:initialData:<id>`），然後開啟 `/popup?type=...&id=...`。
- `/popup` 頁面（`src/app/popup/page.tsx`）已支援：
   - Electron：沿用 `ipc.initialData.get(id)`
   - Web：改從 `sessionStorage` 讀取 initialData
- `submit/onSubmit`：使用 `BroadcastChannel('ricecall-popup-submit')` 做同源通訊

> 這個 PoC 只用來證明「可以用同一套契約描述 popup 行為」；後續若要改成 DOM modal，只需要替換 Web adapter 的 `open/close/submit` 實作，不必改動呼叫端。
