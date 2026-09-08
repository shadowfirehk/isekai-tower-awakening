# 西線戰報｜第一次世界大戰

日系歷史插畫風格的一戰策略塔防。第一個完整試玩戰役為 1916 年法軍凡爾登防禦區：四種兵種、三類編制、七處陣地、20 輪攻勢、15 種戰術命令、工兵支援與指揮官專長。

## 遊玩

- [GitHub Pages 遊戲版](https://shadowfirehk.github.io/isekai-tower-awakening/)

GitHub Pages 會在 `main` 分支更新後自動建置並發布。

遊戲進度保存在玩家目前使用的瀏覽器中。新版獨立使用 `wwi-field-command-v8`；舊版存檔保留，沒有任意轉換兵種或資源。其他年份與同盟國目前只有戰役架構，尚未開放作戰。

歷史依據見遊戲內「歷史資料」；兵力、路線、20 波攻勢與資源為遊戲抽象。詳細驗收與限制見 [一戰版報告](reports/wwi-rework.md)，舊版素材封存說明見 [archive](archive/README.md)。

## 本機執行

需要 Node.js 22 或更新版本，以及 pnpm 11。

```bash
pnpm install
pnpm dev
```

正式建置：

```bash
pnpm build
```

自動戰局與存檔回歸：`pnpm test:wwi`。結果位於 `reports/wwi-balance.json`。

## 技術

- React 19
- TypeScript
- Vinext / Vite
- GitHub Actions 與 GitHub Pages

除非另有明確授權，本專案內容與美術資產保留所有權利。
