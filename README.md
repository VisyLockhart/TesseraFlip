# TesseraFlip

Rotate, step, and save YouTube frames. A Chrome extension (Manifest V3).

## Planned features

- Rotate the video 90° left or right (only the video is redrawn; the rest of the YouTube UI is untouched)
- Save the current frame at the video's native resolution (PNG), in the same orientation as the rotated player
- Frame-step while paused with `<` / `>` or on-screen buttons, with x1 / x2 / x4 / x8 multipliers

UI: one icon in the player control bar opens a compact panel over the video.

## Status

- Done: player/video locator, bounded idempotent attach controller, 90° rotation, control-bar button with a panel, frame stepping, save/copy frame.
- Shortcuts (ignored while typing): `[` rotate left, `]` rotate right, `<` / `>` step back / forward one frame group while paused (while playing they keep YouTube's speed change), `S` save the frame.
- Frame step multiplier x1/x2/x4/x8 is remembered. fps is measured with `requestVideoFrameCallback` (30 until measured, shown with a leading ≈).
- Saved/copied frames are PNG at the video's native resolution and are rotated the same way as the player. Protected (DRM) videos may give a black frame.
- A new video starts upright.
- Button is inserted right before YouTube's settings button; if that anchor is missing or YouTube keeps removing it, a floating button on the player is used instead.

## Robustness rules

- Selectors live in one file (`src/config.js`).
- Attach retries are bounded; giving up is silent and re-armed only by YouTube navigation events.
- Attaching is idempotent; observers never touch the DOM they observe.
- A watchdog halts the extension if it re-evaluates too often.

## Develop

```
npm test
```

Load unpacked: open `chrome://extensions`, enable Developer mode, choose "Load unpacked", and select this folder.
