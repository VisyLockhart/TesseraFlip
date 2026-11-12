const test = require('node:test');
const assert = require('node:assert');
const { canvasSize, formatStamp, sanitizeName, filename, capture } = require('../src/frame.js');

test('canvasSize swaps sides only at 90 and 270', () => {
  assert.deepStrictEqual(canvasSize(1920, 1080, 0), { w: 1920, h: 1080 });
  assert.deepStrictEqual(canvasSize(1920, 1080, 180), { w: 1920, h: 1080 });
  assert.deepStrictEqual(canvasSize(1920, 1080, 90), { w: 1080, h: 1920 });
  assert.deepStrictEqual(canvasSize(1920, 1080, 270), { w: 1080, h: 1920 });
});

test('formatStamp and filename', () => {
  assert.strictEqual(formatStamp(83.45), '01m23s450');
  assert.strictEqual(formatStamp(3725.5), '01h02m05s500');
  assert.strictEqual(filename('Big Buck Bunny - YouTube', 83.45, 0), 'Big Buck Bunny_01m23s450.png');
  assert.strictEqual(filename('x', 1, 90), 'x_00m01s000_r90.png');
});

test('sanitizeName strips illegal characters and never returns empty', () => {
  assert.strictEqual(sanitizeName('a/b:c*d?'), 'a_b_c_d_');
  assert.strictEqual(sanitizeName(''), 'youtube');
});

function fakeDoc() {
  const calls = [];
  const ctx = {
    translate: (...a) => calls.push(['translate', ...a]),
    rotate: (...a) => calls.push(['rotate', ...a]),
    drawImage: (...a) => calls.push(['drawImage', ...a.slice(1)]),
  };
  const canvas = { getContext: () => ctx, toBlob: (cb) => cb('BLOB') };
  return { calls, canvas, doc: { createElement: () => canvas } };
}

test('capture: native size, rotated clockwise about the centre', async () => {
  const { calls, canvas, doc } = fakeDoc();
  const video = { videoWidth: 1920, videoHeight: 1080, readyState: 4 };
  const blob = await capture(video, 90, doc);
  assert.strictEqual(blob, 'BLOB');
  assert.strictEqual(canvas.width, 1080);
  assert.strictEqual(canvas.height, 1920);
  assert.deepStrictEqual(calls[0], ['translate', 540, 960]);
  assert.deepStrictEqual(calls[1], ['rotate', Math.PI / 2]);
  assert.deepStrictEqual(calls[2], ['drawImage', -960, -540, 1920, 1080]);
});

test('capture rejects when no frame is available', async () => {
  const { doc } = fakeDoc();
  await assert.rejects(capture({ videoWidth: 0, videoHeight: 0, readyState: 0 }, 0, doc));
  await assert.rejects(capture({ videoWidth: 10, videoHeight: 10, readyState: 1 }, 0, doc));
});
