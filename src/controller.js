(function (root) {
  const TF = (root.TF = root.TF || {});

  function delayFor(attempt, c) {
    return Math.min(c.maxDelayMs, Math.round(c.baseDelayMs * Math.pow(c.factor, attempt)));
  }

  // Counts events inside a sliding window; once over the limit it stays
  // tripped until reset(), so a runaway loop can never keep running.
  function createWatchdog({ windowMs, maxEvents, now }) {
    const clock = now || Date.now;
    let times = [];
    let tripped = false;
    return {
      record() {
        if (tripped) return false;
        const t = clock();
        times.push(t);
        times = times.filter((x) => t - x <= windowMs);
        if (times.length > maxEvents) tripped = true;
        return !tripped;
      },
      get tripped() {
        return tripped;
      },
      reset() {
        times = [];
        tripped = false;
      },
    };
  }

  // States: idle -> searching -> attached | gaveup | halted
  function createController(opts) {
    const cfg = opts.config || TF.config;
    const doc = opts.document;
    const locate = opts.locate;
    const log = opts.log || function () {};
    const timers = opts.timers || {
      setTimeout: (f, ms) => root.setTimeout(f, ms),
      clearTimeout: (id) => root.clearTimeout(id),
    };
    const MO = opts.MutationObserver || root.MutationObserver;
    const wd = createWatchdog({ ...cfg.watchdog, now: opts.now });

    let state = 'idle';
    let current = null;
    let timer = null;
    let attempts = 0;
    let observer = null;

    function cancelTimer() {
      if (timer !== null) {
        timers.clearTimeout(timer);
        timer = null;
      }
    }

    function isValid(c) {
      return !!c && c.video.isConnected && c.player.isConnected;
    }

    function detach() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (current) {
        const c = current;
        current = null;
        try {
          if (opts.onDetach) opts.onDetach(c);
        } catch (e) {
          log('onDetach failed', e);
        }
      }
    }

    function halt() {
      cancelTimer();
      detach();
      state = 'halted';
      log('watchdog tripped; extension paused');
      if (opts.onHalt) opts.onHalt();
    }

    function attach(found) {
      // Idempotent: same live video means nothing to do.
      if (current && current.video === found.video && isValid(current)) return;
      detach();
      current = found;
      state = 'attached';
      try {
        opts.onAttach(found);
      } catch (e) {
        log('onAttach failed', e);
      }
      if (MO) {
        // Watches only for our video/player disappearing. The callback
        // never touches the DOM, so it cannot trigger itself.
        observer = new MO(() => {
          if (!isValid(current)) {
            detach();
            state = 'idle';
            schedule();
          }
        });
        observer.observe(found.player, { childList: true, subtree: true });
      }
    }

    function tryOnce() {
      timer = null;
      if (state === 'halted') return;
      if (!wd.record()) {
        halt();
        return;
      }
      const found = locate(doc);
      if (found && found.video) {
        attempts = 0;
        attach(found);
        return;
      }
      attempts += 1;
      if (attempts >= cfg.attach.maxAttempts) {
        state = 'gaveup';
        log('player not found; giving up until next navigation');
        return;
      }
      state = 'searching';
      timer = timers.setTimeout(tryOnce, delayFor(attempts - 1, cfg.attach));
    }

    function schedule() {
      if (state === 'halted') return;
      cancelTimer();
      attempts = 0;
      timer = timers.setTimeout(tryOnce, 0);
    }

    const NAV_EVENTS = ['yt-navigate-finish', 'yt-page-data-updated'];

    return {
      start() {
        NAV_EVENTS.forEach((n) => doc.addEventListener(n, schedule));
        schedule();
      },
      stop() {
        NAV_EVENTS.forEach((n) => doc.removeEventListener(n, schedule));
        cancelTimer();
        detach();
        state = 'idle';
      },
      getState: () => state,
    };
  }

  TF.createController = createController;
  TF.delayFor = delayFor;
  TF.createWatchdog = createWatchdog;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createController, delayFor, createWatchdog };
  }
})(globalThis);
