# TesseraFlip

Rotate, step, and save YouTube frames. A Chrome extension (Manifest V3).

## Planned features

- Rotate the video 90° left or right (only the video is redrawn; the rest of the YouTube UI is untouched)
- Save the current frame at the video's native resolution (PNG)
- Frame-step while paused with `<` / `>` or on-screen buttons, with x1 / x2 / x4 / x8 multipliers

UI: one icon in the player control bar opens a compact panel over the video.

## Status

Skeleton only: player/video locator and a bounded, idempotent attach controller. Features are not implemented yet.

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
