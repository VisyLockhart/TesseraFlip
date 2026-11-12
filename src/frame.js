(function (root) {
  const TF = (root.TF = root.TF || {});

  // Rotating by 90/270 swaps the output's width and height.
  function canvasSize(vw, vh, angle) {
    return angle % 180 === 0 ? { w: vw, h: vh } : { w: vh, h: vw };
  }

  function pad(n, w) {
    return String(n).padStart(w, '0');
  }

  function formatStamp(sec) {
    const ms = Math.max(0, Math.round(sec * 1000));
    const h = Math.floor(ms / 3600000);
    const m = Math.floor(ms / 60000) % 60;
    const s = Math.floor(ms / 1000) % 60;
    return (h ? pad(h, 2) + 'h' : '') + pad(m, 2) + 'm' + pad(s, 2) + 's' + pad(ms % 1000, 3);
  }

  function sanitizeName(s) {
    const out = String(s || '')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
    return out || 'youtube';
  }

  function filename(title, sec, angle) {
    const base = sanitizeName(String(title || '').replace(/ - YouTube$/, ''));
    return base + '_' + formatStamp(sec) + (angle ? '_r' + angle : '') + '.png';
  }

  // Draws the current frame at the video's native resolution, rotated the
  // same way the player shows it. Canvas rotate() is clockwise, like CSS.
  function capture(video, angle, doc) {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh || video.readyState < 2) return Promise.reject(new Error('no frame'));
    const { w, h } = canvasSize(vw, vh, angle);
    const canvas = doc.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.translate(w / 2, h / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    });
  }

  function download(blob, name, doc) {
    const url = URL.createObjectURL(blob);
    const a = doc.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    doc.body.appendChild(a);
    a.click();
    a.remove();
    root.setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function createFrames(opts) {
    const doc = opts.document;
    const nav = opts.navigator || root.navigator;
    const log = opts.log || function () {};

    async function run(video, angle, deliver) {
      try {
        if (!video) return { ok: false, error: 'no video' };
        const sec = video.currentTime;
        const blob = await capture(video, angle, doc);
        await deliver(blob, filename(doc.title, sec, angle));
        return { ok: true };
      } catch (e) {
        log('frame failed', e);
        return { ok: false, error: String((e && e.message) || e) };
      }
    }

    return {
      save: (video, angle) => run(video, angle, (blob, name) => download(blob, name, doc)),
      copy: (video, angle) =>
        run(video, angle, (blob) =>
          nav.clipboard.write([new root.ClipboardItem({ 'image/png': blob })])
        ),
    };
  }

  TF.createFrames = createFrames;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createFrames, canvasSize, formatStamp, sanitizeName, filename, capture };
  }
})(globalThis);
