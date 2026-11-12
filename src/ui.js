(function (root) {
  const TF = (root.TF = root.TF || {});
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const STOP = ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'contextmenu', 'wheel', 'touchstart'];

  const ICON_ENTRY = ['M12 4l7 8-7 8-7-8z', 'M20 4.5v4h-4'];
  const ICON_ROT_RIGHT = ['M21 12a9 9 0 1 1-3.2-6.9', 'M21 3.5v5h-5'];
  const ICON_CLOSE = ['M6 6l12 12', 'M18 6L6 18'];
  const ICON_PREV = ['M15 6l-6 6 6 6'];
  const ICON_NEXT = ['M9 6l6 6-6 6'];
  const ICON_SAVE = ['M12 4v10', 'M8 10l4 4 4-4', 'M5 19h14'];
  const ICON_COPY = ['M9 9h10v11H9z', 'M5 15V4h10'];

  const PANEL_CSS = [
    '.panel{box-sizing:border-box;width:248px;padding:12px;border-radius:12px;background:rgba(28,28,28,.94);color:#fff;font:13px/1.4 Roboto,Arial,"Noto Sans TC",sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.4)}',
    '.hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}',
    '.ttl{font-weight:500;font-size:14px}',
    '.lbl{color:rgba(255,255,255,.7);font-size:12px;margin-bottom:6px}',
    '.row{display:flex;gap:6px}',
    'button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:4px;height:32px;min-width:32px;padding:0 10px;border:1px solid rgba(255,255,255,.22);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font:inherit}',
    'button:hover{background:rgba(255,255,255,.18)}',
    'button:focus-visible{outline:2px solid #3ea6ff;outline-offset:1px}',
    'button.ghost{border-color:transparent;background:transparent;min-width:28px;height:28px;padding:0}',
    '.sec{margin-top:12px}',
    '.grow{flex:1}',
    '.val{flex:1;display:flex;align-items:center;justify-content:center;font-size:13px}',
    'button.chip{height:26px;min-width:34px;padding:0 6px}',
    'button.on{background:rgba(62,166,255,.25);border-color:#3ea6ff}',
    'button.dim,button.dim:hover{opacity:.3;cursor:not-allowed;background:rgba(255,255,255,.04);border-style:dashed}',
    '.val.muted{color:rgba(255,255,255,.55)}',
    '.fps{margin-left:auto;align-self:center;font-size:11px;white-space:nowrap;color:rgba(255,255,255,.6)}',
    '.st{min-height:16px;margin-top:10px;font-size:12px;color:rgba(255,255,255,.85)}',
    'svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
  ].join('\n');

  function createUI(opts) {
    const doc = opts.document;
    const cfg = opts.config || TF.config;
    const t = opts.t;
    const actions = opts.actions;
    const log = opts.log || function () {};
    const MO = opts.MutationObserver || root.MutationObserver;
    const wd = TF.createWatchdog({ ...cfg.watchdog });

    let player = null;
    let btn = null;
    let host = null;
    let label = null;
    let stepLabel = null;
    let fpsEl = null;
    let statusEl = null;
    let stepBtns = [];
    let curStep = null;
    let isPaused = true;
    let valEl = null;
    const chips = new Map();
    let flashTimer = null;
    let mode = 'none';
    let open = false;
    let attempts = 0;
    let timer = null;
    let remountTimer = null;
    let observer = null;

    function el(tag, attrs, kids) {
      const e = doc.createElement(tag);
      for (const k of Object.keys(attrs || {})) {
        if (k === 'text') e.textContent = attrs[k];
        else e.setAttribute(k, attrs[k]);
      }
      (kids || []).forEach((c) => e.appendChild(c));
      return e;
    }

    function svg(paths, flip) {
      const s = doc.createElementNS(SVG_NS, 'svg');
      s.setAttribute('viewBox', '0 0 24 24');
      s.setAttribute('aria-hidden', 'true');
      paths.forEach((d) => {
        const p = doc.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', d);
        s.appendChild(p);
      });
      if (flip) s.style.transform = 'scaleX(-1)';
      return s;
    }

    function panelButton(cls, title, kids, onClick) {
      const b = el('button', { type: 'button', class: cls, title, 'aria-label': title }, kids);
      b.addEventListener('click', onClick);
      return b;
    }

    function setOpen(v) {
      open = v;
      host.style.display = v ? 'block' : 'none';
      btn.setAttribute('aria-expanded', String(v));
      if (v) doc.addEventListener('pointerdown', onOutside, true);
      else doc.removeEventListener('pointerdown', onOutside, true);
    }

    function onOutside(e) {
      const path = e.composedPath ? e.composedPath() : [];
      if (path.includes(host) || path.includes(btn)) return;
      setOpen(false);
    }

    // While playing, the centre text says so (muted); while paused it shows
    // how many frames one press jumps.
    function renderStepLabel() {
      if (!stepLabel) return;
      valEl.classList.toggle('muted', !isPaused);
      if (!isPaused) stepLabel.textContent = t('playing');
      else if (curStep) stepLabel.textContent = t('stepSize', { n: curStep.mult });
    }

    function flash(text) {
      if (!statusEl) return;
      statusEl.textContent = text;
      root.clearTimeout(flashTimer);
      flashTimer = root.setTimeout(() => {
        statusEl.textContent = '';
      }, 2500);
    }

    function build() {
      if (btn) return;
      btn = el('button', {
        type: 'button',
        class: 'ytp-button tf-entry',
        'aria-label': t('toolsTitle'),
        title: t('toolsTitle'),
        'aria-haspopup': 'dialog',
        'aria-expanded': 'false',
      }, [svg(ICON_ENTRY)]);
      btn.addEventListener('click', () => setOpen(!open));

      host = el('div', { 'data-tf-panel': '' });
      host.style.cssText = 'position:absolute;right:12px;bottom:80px;z-index:2000;display:none;';
      const shadow = host.attachShadow({ mode: 'open' });
      const style = el('style');
      style.textContent = PANEL_CSS;

      label = el('div', { class: 'lbl', text: t('rotation') });
      const rotRow = el('div', { class: 'row' }, [
        panelButton('', t('rotateLeft'), [svg(ICON_ROT_RIGHT, true)], () => actions.rotateLeft()),
        panelButton('', t('rotateRight'), [svg(ICON_ROT_RIGHT)], () => actions.rotateRight()),
        panelButton('', t('reset'), [el('span', { text: t('reset') })], () => actions.resetRotation()),
      ]);

      const doStep = (fn) => {
        if (fn() === false) flash(t('pauseFirst'));
      };
      stepLabel = el('span');
      const back = panelButton('', t('stepBack'), [svg(ICON_PREV)], () => doStep(actions.stepBack));
      const fwd = panelButton('', t('stepForward'), [svg(ICON_NEXT)], () => doStep(actions.stepForward));
      stepBtns = [back, fwd];
      valEl = el('div', { class: 'val' }, [stepLabel]);
      const stepRow = el('div', { class: 'row' }, [back, valEl, fwd]);
      fpsEl = el('span', { class: 'fps' });
      const chipRow = el('div', { class: 'row', style: 'margin-top:6px' });
      cfg.step.multipliers.forEach((m) => {
        const c = panelButton('chip', t('stepMult', { n: m }), [el('span', { text: 'x' + m })], () =>
          actions.setMultiplier(m)
        );
        chips.set(m, c);
        chipRow.appendChild(c);
      });
      chipRow.appendChild(fpsEl);

      const report = (okKey) => (r) => flash(r && r.ok ? t(okKey) : t('captureFailed'));
      const saveBtn = panelButton('grow', t('saveFrameTip'), [svg(ICON_SAVE), el('span', { text: t('saveFrame') })], () =>
        Promise.resolve(actions.saveFrame()).then(report('saved'))
      );
      const copyBtn = panelButton('', t('copyFrame'), [svg(ICON_COPY)], () =>
        Promise.resolve(actions.copyFrame()).then(report('copied'))
      );
      statusEl = el('div', { class: 'st', 'aria-live': 'polite' });

      const header = el('div', { class: 'hd' }, [
        el('span', { class: 'ttl', text: 'TesseraFlip' }),
        panelButton('ghost', t('close'), [svg(ICON_CLOSE)], () => {
          setOpen(false);
          btn.focus();
        }),
      ]);
      const panel = el('div', { class: 'panel', role: 'dialog', 'aria-label': t('toolsTitle') }, [
        header,
        el('div', {}, [label, rotRow]),
        el('div', { class: 'sec' }, [el('div', { class: 'lbl', text: t('stepTitle') }), stepRow, chipRow]),
        el('div', { class: 'sec' }, [
          el('div', { class: 'lbl', text: t('frameTitle') }),
          el('div', { class: 'row' }, [saveBtn, copyBtn]),
        ]),
        statusEl,
      ]);
      shadow.appendChild(style);
      shadow.appendChild(panel);

      // Keep the player from reacting to clicks or keys meant for our panel.
      STOP.forEach((ev) => host.addEventListener(ev, (e) => e.stopPropagation()));
      host.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          btn.focus();
        }
        e.stopPropagation();
      });
    }

    function stopObserve() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }

    function findAnchor() {
      for (const sel of cfg.selectors.settingsButton) {
        let a = null;
        try {
          a = player.querySelector(sel);
        } catch (_) {
          a = null;
        }
        if (a && a.parentElement) return a;
      }
      return null;
    }

    function float() {
      stopObserve();
      btn.classList.add('tf-float');
      if (btn.parentElement !== player) player.appendChild(btn);
      mode = 'float';
    }

    function placeInBar(anchor) {
      const parent = anchor.parentElement;
      if (btn.parentElement !== parent || btn.nextSibling !== anchor) {
        parent.insertBefore(btn, anchor);
      }
      btn.classList.remove('tf-float');
      mode = 'bar';
      stopObserve();
      if (MO) {
        let scope = null;
        for (const sel of cfg.selectors.controls) {
          try {
            scope = player.querySelector(sel);
          } catch (_) {
            scope = null;
          }
          if (scope) break;
        }
        // The callback only reads; it never touches the DOM it watches.
        observer = new MO(() => {
          if (!btn.isConnected) scheduleRemount();
        });
        observer.observe(scope || parent, { childList: true, subtree: true });
      }
    }

    function tryMount() {
      timer = null;
      if (!player) return;
      if (!host.isConnected) player.appendChild(host);
      if (!wd.record()) {
        log('ui watchdog tripped; using floating button');
        float();
        return;
      }
      const anchor = findAnchor();
      if (anchor) {
        attempts = 0;
        placeInBar(anchor);
        return;
      }
      attempts += 1;
      if (attempts >= cfg.attach.maxAttempts) {
        log('control bar anchor not found; using floating button');
        float();
        return;
      }
      timer = root.setTimeout(tryMount, TF.delayFor(attempts - 1, cfg.attach));
    }

    function scheduleRemount() {
      if (!player) return;
      if (wd.tripped) {
        float();
        return;
      }
      root.clearTimeout(remountTimer);
      remountTimer = root.setTimeout(() => {
        remountTimer = null;
        attempts = 0;
        tryMount();
      }, 150);
    }

    function unmount() {
      root.clearTimeout(timer);
      root.clearTimeout(remountTimer);
      timer = null;
      remountTimer = null;
      stopObserve();
      if (btn) {
        setOpen(false);
        btn.remove();
        host.remove();
      }
      player = null;
      mode = 'none';
    }

    return {
      mount(found) {
        build();
        unmount();
        player = found.player;
        attempts = 0;
        const st = opts.getState ? opts.getState() : { angle: 0, step: null, paused: true };
        this.setAngle(st.angle);
        if (st.step) this.setStep(st.step);
        this.setPaused(st.paused);
        timer = root.setTimeout(tryMount, 0);
      },
      unmount,
      // Called on navigation: re-mount if YouTube dropped us or we are floating.
      ensure() {
        if (!player || !btn) return;
        if (mode !== 'bar' || !btn.isConnected || !host.isConnected) scheduleRemount();
      },
      setAngle(a) {
        if (!label) return;
        label.textContent = a === 0 ? t('rotation') : t('rotationNow', { n: a });
      },
      setPaused(paused) {
        isPaused = paused;
        stepBtns.forEach((b) => b.classList.toggle('dim', !paused));
        renderStepLabel();
      },
      setStep(st) {
        if (!stepLabel) return;
        curStep = st;
        chips.forEach((c, m) => c.classList.toggle('on', m === st.mult));
        fpsEl.textContent = (st.measured ? '' : '\u2248') + st.fps + ' fps';
        renderStepLabel();
      },
      flash,
      getMode: () => mode,
      isOpen: () => open,
    };
  }

  TF.createUI = createUI;
  if (typeof module !== 'undefined' && module.exports) module.exports = { createUI };
})(globalThis);
