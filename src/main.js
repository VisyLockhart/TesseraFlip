(function (root) {
  const TF = root.TF;
  const attr = TF.config.markerAttr;
  const log = (...a) => console.debug('[TesseraFlip]', ...a);

  const controller = TF.createController({
    document,
    locate: TF.locator.find,
    log,
    onAttach: ({ player }) => {
      player.setAttribute(attr, 'attached');
      log('attached');
    },
    onDetach: ({ player }) => {
      player.removeAttribute(attr);
      log('detached');
    },
  });

  controller.start();
})(globalThis);
