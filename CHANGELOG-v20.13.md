# v20.13 更新時不再先顯示舊版

## 問題

每次部署新版後，開啟 App 會先看到「上一個版本」，底部出現
「網站已有新版本，正在下載並切換」，要等它切換完才看得到新版。

## 根因

`sw.js` 的導覽處理把伺服器回來的 HTML 拿去比對「本 Service Worker 自己的
BUILD_ID」，只要對不上就退回快取：

```js
if (text.indexOf(BUILD_ID) < 0) {
  return caches.match('./index.html');   // 回舊版
}
```

這個判斷原意是防半套部署，但它把「伺服器比我新」也一併當成異常。
結果每次更新：

1. 下載完整新版 HTML（約 2.3 MB）
2. SW 判定「不是我的版本」→ 丟掉，改回舊快取 → 使用者看到舊版
3. 一致性檢查發現伺服器較新 → 觸發更新 → 再下載一次
4. 新 SW 接管 → 重新載入 → 終於看到新版

一次更新在 4G 上要傳約 5 MB，而且中間一定會閃一次舊版。

## 修正

改為判斷「這是不是一份完整的 App shell」，不限定版本：

```js
const BUILD_ID_PATTERN = /limu-teacher-v\d+-\d+-\d{8}/;
...
if (!BUILD_ID_PATTERN.test(text)) { 退回快取 }   // 只有真的不是 shell 才退回
if (text.indexOf(BUILD_ID) >= 0)  { 寫入本 SW 快取 }  // 只快取同版
return response;                                  // 不論版本都直接給使用者
```

半套部署（伺服器回錯誤頁或缺檔）仍會退回快取，保護不變；
但版本較新時直接呈現，第一次載入就是新版。

## 相容性

- App 版本：16.0.13／部署版本 v20.13／快取 `hw-tracker-v20-13`
- 只改 sw.js 的導覽分支，資料格式 schema v6 未變更
- Firebase、班級 ID、IndexedDB／localStorage 鍵值均未變更

## 已知待辦：首次載入速度

index.html 目前 2317 KB，其中 **1589 KB（68%）位於 `<body>` 之前**，
全部阻塞首次渲染：

| 區塊 | 大小 | 位置 |
|---|---|---|
| 內嵌美術 base64（11 張 WebP） | 1414 KB | head，阻塞 |
| `<style>` | 163 KB | head，阻塞 |
| React app 及其餘 | 727 KB | body |

`assets/` 內已有同樣的 WebP 原檔（合計 1060 KB，base64 版本多 33%）。
若改為外部引用，index.html 可降到約 900 KB、阻塞位元組降到約 175 KB。
此項尚未執行，需先確認是否要推翻 v20.4「全部內嵌」的決策。
