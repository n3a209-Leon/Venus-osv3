# v20.9 裝飾層修復與四主題圖示

## 修正原因

v20.5 曾加入一段「回歸 v19 緊湊結構」的 CSS，用 `!important` 把慕夏／星雲主題的所有裝飾層一次關閉。
因為它寫在樣式表最後、選擇器權重又相同，前面所有花邊規則全部失效，整個新主題只剩下 `main::before` 一層外框，
畫面看起來就像「主題沒有生效」。內嵌的 11 張 WebP 中有 8 張因此完全讀不到。

## 修正內容

- 移除 v20.5 的封殺區塊：`display:none!important` 與 `content:none!important` 兩段全部刪除。
- 恢復下列裝飾：頁首端飾、班級列飾帶、狀態區飾帶、月曆與月摘要角框、底部導覽金飾帶、
  彈窗與主題面板的卡片外框、面板橫向分隔飾帶。
- 新增缺少的 DOM：`renderOrnamentBand()` 產生狀態區與月份列之間的專用飾帶；
  `renderMuchaEmpty()` 補上 `mucha-empty-art` 空狀態花飾（先前只有 CSS，沒有元素）。
- 四個主題各自擁有向量圖示：一般模式（日輪）、星雲模式（星雲漩渦）、NERV（六角警示章）、
  慕夏（藍紫鳶尾 WebP，維持三級備援）。圖示為 inline SVG，不增加檔案體積。
- `sw.js` 的 `PRECACHE_URLS` 補上 `./assets/signature-blue-iris.webp`，
  避免每次冷啟動先 404 一次才退回內嵌圖。

## 版面影響

專用飾帶是唯一佔用高度的裝飾：桌機 42px、手機 38px，位於狀態區與月份列之間。
其餘裝飾都是 `absolute` 疊層或 `::after`，不佔版面、不接收觸控。

## 尚未使用的素材

`--limu-art-corner`（約 53 KB）目前全檔零引用，維持 v20.4 文件所述「後續局部角花來源」的保留狀態。

## 相容性

- App 版本：16.0.9／部署版本 v20.9／快取 `hw-tracker-v20-9`
- 資料格式：schema v6，未變更
- Firebase 專案、班級 ID、IndexedDB 與 localStorage 鍵值均未變更
- 可由 v20.8 直接更新，不會清除或搬移既有資料

## 部署確認

整個資料夾（含 `assets`）一起拖放到 Netlify，畫面左上角須顯示 `v16.0.9`。
