# 舊版內容封存

一戰版入口只載入 `components/wwi`、`lib/wwi`、`app/wwi.css`，以及共用的靜態資產路徑工具。原遊戲的 `components/game`、`lib/game`、`app/globals.css`、`app/phase78.css` 為未載入的舊版原始碼，保留作為歷史參考；不提供通往舊遊戲的導覽。

原本 `public` 的異界背景、角色、兵器／怪物圖集、社群圖片與圖標已搬至 `archive/legacy-public`，不再發布到新遊戲的靜態資產目錄。所有檔案均保留，可回復；沒有刪除玩家資料。

完整的改版前遊戲可由 Git commit `ef3d29a20ca26ec1d5b6f194723539c27c441179` 取得。

舊瀏覽器存檔鍵原封保留。一戰版使用獨立鍵 `wwi-field-command-v8`，只載入 `saveVersion: 8`；不將幻想兵種、職業、星級或素材轉成一戰資料。
