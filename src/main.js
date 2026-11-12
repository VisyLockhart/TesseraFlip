(function (root) {
  const TF = root.TF;
  const attr = TF.config.markerAttr;
  const log = (...a) => console.debug('[TesseraFlip]', ...a);

  let ui = null;
  let video = null;

  // One small key/value store for all remembered settings.
  const settings =
    typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
      ? {
          get: (key, cb) => chrome.storage.local.get(key, (r) => cb(r && r[key])),
          set: (key, v) => chrome.storage.local.set({ [key]: v }),
        }
      : null;

  const rotator = TF.createRotator({
    documentElement: document.documentElement,
    onChange: (angle) => ui && ui.setAngle(angle),
  });

  const stepper = TF.createStepper({
    storage: settings && {
      load: (cb) => settings.get('multiplier', cb),
      save: (v) => settings.set('multiplier', v),
    },
    onChange: (st) => {
      if (!ui) return;
      ui.setStep(st);
      ui.setPaused(st.paused);
    },
  });

  const frames = TF.createFrames({ document, log });
  const saveFrame = () => frames.save(video, rotator.getAngle());
  const copyFrame = () => frames.copy(video, rotator.getAngle());

  ui = TF.createUI({
    document,
    t: TF.i18n.t,
    log,
    getState: () => ({
      angle: rotator.getAngle(),
      step: stepper.getState(),
      paused: stepper.getState().paused,
    }),
    actions: {
      rotateLeft: () => rotator.rotate(-1),
      rotateRight: () => rotator.rotate(1),
      resetRotation: () => rotator.reset(),
      stepBack: () => stepper.step(-1),
      stepForward: () => stepper.step(1),
      setMultiplier: (m) => stepper.setMultiplier(m),
      saveFrame,
      copyFrame,
      setOpacity: (v) => {
        try {
          if (settings) settings.set('opacity', v);
        } catch (_) {}
      },
    },
  });

  try {
    if (settings) settings.get('opacity', (v) => ui.setOpacity(Number(v)));
  } catch (_) {}

  const controller = TF.createController({
    document,
    locate: TF.locator.find,
    log,
    onAttach: (found) => {
      video = found.video;
      found.player.setAttribute(attr, 'attached');
      rotator.attach(found);
      stepper.attach(found.video);
      ui.mount(found);
      log('attached');
    },
    onDetach: ({ player }) => {
      ui.unmount();
      stepper.detach();
      rotator.detach();
      video = null;
      player.removeAttribute(attr);
      log('detached');
    },
  });

  // Key actions return false when they do not apply, so YouTube keeps its
  // own behaviour (for example < and > change speed while playing).
  const keys = TF.createKeyHandler({
    target: window,
    map: TF.config.keys,
    actions: {
      rotateLeft: () => rotator.rotate(-1),
      rotateRight: () => rotator.rotate(1),
      stepBack: () => stepper.step(-1),
      stepForward: () => stepper.step(1),
      saveFrame: () => {
        if (!video) return false;
        saveFrame().then((r) => ui.flash(r.ok ? TF.i18n.t('saved') : TF.i18n.t('captureFailed')));
        return true;
      },
    },
  });

  // A new video always starts upright.
  document.addEventListener('yt-navigate-start', () => rotator.reset());
  document.addEventListener('yt-navigate-finish', () => ui.ensure());

  keys.start();
  controller.start();
})(globalThis);
