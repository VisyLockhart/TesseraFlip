const test = require('node:test');
const assert = require('node:assert');
const { createKeyHandler, shouldIgnore } = require('../src/keys.js');
const cfg = require('../src/config.js');

const ev = (o) => {
  const e = { key: '', target: { tagName: 'DIV' }, prevented: 0, stopped: 0, ...o };
  e.preventDefault = () => { e.prevented++; };
  e.stopPropagation = () => { e.stopped++; };
  return e;
};

test('shouldIgnore: typing targets and modifier keys', () => {
  assert.strictEqual(shouldIgnore(ev({ target: { tagName: 'INPUT' } })), true);
  assert.strictEqual(shouldIgnore(ev({ target: { tagName: 'TEXTAREA' } })), true);
  assert.strictEqual(shouldIgnore(ev({ target: { tagName: 'DIV', isContentEditable: true } })), true);
  assert.strictEqual(shouldIgnore(ev({ ctrlKey: true })), true);
  assert.strictEqual(shouldIgnore(ev({})), false);
});

test('mapped key runs action and is consumed', () => {
  let n = 0;
  const h = createKeyHandler({ target: {}, map: cfg.keys, actions: { rotateRight: () => { n++; return true; } } });
  const e = ev({ key: ']' });
  h.handle(e);
  assert.strictEqual(n, 1);
  assert.strictEqual(e.prevented, 1);
});

test('action returning false leaves the key alone', () => {
  const h = createKeyHandler({ target: {}, map: cfg.keys, actions: { rotateLeft: () => false } });
  const e = ev({ key: '[' });
  h.handle(e);
  assert.strictEqual(e.prevented, 0);
});

test('unmapped keys and typing contexts are ignored', () => {
  let n = 0;
  const h = createKeyHandler({ target: {}, map: cfg.keys, actions: { rotateLeft: () => { n++; }, rotateRight: () => { n++; } } });
  h.handle(ev({ key: 'a' }));
  h.handle(ev({ key: ']', target: { tagName: 'INPUT' } }));
  assert.strictEqual(n, 0);
});
