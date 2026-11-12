const test = require('node:test');
const assert = require('node:assert');
const { createRotator, nextAngle, fitScale } = require('../src/rotation.js');

test('nextAngle wraps in both directions', () => {
  assert.strictEqual(nextAngle(0, 1), 90);
  assert.strictEqual(nextAngle(270, 1), 0);
  assert.strictEqual(nextAngle(0, -1), 270);
  assert.strictEqual(nextAngle(90, -1), 0);
});

test('fitScale: 0 and 180 never scale', () => {
  const box = { w: 1241, h: 698 };
  const c = { w: 1241, h: 698 };
  assert.strictEqual(fitScale(0, box, c), 1);
  assert.strictEqual(fitScale(180, box, c), 1);
});

test('fitScale: 90 shrinks landscape video to fit container height', () => {
  const s = fitScale(90, { w: 1241, h: 698 }, { w: 1241, h: 698 });
  assert.ok(Math.abs(s - 698 / 1241) < 1e-9);
  assert.strictEqual(fitScale(270, { w: 0, h: 0 }, { w: 100, h: 100 }), 1);
});

function setup(sizes) {
  const sets = [];
  const docEl = {
    style: {
      setProperty: (k, v) => sets.push([k, v]),
      removeProperty: (k) => sets.push([k, null]),
    },
  };
  const attrs = {};
  const video = {
    offsetWidth: sizes.vw, offsetHeight: sizes.vh,
    setAttribute: (k, v) => { attrs[k] = v; },
    removeAttribute: (k) => { delete attrs[k]; },
  };
  const player = { clientWidth: sizes.cw, clientHeight: sizes.ch };
  const ros = [];
  class FakeRO {
    constructor(cb) { this.cb = cb; this.disconnected = false; ros.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const changes = [];
  const r = createRotator({ documentElement: docEl, ResizeObserver: FakeRO, onChange: (a) => changes.push(a) });
  return { r, sets, attrs, video, player, ros, changes };
}

test('rotate without a video is a no-op that reports false', () => {
  const { r, sets } = setup({ vw: 1, vh: 1, cw: 1, ch: 1 });
  assert.strictEqual(r.rotate(1), false);
  assert.strictEqual(sets.length, 0);
});

test('rotate applies attribute and variables; four turns return to upright', () => {
  const { r, sets, attrs, video, player, changes } = setup({ vw: 1241, vh: 698, cw: 1241, ch: 698 });
  r.attach({ player, video });
  assert.strictEqual(r.rotate(1), true);
  assert.strictEqual(attrs['data-tf-rot'], '90');
  assert.deepStrictEqual(sets.filter((s) => s[0] === '--tf-rot').pop(), ['--tf-rot', '90deg']);
  assert.deepStrictEqual(sets.filter((s) => s[0] === '--tf-scale').pop(), ['--tf-scale', '0.5624']);
  r.rotate(1); r.rotate(1); r.rotate(1);
  assert.strictEqual(r.getAngle(), 0);
  assert.strictEqual('data-tf-rot' in attrs, false);
  assert.deepStrictEqual(changes, [90, 180, 270, 0]);
});

test('resize re-applies scale, but identical sizes do not touch the DOM', () => {
  const { r, sets, video, player, ros } = setup({ vw: 1241, vh: 698, cw: 1241, ch: 698 });
  r.attach({ player, video });
  r.rotate(1);
  const before = sets.length;
  ros.at(-1).cb();
  assert.strictEqual(sets.length, before);
  player.clientWidth = 1920; player.clientHeight = 1080;
  ros.at(-1).cb();
  assert.ok(sets.length > before);
});

test('detach clears DOM state and disconnects; reset goes upright', () => {
  const { r, attrs, video, player, ros } = setup({ vw: 1241, vh: 698, cw: 1241, ch: 698 });
  r.attach({ player, video });
  r.rotate(-1);
  assert.strictEqual(attrs['data-tf-rot'], '270');
  r.detach();
  assert.strictEqual('data-tf-rot' in attrs, false);
  assert.strictEqual(ros.at(-1).disconnected, true);
  r.reset();
  assert.strictEqual(r.getAngle(), 0);
});
