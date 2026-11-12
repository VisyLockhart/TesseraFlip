(function (root) {
  const TF = (root.TF = root.TF || {});

  const COMMON_FPS = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 120];

  // Pick the nearest common rate (29.97 and 30 are only 0.1% apart, so
  // "first within tolerance" would be wrong); outside 0.5% keep the raw value.
  function snapFps(x) {
    let best = null;
    for (const c of COMMON_FPS) {
      const d = Math.abs(x - c) / c;
      if (d < 0.005 && (best === null || d < best.d)) best = { c, d };
    }
    return best ? best.c : Math.round(x * 100) / 100;
  }

  function median(a) {
    const s = a.slice().sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function fpsFromDiffs(diffs) {
    if (!diffs.length) return null;
    const m = median(diffs);
    return m > 0 ? snapFps(1 / m) : null;
  }

  // Land in the middle of the target frame so a small fps error can never
  // push us onto a neighbouring frame, and repeated steps do not drift.
  function targetTime(current, fps, n, duration) {
    const idx = Math.floor(current * fps + 1e-6);
    let next = Math.max(0, idx + n);
    if (Number.isFinite(duration) && duration > 0) {
      const last = Math.max(0, Math.floor(duration * fps - 1e-6));
      if (next > last) next = last;
    }
    let t = (next + 0.5) / fps;
    if (Number.isFinite(duration) && duration > 0) t = Math.min(t, Math.max(0, duration - 0.001));
    return Math.max(0, t);
  }

  function createStepper(opts) {
    const cfg = (opts.config || TF.config).step;
    const storage = opts.storage || null;
    const onChange = opts.onChange || function () {};

    let video = null;
    let fps = cfg.defaultFps;
    let measured = false;
    let mult = cfg.multipliers[0];
    let token = 0;
    let listeners = null;

    function state() {
      return { mult, fps, measured, paused: video ? video.paused : true };
    }
    function emit() {
      onChange(state());
    }

    // Bounded: stops after sampleSize samples, and rVFC only fires when a
    // new frame is shown, so a paused video costs nothing.
    function startSampling() {
      const v = video;
      if (!v || typeof v.requestVideoFrameCallback !== 'function') return;
      const mine = ++token;
      const samples = [];
      let last = null;
      const loop = (_now, meta) => {
        if (mine !== token || v !== video) return;
        if (!v.paused && meta && typeof meta.mediaTime === 'number') {
          if (last !== null) {
            const d = meta.mediaTime - last;
            if (d > 0.004 && d < 0.2) samples.push(d);
          }
          last = meta.mediaTime;
        } else {
          last = null;
        }
        if (samples.length >= cfg.sampleSize) {
          const f = fpsFromDiffs(samples);
          if (f) {
            fps = f;
            measured = true;
            emit();
          }
          return;
        }
        v.requestVideoFrameCallback(loop);
      };
      v.requestVideoFrameCallback(loop);
    }

    function resetFps() {
      fps = cfg.defaultFps;
      measured = false;
      startSampling();
      emit();
    }

    function detach() {
      token++;
      if (video && listeners) {
        for (const [n, f] of listeners) video.removeEventListener(n, f);
      }
      listeners = null;
      video = null;
    }

    if (storage) {
      try {
        storage.load((v) => {
          if (cfg.multipliers.includes(v)) {
            mult = v;
            emit();
          }
        });
      } catch (_) {}
    }

    return {
      attach(v) {
        detach();
        video = v;
        listeners = [
          ['play', emit],
          ['pause', emit],
          ['loadstart', resetFps],
          ['emptied', resetFps],
        ];
        for (const [n, f] of listeners) v.addEventListener(n, f);
        fps = cfg.defaultFps;
        measured = false;
        startSampling();
        emit();
      },
      detach,
      // false = not handled (playing, or nothing attached), so the key keeps
      // its normal YouTube meaning.
      step(dir) {
        if (!video || !video.paused) return false;
        video.currentTime = targetTime(video.currentTime, fps, dir * mult, video.duration);
        return true;
      },
      // Pause when playing, resume when paused. false = nothing attached.
      toggle() {
        if (!video) return false;
        if (video.paused) {
          const p = video.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } else {
          video.pause();
        }
        return true;
      },
      setMultiplier(m) {
        if (!cfg.multipliers.includes(m)) return;
        mult = m;
        try {
          if (storage) storage.save(m);
        } catch (_) {}
        emit();
      },
      getState: state,
    };
  }

  TF.createStepper = createStepper;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createStepper, snapFps, fpsFromDiffs, targetTime };
  }
})(globalThis);
