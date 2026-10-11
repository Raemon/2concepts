// Widget shell utilities shared by every prototype: safe storage, height reporting,
// touch "tap to play" gating (so swipes over the board scroll the page until activated),
// and a DPR-aware canvas sizer.
const Shell = (() => {
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  let lastH = 0;
  function reportHeight() {
    const b = document.body; if (!b) return;
    const cs = getComputedStyle(b);
    const h = Math.ceil(b.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom));
    if (h !== lastH) { lastH = h; try { parent.postMessage({ type: 'iframe-widget-resize', height: h }, '*'); } catch (e) {} }
  }
  function watchHeight() {
    try { new ResizeObserver(reportHeight).observe(document.body); } catch (e) {}
    window.addEventListener('load', reportHeight);
    setTimeout(reportHeight, 50); setTimeout(reportHeight, 500);
  }

  // Touch gating: until the reader taps the board, the board has touch-action:pan-y and ignores drags.
  const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
  function gate(el, onActivate) {
    if (!coarse) { el.dataset.active = '1'; return () => true; }
    el.style.touchAction = 'pan-y';
    el.dataset.active = '';
    const activate = () => { if (el.dataset.active) return; el.dataset.active = '1'; el.style.touchAction = 'none'; onActivate && onActivate(); };
    el.addEventListener('click', activate);
    document.addEventListener('pointerdown', (e) => { if (!el.contains(e.target)) { el.dataset.active = ''; el.style.touchAction = 'pan-y'; onActivate && onActivate(false); } }, true);
    return () => !!el.dataset.active;
  }

  function fitCanvas(canvas, cssW, cssH) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  return { store, reportHeight, watchHeight, gate, fitCanvas, coarse };
})();
