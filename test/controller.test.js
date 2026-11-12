const test = require('node:test');
const assert = require('node:assert');
const cfg = require('../src/config.js');
const { createController, delayFor } = require('../src/controller.js');
const locator = require('../src/locator.js');

function fakeTimers() {
  let id = 0;
  const q = new Map();
  return {
    setTimeout: (f, ms) => { q.set(++id, { f, ms }); return id; },
    clearTimeout: (i) => q.delete(i),
    flush(limit = 1000) {
      let n = 0;
      while (q.size) {
        if (++n > limit) throw new Error('timer loop did not terminate');
        const [i, t] = q.entries().next().value;
        q.delete(i);
        t.f();
      }
      return n;
    },
  };
}

class FakeMO {
  constructor(cb) { this.cb = cb; this.disconnected = false; FakeMO.instances.push(this); }
  observe() {}
  disconnect() { this.disconnected = true; }
}
FakeMO.instances = [];

const el = () => ({ isConnected: true });
const make = (extra) => {
  const doc = new EventTarget();
  const timers = fakeTimers();
  const calls = { attach: 0, detach: 0, halt: 0, locate: 0 };
  const state = { found: null };
  const ctl = createController({
    document: doc,
    timers,
    MutationObserver: FakeMO,
    now: () => 0,
    locate: () => { calls.locate += 1; return state.found; },
    onAttach: () => { calls.attach += 1; },
    onDetach: () => { calls.detach += 1; },
    onHalt: () => { calls.halt += 1; },
    ...extra,
  });
  return { doc, timers, calls, state, ctl };
};

test('delayFor grows and is capped', () => {
  const c = cfg.attach;
  assert.ok(delayFor(1, c) > delayFor(0, c));
  assert.strictEqual(delayFor(50, c), c.maxDelayMs);
});

test('never-found player: bounded retries, then gives up', () => {
  const { timers, calls, ctl } = make();
  ctl.start();
  const runs = timers.flush();
  assert.strictEqual(runs, cfg.attach.maxAttempts);
  assert.strictEqual(calls.locate, cfg.attach.maxAttempts);
  assert.strictEqual(ctl.getState(), 'gaveup');
});

test('attach is idempotent across repeated navigation events', () => {
  const { doc, timers, calls, state, ctl } = make();
  state.found = { player: el(), video: el() };
  ctl.start();
  timers.flush();
  doc.dispatchEvent(new Event('yt-navigate-finish'));
  timers.flush();
  assert.strictEqual(calls.attach, 1);
  assert.strictEqual(ctl.getState(), 'attached');
});

test('video removed: detaches and reattaches to the new one', () => {
  FakeMO.instances.length = 0;
  const { timers, calls, state, ctl } = make();
  const player = el();
  const v1 = el();
  state.found = { player, video: v1 };
  ctl.start();
  timers.flush();
  v1.isConnected = false;
  state.found = { player, video: el() };
  FakeMO.instances.at(-1).cb();
  timers.flush();
  assert.strictEqual(calls.detach, 1);
  assert.strictEqual(calls.attach, 2);
});

test('watchdog halts a runaway event storm', () => {
  const { doc, timers, calls, ctl } = make();
  ctl.start();
  timers.flush();
  for (let i = 0; i < 100; i++) {
    doc.dispatchEvent(new Event('yt-page-data-updated'));
    timers.flush();
  }
  assert.strictEqual(ctl.getState(), 'halted');
  assert.strictEqual(calls.halt, 1);
  assert.ok(calls.locate <= cfg.watchdog.maxEvents);
});

test('locator: no player returns null', () => {
  const doc = { querySelector: () => null };
  assert.strictEqual(locator.find(doc, cfg), null);
});

test('locator: invalid selector does not throw', () => {
  const player = { contains: () => true, querySelectorAll: () => [] };
  const video = {};
  const doc = {
    querySelector: (s) => {
      if (s === '#movie_player') return player;
      if (s === '#movie_player video.html5-main-video') throw new Error('bad selector');
      if (s === '#movie_player video') return video;
      return null;
    },
  };
  const found = locator.find(doc, cfg);
  assert.strictEqual(found.video, video);
});
