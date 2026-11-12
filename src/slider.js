(function (root) {
  const TF = (root.TF = root.TF || {});
  const THUMB = 16;

  // The slider's own parts follow the panel's opacity too, but never fade
  // below a floor, so it can always be found and dragged back up.
  const CSS = [
    'input[type=range]{-webkit-appearance:none;appearance:none;display:block;width:100%;height:20px;margin:0;background:transparent;cursor:pointer}',
    'input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:rgba(91,115,138,var(--sa,1))}',
    'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;box-sizing:border-box;width:16px;height:16px;margin-top:-6px;border-radius:50%;background:rgba(210,169,90,var(--sa,1));border:2px solid rgba(20,24,31,var(--sa,1))}',
    'input[type=range]:focus-visible{outline:2px solid #3ea6ff;outline-offset:2px;border-radius:4px}',
    '.trk{position:relative;flex:1}',
    '.bubble{position:absolute;bottom:24px;min-width:34px;padding:2px 6px;box-sizing:border-box;text-align:center;font-weight:500;font-size:12px;background:#1a2430;border:1px solid #4a5d70;border-radius:4px;transform:translateX(-50%);opacity:0;pointer-events:none;transition:opacity .12s}',
    '.trk.show .bubble{opacity:1}',
  ].join('\n');

  function sliderAlpha(opacity, floor) {
    return Math.max(floor, opacity / 100);
  }

  // Keeps the bubble centred over the 16px thumb, including at both ends.
  function bubbleLeft(value, min, max) {
    const pct = (value - min) / (max - min);
    return 'calc(' + pct * 100 + '% + ' + (0.5 - pct) * THUMB + 'px)';
  }

  function createSlider(o) {
    const doc = o.document;
    const range = doc.createElement('input');
    range.type = 'range';
    range.min = String(o.min);
    range.max = String(o.max);
    range.step = '1';
    range.value = String(o.value);
    range.setAttribute('aria-label', o.label);
    const bubble = doc.createElement('div');
    bubble.className = 'bubble';
    const trk = doc.createElement('div');
    trk.className = 'trk';
    trk.appendChild(bubble);
    trk.appendChild(range);

    let dragging = false;
    let hideTimer = null;

    function place() {
      bubble.textContent = range.value;
      bubble.style.left = bubbleLeft(Number(range.value), o.min, o.max);
    }
    function show() {
      trk.classList.add('show');
      root.clearTimeout(hideTimer);
    }
    function hideSoon(ms) {
      root.clearTimeout(hideTimer);
      hideTimer = root.setTimeout(() => {
        if (!dragging) trk.classList.remove('show');
      }, ms);
    }
    function endDrag() {
      dragging = false;
      doc.removeEventListener('pointerup', endDrag, true);
      doc.removeEventListener('pointercancel', endDrag, true);
      hideSoon(400);
    }

    // The bubble is visible only while dragging, or briefly after a keyboard
    // change. It is never tied to focus or hover, so it cannot get stuck.
    range.addEventListener('pointerdown', () => {
      dragging = true;
      show();
      doc.addEventListener('pointerup', endDrag, true);
      doc.addEventListener('pointercancel', endDrag, true);
    });
    range.addEventListener('input', () => {
      place();
      show();
      if (!dragging) hideSoon(900);
      if (o.onInput) o.onInput(Number(range.value));
    });
    range.addEventListener('change', () => {
      if (o.onChange) o.onChange(Number(range.value));
    });
    place();

    return {
      el: trk,
      setValue(v) {
        range.value = String(v);
        place();
      },
      hideBubble() {
        dragging = false;
        root.clearTimeout(hideTimer);
        trk.classList.remove('show');
      },
    };
  }

  TF.createSlider = createSlider;
  TF.sliderCss = CSS;
  TF.sliderAlpha = sliderAlpha;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createSlider, sliderAlpha, bubbleLeft, CSS };
  }
})(globalThis);
