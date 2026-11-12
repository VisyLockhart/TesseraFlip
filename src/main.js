(function (root) {
  const TF = root.TF;
  const attr = TF.config.markerAttr;
  const log = (...a) => console.debug('[TesseraFlip]', ...a);

  const rotator = TF.createRotator({ documentElement: document.documentElement });

  const controller = TF.createController({
    document,
    locate: TF.locator.find,
    log,
    onAttach: (found) => {
      found.player.setAttribute(attr, 'attached');
      rotator.attach(found);
      log('attached');
    },
    onDetach: ({ player }) => {
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

  keys.start();
  controller.start();
})(globalThis);
