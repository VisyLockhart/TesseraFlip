(function (root) {
  const TF = (root.TF = root.TF || {});

  // All YouTube-specific knowledge lives here. When YouTube changes its
  // markup, this is the only file that should need editing.
  TF.config = Object.freeze({
    markerAttr: 'data-tesseraflip',
    selectors: Object.freeze({
      player: ['#movie_player', '.html5-video-player'],
      video: [
        '#movie_player video.html5-main-video',
        '#movie_player video',
        '.html5-video-player video',
      ],
    }),
    // Bounded retry: give up after maxAttempts, never loop forever.
    attach: Object.freeze({
      maxAttempts: 10,
      baseDelayMs: 200,
      maxDelayMs: 2000,
      factor: 1.6,
    }),
    // Safety net: too many attach evaluations in a window halts the extension.
    watchdog: Object.freeze({ windowMs: 60000, maxEvents: 30 }),
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = TF.config;
})(globalThis);
