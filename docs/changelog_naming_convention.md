# 更新日誌檔案命名規範

## 目的
本文件旨在規範後端更新日誌檔案的命名方式，以確保檔案命名的一致性、可追溯性和易於管理。

## 命名格式
所有後端更新日誌檔案應遵循以下命名格式：

`[github_commit_id]_changelog.md`

- `[github_commit_id]`: 這是指與本次變更相關的 GitHub Commit ID。您可以在 GitHub 上的提交歷史中找到它，或者使用 Git 命令（例如 `git log`）來獲取。這確保了每個更新日誌檔案都能直接追溯到其對應的程式碼變更。
- `_changelog.md`: 這是固定的後綴，用於標識該檔案為更新日誌文件，並指定其為 Markdown 格式。

## 範例
如果某次後端變更的 GitHub Commit ID 是 `b86f9e8af1852772c5bd7b45b14d1dda55871bab`，則其對應的更新日誌檔案名稱應為：

`b86f9e8af1852772c5bd7b45b14d1dda55871bab_changelog.md`

## 存放位置
所有更新日誌檔案應統一存放在專案根目錄下的 `docs/` 目錄中。
