(function (root) {
  const TF = (root.TF = root.TF || {});

  function queryFirst(selectors, scope) {
    for (const sel of selectors) {
      let el = null;
      try {
        el = scope.querySelector(sel);
      } catch (_) {
        el = null; // invalid selector must never throw
      }
      if (el) return el;
    }
    return null;
  }

  function findPlayer(doc, config) {
    return queryFirst((config || TF.config).selectors.player, doc);
  }

  function area(v) {
    return (v.videoWidth || 0) * (v.videoHeight || 0) ||
      (v.clientWidth || 0) * (v.clientHeight || 0);
  }

  // Returns { player, video } or null. The video is only ever searched
  // inside the player, so hover-preview videos elsewhere are never matched.
  function find(doc, config) {
    const cfg = config || TF.config;
    const player = findPlayer(doc, cfg);
    if (!player) return null;
    let video = queryFirst(cfg.selectors.video, doc);
    if (video && !player.contains(video)) video = null;
    if (!video) {
      const all = Array.from(player.querySelectorAll('video'));
      video = all.sort((a, b) => area(b) - area(a))[0] || null;
    }
    return video ? { player, video } : null;
  }

  TF.locator = Object.freeze({ find, findPlayer });
  if (typeof module !== 'undefined' && module.exports) module.exports = TF.locator;
})(globalThis);
