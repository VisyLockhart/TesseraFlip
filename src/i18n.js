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
      stepTitle: 'Frame step \u00b7 while paused',
      stepBack: 'Previous frame (<)',
      stepForward: 'Next frame (>)',
      stepSize: '{n} frame(s)',
      stepMult: 'Step {n} frame(s)',
      pauseFirst: 'Pause the video first',
      playing: 'Playing',
      pauseToStep: 'Pause to step frames',
      resumePlay: 'Resume playback',
      opacity: 'Opacity',
      frameTitle: 'Frame',
      saveFrame: 'Save frame',
      saveFrameTip: 'Save frame as PNG (S)',
      copyFrame: 'Copy frame',
      saved: 'Saved',
      copied: 'Copied',
      captureFailed: "Couldn't capture this frame",
    },
    zh: {
      toolsTitle: 'TesseraFlip 工具',
      close: '關閉',
      rotation: '旋轉',
      rotationNow: '旋轉 · {n}°',
      rotateLeft: '向左旋轉 ([)',
      rotateRight: '向右旋轉 (])',
      reset: '重置',
      stepTitle: '逐格跳轉 · 暫停時可用',
      stepBack: '上一格 (<)',
      stepForward: '下一格 (>)',
      stepSize: '{n} 格',
      stepMult: '每次跳 {n} 格',
      pauseFirst: '請先暫停影片',
      playing: '播放中',
      pauseToStep: '暫停以逐格跳轉',
      resumePlay: '繼續播放',
      opacity: '不透明度',
      frameTitle: '影格',
      saveFrame: '另存影格',
      saveFrameTip: '另存為 PNG (S)',
      copyFrame: '複製影格',
      saved: '已儲存',
      copied: '已複製',
      captureFailed: '無法擷取這個影格',
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
