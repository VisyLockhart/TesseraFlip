const test = require('node:test');
const assert = require('node:assert');
const { sliderAlpha, bubbleLeft, CSS } = require('../src/slider.js');

test('sliderAlpha follows opacity but never drops below the floor', () => {
  assert.strictEqual(sliderAlpha(94, 0.35), 0.94);
  assert.strictEqual(sliderAlpha(20, 0.35), 0.35);
  assert.strictEqual(sliderAlpha(100, 0.35), 1);
});

test('bubbleLeft centres on the thumb at both ends and the middle', () => {
  assert.strictEqual(bubbleLeft(20, 20, 100), 'calc(0% + 8px)');
  assert.strictEqual(bubbleLeft(100, 20, 100), 'calc(100% + -8px)');
  assert.strictEqual(bubbleLeft(60, 20, 100), 'calc(50% + 0px)');
});

test('bubble is shown by an explicit class, not by hover or focus', () => {
  assert.ok(CSS.includes('.trk.show .bubble'));
  assert.ok(!CSS.includes(':hover'));
  assert.ok(!CSS.includes('focus-within'));
});

test('track and thumb colours use the opacity variable', () => {
  assert.ok(CSS.includes('rgba(91,115,138,var(--sa,1))'));
  assert.ok(CSS.includes('rgba(210,169,90,var(--sa,1))'));
});
