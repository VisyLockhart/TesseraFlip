(function (root) {
  const TF = (root.TF = root.TF || {});
  const ATTR = 'data-tf-rot';

  function normalize(a) {
    return ((a % 360) + 360) % 360;
  }

  function nextAngle(angle, dir) {
    return normalize(angle + (dir < 0 ? -90 : 90));
  }

  // box: the video element's layout size (unaffected by transform).
  // container: the player's size. At 90/270 the rotated box swaps sides, so
  // scale it to fit inside the container. 0/180 never need scaling.
  function fitScale(angle, box, container) {
    if (angle % 180 === 0) return 1;
    const vw = box.h;
    const vh = box.w;
    if (!(vw > 0 && vh > 0 && container.w > 0 && container.h > 0)) return 1;
    const s = Math.min(container.w / vw, container.h / vh);
    return Number.isFinite(s) && s > 0 ? s : 1;
  }

  function createRotator(opts) {
    const docEl = opts.documentElement;
    const RO = opts.ResizeObserver || root.ResizeObserver;
    const onChange = opts.onChange || function () {};

    let angle = 0;
    let target = null;
    let ro = null;
    let lastKey = null;

    function clear() {
      docEl.style.removeProperty('--tf-rot');
      docEl.style.removeProperty('--tf-scale');
      if (target) target.video.removeAttribute(ATTR);
    }

    // Idempotent: only touches the DOM when the result actually changes.
    function write() {
      if (!target) return;
      if (angle === 0) {
        if (lastKey === '0') return;
        clear();
        lastKey = '0';
        return;
      }
      const s = fitScale(
        angle,
        { w: target.video.offsetWidth, h: target.video.offsetHeight },
        { w: target.player.clientWidth, h: target.player.clientHeight }
      );
      const scale = s.toFixed(4);
      const key = angle + '|' + scale;
      if (key === lastKey) return;
      lastKey = key;
      docEl.style.setProperty('--tf-rot', angle + 'deg');
      docEl.style.setProperty('--tf-scale', scale);
      target.video.setAttribute(ATTR, String(angle));
    }

    function set(next) {
      angle = next;
      lastKey = null;
      write();
      onChange(angle);
    }

    return {
      attach(found) {
        this.detach();
        target = found;
        lastKey = null;
        write();
        if (RO) {
          ro = new RO(write);
          ro.observe(found.player);
          ro.observe(found.video);
        }
      },
      detach() {
        if (ro) {
          ro.disconnect();
          ro = null;
        }
        if (target) {
          clear();
          target = null;
        }
        lastKey = null;
      },
      // Return false when there is no video to act on.
      rotate(dir) {
        if (!target) return false;
        set(nextAngle(angle, dir));
        return true;
      },
      reset() {
        if (angle === 0) return;
        set(0);
      },
      getAngle: () => angle,
    };
  }

  TF.createRotator = createRotator;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createRotator, nextAngle, fitScale };
  }
})(globalThis);
