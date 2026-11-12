(function (root) {
  const TF = root.TF;
  const attr = TF.config.markerAttr;
  const log = (...a) => console.debug('[TesseraFlip]', ...a);

  let ui = null;
  const rotator = TF.createRotator({
    documentElement: document.documentElement,
    onChange: (angle) => ui && ui.setAngle(angle),
  });

  ui = TF.createUI({
    document,
    t: TF.i18n.t,
    log,
    getAngle: () => rotator.getAngle(),
    actions: {
      rotateLeft: () => rotator.rotate(-1),
      rotateRight: () => rotator.rotate(1),
      resetRotation: () => rotator.reset(),
    },
  });

  const controller = TF.createController({
    document,
    locate: TF.locator.find,
    log,
    onAttach: (found) => {
      found.player.setAttribute(attr, 'attached');
      rotator.attach(found);
      ui.mount(found);
      log('attached');
    },
    onDetach: ({ player }) => {
      ui.unmount();
      rotator.detach();
      player.removeAttribute(attr);
      log('detached');
    },
  });

  const keys = TF.createKeyHandler({
    target: window,
    map: TF.config.keys,
    actions: {
      rotateLeft: () => rotator.rotate(-1),
      rotateRight: () => rotator.rotate(1),
    },
  });

  // A new video always starts upright.
  document.addEventListener('yt-navigate-start', () => rotator.reset());
  document.addEventListener('yt-navigate-finish', () => ui.ensure());

  keys.start();
  controller.start();
})(globalThis);
