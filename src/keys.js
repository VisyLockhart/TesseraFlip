(function (root) {
  const TF = (root.TF = root.TF || {});

  function shouldIgnore(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return true;
    const t = e.target;
    if (!t) return false;
    const tag = String(t.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!t.isContentEditable;
  }

  // map: { key: actionName }. An action returning false means "not handled",
  // so the key keeps its normal YouTube behaviour.
  function createKeyHandler({ target, map, actions }) {
    function handle(e) {
      if (shouldIgnore(e)) return;
      const name = map[e.key];
      const action = name && actions[name];
      if (!action) return;
      if (action() === false) return;
      e.preventDefault();
      e.stopPropagation();
    }
    return {
      handle,
      start: () => target.addEventListener('keydown', handle, true),
      stop: () => target.removeEventListener('keydown', handle, true),
    };
  }

  TF.createKeyHandler = createKeyHandler;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createKeyHandler, shouldIgnore };
  }
})(globalThis);
