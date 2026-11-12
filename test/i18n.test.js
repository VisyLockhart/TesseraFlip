const test = require('node:test');
const assert = require('node:assert');
const { pick } = require('../src/i18n.js');

test('pick: zh variants map to zh, everything else to en', () => {
  assert.strictEqual(pick('zh-TW'), 'zh');
  assert.strictEqual(pick('ZH-hant'), 'zh');
  assert.strictEqual(pick('en-US'), 'en');
  assert.strictEqual(pick(''), 'en');
  assert.strictEqual(pick(undefined), 'en');
});

test('t: interpolates and falls back to the key', () => {
  const { t } = require('../src/i18n.js');
  assert.strictEqual(t('rotationNow', { n: 90 }).includes('90'), true);
  assert.strictEqual(t('no.such.key'), 'no.such.key');
});
