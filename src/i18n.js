(function (root) {
  const TF = (root.TF = root.TF || {});

  const dict = {
    en: {
      toolsTitle: 'TesseraFlip tools',
      close: 'Close',
      rotation: 'Rotation',
      rotationNow: 'Rotation · {n}°',
      rotateLeft: 'Rotate left ([)',
      rotateRight: 'Rotate right (])',
      reset: 'Reset',
    },
    zh: {
      toolsTitle: 'TesseraFlip 工具',
      close: '關閉',
      rotation: '旋轉',
      rotationNow: '旋轉 · {n}°',
      rotateLeft: '向左旋轉 ([)',
      rotateRight: '向右旋轉 (])',
      reset: '重置',
    },
  };

  function pick(lang) {
    return String(lang || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  function currentLang() {
    const d = root.document;
    return (d && d.documentElement && d.documentElement.lang) ||
      (root.navigator && root.navigator.language) || 'en';
  }

  function t(key, vars) {
    const lang = pick(currentLang());
    let s = (dict[lang] && dict[lang][key]) || dict.en[key] || key;
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
    return s;
  }

  TF.i18n = Object.freeze({ t, pick });
  if (typeof module !== 'undefined' && module.exports) module.exports = TF.i18n;
})(globalThis);
