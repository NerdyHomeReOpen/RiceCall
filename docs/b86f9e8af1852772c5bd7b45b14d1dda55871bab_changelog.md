# 後端變更：成員申請處理

## 概述
本次後端變更主要新增了伺服器成員申請的批准功能。前端現在可以發送一個新的 Socket 事件來批准待處理的成員申請，並將申請者加入到伺服器中。

## 新增的 Socket 事件

### `approveMemberApplication`

- **描述**: 批准一個待處理的成員申請，並將申請者添加為伺服器成員。
- **請求資料結構 (Schema)**: `ApproveMemberApplicationSchema`
  - **路徑**: `src/api/socket/events/memberApplication/memberApplication.schema.ts`
  - **定義**:
    ```typescript
    import { z } from 'zod';
    import { MemberSchema } from '../member/member.schema';

    export const ApproveMemberApplicationSchema = z
      .object({
        userId: z.string().length(36), // 申請者的 userId
        serverId: z.string().length(36), // 伺服器的 serverId
        member: MemberSchema.partial().optional(), // 可選的成員屬性，例如 permissionLevel 或 nickname
      })
      .strict();
    ```
- **成功響應 (Event)**: `memberApproval`
  - **資料**:
    ```typescript
    {
      userId: string; // 被批准的成員的 userId
      serverId: string; // 相關的 serverId
    }
    ```
  - **描述**: 當成員申請成功批准後，會發送此事件。
- **錯誤響應 (Event)**: `error`
  - **描述**: 當處理成員申請時發生錯誤，會發送此事件。

## 錯誤處理

新增了兩個繼承自 `StandardizedError` 的獨立錯誤類別，以提供更具體的錯誤信息：

### `MemberApplicationNotFoundError`
- **路徑**: `src/errors/MemberApplicationNotFoundError.ts`
- **描述**: 當嘗試批准的成員申請不存在時拋出。
- **使用場景**: 如果前端發送的 `userId` 和 `serverId` 對應的成員申請在資料庫中找不到。

### `AlreadyMemberError`
- **路徑**: `src/errors/AlreadyMemberError.ts`
- **描述**: 當申請者已經是伺服器成員時拋出。
- **使用場景**: 如果前端嘗試批准的申請者已經是該伺服器的成員。

## 對前端的影響

- **新的 API 呼叫**: 前端現在可以使用 `socket.emit('approveMemberApplication', { userId: '...', serverId: '...', member: { ... } })` 來批准成員申請。
- **錯誤處理更新**: 前端需要更新其錯誤處理邏輯，以識別和處理 `MemberApplicationNotFoundError` 和 `AlreadyMemberError` 這兩個新的錯誤類型。這些錯誤將通過通用的 `error` Socket 事件發送，並包含在 `StandardizedError` 結構中。
- **事件監聽**: 前端需要監聽 `memberApproval` 事件，以確認成員申請是否成功批准。

## 替代原有方法

本次變更沒有直接替代任何現有的前端方法。它是一個新增的功能，擴展了成員管理的範疇。
