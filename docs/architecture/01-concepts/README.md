# 核心概念 (Core Concepts)

本章節介紹支撐 RiceCall 雙平台架構的兩大支柱：**平台抽象層**與**處理器模式**。

## 文件列表

1. **[平台抽象層 (Platform Abstraction)](./platform-abstraction.md)**
   - 解釋 `src/platform/` 目錄結構。
   - 說明 Interface / Factory / Implementation 模式。

2. **[處理器模式 (Handler Pattern)](./handler-pattern.md)**
   - 解釋為何要將邏輯從 `main.ts` 移出。
   - 說明 `HandlerContext` 的依賴注入機制。
