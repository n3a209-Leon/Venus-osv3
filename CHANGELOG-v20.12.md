# v20.12 頁首與月曆共用左右邊界

## 問題

手機 390px 下，頁首各區塊與下方月曆卡片的左右邊界對不齊：

| 區塊 | 左右邊界 |
|---|---|
| 標題框／班級列／狀態列／月份列 | x = 20 → 370 |
| 月曆卡片（main） | x = 8 → 382 |

`header{padding:14px 20px 0}` 但 `main{padding:0 8px}`，兩側各差 12px，
金色框線因此看起來縮在畫面內側，與月曆卡片形成兩條不同的垂直邊界。

## 修正

1. **頁首內距對齊 main**（僅 ≤640px、僅慕夏／星雲）
   `header{padding-inline:8px}`，讓標題框、班級列、狀態列、月份列與月曆卡片
   共用同一條左右邊界。桌機版不受影響。

2. **移除頁首頂端重複且被裁切的角花**
   標題列已有自己的端飾，`header::before`／`header::after` 的花頭與它重複，
   又被 `header{overflow:hidden}` 從上緣裁掉一半。改為單純的柔光漸層。

## 相容性

- App 版本：16.0.12／部署版本 v20.12／快取 `hw-tracker-v20-12`
- 純 CSS 調整，資料格式 schema v6 未變更
- Firebase、班級 ID、IndexedDB／localStorage 鍵值均未變更

## 出貨前自檢

- version.json：`limu-teacher-v20-12-20260727` / `hw-tracker-v20-12` / `16.0.12`
- index.html 與 sw.js 同時包含上述 buildId 與 cacheName
- sw.js DEPLOYMENT_MARKER 完整
- 更新提示訊息的版本號已於 v20.11 改為動態推導，不會再顯示舊版號
