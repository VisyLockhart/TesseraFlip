const test = require('node:test');
const assert = require('node:assert');
const cfg = require('../src/config.js');
const { createStepper, snapFps, fpsFromDiffs, targetTime } = require('../src/stepper.js');

class FakeVideo extends EventTarget {
  constructor() {
    super();
    this.paused = true;
    this.currentTime = 1;
    this.duration = 100;
    this.cb = null;
    this.rvfcCalls = 0;
  }
  play() { this.paused = false; this.dispatchEvent(new Event('play')); return Promise.reject(new Error('blocked')); }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  requestVideoFrameCallback(cb) { this.cb = cb; this.rvfcCalls++; return 1; }
  feed(mediaTime) { const cb = this.cb; this.cb = null; if (cb) cb(0, { mediaTime }); }
}

test('snapFps snaps to common rates and rounds the rest', () => {
  assert.strictEqual(snapFps(29.9701), 29.97);
  assert.strictEqual(snapFps(60.02), 60);
  assert.strictEqual(snapFps(37.123), 37.12);
  assert.strictEqual(snapFps(59.94), 59.94);
  assert.strictEqual(snapFps(30), 30);
});

test('fpsFromDiffs uses the median, so a dropped frame does not skew it', () => {
  const d = Array(20).fill(1 / 60);
  d.push(3 / 60);
  assert.strictEqual(fpsFromDiffs(d), 60);
  assert.strictEqual(fpsFromDiffs([]), null);
});

test('targetTime lands mid-frame, steps both ways, and clamps', () => {
  assert.ok(Math.abs(targetTime(1.0, 30, 1, 100) - 31.5 / 30) < 1e-9);
  const fwd = targetTime(1.0, 30, 1, 100);
  assert.ok(Math.abs(targetTime(fwd, 30, -1, 100) - 30.5 / 30) < 1e-9);
  assert.ok(Math.abs(targetTime(0.01, 30, -5, 100) - 0.5 / 30) < 1e-9);
  const end = targetTime(99.99, 30, 50, 100);
  assert.ok(end < 100 && end > 99.9);
});

test('step: refused while playing, moves currentTime while paused', () => {
  const v = new FakeVideo();
  const s = createStepper({});
  s.attach(v);
  v.paused = false;
  assert.strictEqual(s.step(1), false);
  assert.strictEqual(v.currentTime, 1);
  v.paused = true;
  assert.strictEqual(s.step(1), true);
  assert.ok(v.currentTime > 1);
  s.setMultiplier(4);
  const before = v.currentTime;
  s.step(1);
  assert.ok(Math.abs(v.currentTime - before - 4 / 30) < 1e-6);
});

test('step without a video is not handled', () => {
  assert.strictEqual(createStepper({}).step(1), false);
});

test('multiplier is persisted and restored; invalid values are ignored', () => {
  let saved = null;
  const s = createStepper({ storage: { load: (cb) => cb(8), save: (v) => { saved = v; } } });
  assert.strictEqual(s.getState().mult, 8);
  s.setMultiplier(2);
  assert.strictEqual(saved, 2);
  s.setMultiplier(3);
  assert.strictEqual(s.getState().mult, 2);
});

test('fps sampling is bounded and measures 60 fps', () => {
  const v = new FakeVideo();
  const changes = [];
  const s = createStepper({ onChange: (st) => changes.push(st) });
  s.attach(v);
  v.paused = false;
  for (let i = 0; i < 200 && v.cb; i++) v.feed(i / 60);
  const st = s.getState();
  assert.strictEqual(st.fps, 60);
  assert.strictEqual(st.measured, true);
  assert.strictEqual(v.cb, null);
  assert.ok(v.rvfcCalls <= cfg.step.sampleSize + 2);
});

test('loadstart resets fps to the default and resamples', () => {
  const v = new FakeVideo();
  const s = createStepper({});
  s.attach(v);
  v.paused = false;
  for (let i = 0; i < 200 && v.cb; i++) v.feed(i / 60);
  v.dispatchEvent(new Event('loadstart'));
  assert.strictEqual(s.getState().fps, cfg.step.defaultFps);
  assert.strictEqual(s.getState().measured, false);
  assert.ok(v.cb);
});

test('detach stops the sampling loop and listeners', () => {
  const v = new FakeVideo();
  const s = createStepper({});
  s.attach(v);
  s.detach();
  const calls = v.rvfcCalls;
  v.feed(0.5);
  assert.strictEqual(v.rvfcCalls, calls);
  assert.strictEqual(s.step(1), false);
});

test('toggle: pauses a playing video, resumes a paused one, reports state', () => {
  const v = new FakeVideo();
  const states = [];
  const s = createStepper({ onChange: (st) => states.push(st.paused) });
  s.attach(v);
  v.paused = false;
  assert.strictEqual(s.toggle(), true);
  assert.strictEqual(v.paused, true);
  assert.strictEqual(s.step(1), true);
  assert.strictEqual(s.toggle(), true);
  assert.strictEqual(v.paused, false);
  assert.strictEqual(s.step(1), false);
  assert.strictEqual(states.at(-1), false);
});

test('toggle without a video is not handled; a rejected play() does not throw', async () => {
  assert.strictEqual(createStepper({}).toggle(), false);
  const v = new FakeVideo();
  const s = createStepper({});
  s.attach(v);
  assert.doesNotThrow(() => s.toggle());
  await new Promise((r) => setTimeout(r, 0));
});
