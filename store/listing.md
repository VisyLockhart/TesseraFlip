# Chrome Web Store listing

Copy and paste each block into the matching field. Character limits are noted.

## Basics

- Name: `TesseraFlip`
- Category: Productivity
- Primary language: English (a Traditional Chinese translation is below)

## Summary (max 132 characters)

EN (104):
`Rotate YouTube videos in 90° steps, step through frames one by one, and save the current frame as a PNG.`

zh-TW (43):
`以 90° 為單位旋轉 YouTube 影片、逐格前後跳轉,並將目前影格存成 PNG。`

## Description (EN)

Rotate, step, and save YouTube frames.

TesseraFlip adds one small button to the YouTube player. It opens a compact panel with the tools below. Nothing else on the page is touched: only the video itself is redrawn.

ROTATE
• Turn the video 90° left or right with each click, or press [ and ].
• The video is rescaled to fit the player, including theater mode and full screen.
• Each new video starts upright.

STEP FRAME BY FRAME
• Pause, then step back or forward with the on-screen buttons or the < and > keys.
• Choose how many frames each press jumps: x1, x2, x4, or x8. Your choice is remembered.
• The frame rate is measured from the video itself and shown in the panel.
• While the video is playing, < and > keep YouTube's normal speed shortcuts.
• A play/pause button in the panel lets you switch between playing and stepping without leaving it.

SAVE THE FRAME
• Save the current frame as a PNG at the video's own resolution (not a screenshot of the screen).
• The image is turned the same way as the player, so what you see is what you save.
• Or copy the frame to the clipboard. Press S for a quick save.

COMFORT
• An opacity slider lets you see the video through the panel.
• Settings are saved on your device only.

PRIVACY
TesseraFlip runs only on youtube.com, makes no network requests, and collects no data.

NOTES
• Protected (DRM) videos may produce a black frame, because the browser does not allow reading them.
• TesseraFlip is an independent project and is not affiliated with or endorsed by YouTube or Google.

## Description (zh-TW)

旋轉、逐格、存下 YouTube 影格。

TesseraFlip 在 YouTube 播放器加入一個小按鈕,點開就是精簡的工具面板。頁面其他部分完全不受影響,只重繪影片本身。

旋轉
• 每點一次向左或向右轉 90°,也可以按 [ 和 ] 鍵。
• 旋轉後自動縮放到剛好放進播放器,劇院模式和全螢幕也適用。
• 換看另一部影片時,角度自動回到原位。

逐格跳轉
• 暫停後,用面板按鈕或鍵盤 < 和 > 往前、往後逐格。
• 每次可跳 x1、x2、x4 或 x8 格,選擇會被記住。
• 影格率直接從影片量測,並顯示在面板上。
• 播放中按 < 和 > 仍是 YouTube 原本的調速功能。
• 面板內的播放/暫停按鈕,讓你不必離開面板就能在播放和逐格之間切換。

另存影格
• 以影片原始解析度存成 PNG(不是螢幕截圖)。
• 存出的圖與播放器旋轉方向一致,所見即所得。
• 也可以複製到剪貼簿。按 S 鍵可快速另存。

使用體驗
• 不透明度滑桿讓你透過面板看到影片。
• 設定只儲存在你的裝置上。

隱私
TesseraFlip 只在 youtube.com 執行,不發出任何網路請求,也不蒐集任何資料。

附註
• 受 DRM 保護的影片可能存出全黑的影格,這是瀏覽器的限制。
• TesseraFlip 是獨立專案,與 YouTube 或 Google 無關,也未獲其背書。

## Privacy tab

- Single purpose: Add video-frame tools (rotate, frame step, save frame) to the YouTube player.
- Permission justification, `storage`: Saves two local settings, the frame-step multiplier and the panel opacity, so they persist between visits.
- Host permission justification, `https://www.youtube.com/*`: The content script must run on YouTube pages to find the video element and to add the button and panel to the player. It does not run anywhere else.
- Remote code: No. All code is in the package.
- Data usage: do not check any data-collection boxes. Certify all three statements (no sale of data, no unrelated use, no creditworthiness use).
- Privacy policy URL: https://github.com/VisyLockhart/TesseraFlip/blob/main/PRIVACY.md (the repository must be public for this link to work).

## Graphic assets

| Slot | File | Size |
| --- | --- | --- |
| Store icon | `icons/icon128.png` | 128x128 |
| Small promo tile | `store/promo-small-440x280.png` | 440x280 |
| Marquee promo tile | `store/promo-marquee-1400x560.png` | 1400x560 |
| Screenshots (1 to 5) | see `store/screenshots.md` | 1280x800 |

## Before you submit

1. `npm test`
2. `git commit` all changes, then `npm run pack` (zips only `manifest.json`, `src/` and `icons/` from the last commit into `dist/tesseraflip.zip`).
3. Upload `dist/tesseraflip.zip`.
