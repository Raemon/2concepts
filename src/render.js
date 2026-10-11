// STILL WATER renderer: a cyanotype. The scene is a Prussian-blue sun print on cool paper with hand-brushed edges.
// The sea is engraved: fine paper-white lines that a live wave simulation bends wherever someone makes noise. A
// swimmer in real trouble sits in perfectly still lines. Beach things are photograms, white silhouettes left where
// objects lay on the paper. During an inspection the print flips to its negative: the Captain only reads ripples.
(function (root) {
  'use strict';
  const SW = root.SW;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hash = SW.hash;

  const INK = {
    prussian: '#123d8f',  // the exposed sheet
    deep: '#0a2560',      // pooled chemistry, ink for faces and outlines
    pale: '#5480c6',      // sand: a lighter exposure
    capPale: '#a9c2ec',
    paper: '#f2f3ee',     // unexposed paper: the lines, the photograms
    red: '#df3a2c',       // lifeguard red
    yellow: '#ffc83a',    // lifeguard yellow
    violet: '#6b3db3',    // the Captain's rubber-stamp ink
  };
  const F_DISPLAY = '"IM Fell English SC", "IM Fell English", Georgia, "Times New Roman", serif';
  const F_ITALIC = '"IM Fell English", Georgia, "Times New Roman", serif';
  const F_UI = 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif';
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  function vnoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const h = (a, b) => hash(a * 157.13 + b * 311.71 + seed * 71.37);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
  }

  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, waterH = 0, dpr = 1, margin = 8;
    let base = null, neg = null, frame = null, edgePath = null;
    let lastVision = false, visionAt = -9;
    // adaptive quality: if frames come slowly, engrave into a cache and redraw it only every second or third frame
    let quality = 0, frameNo = 0, lastDraw = 0, slowFrames = 0, cache = null, cctx = null, cacheVision = null;

    // ---------- offscreen helpers ----------
    function layer(w, h) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
      const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      return [c, g];
    }
    const px = p => ({ x: p.x * W, y: p.y * waterH });
    // logic distances are in water units, so a reach circle is an ellipse on screen
    function reachPath(g, x, y, r) { g.beginPath(); g.ellipse(x, y, r * W, r * waterH, 0, 0, 6.283); }
    const towerPx = () => ({ x: W * 0.5, y: waterH + (H - waterH) * 0.42 });
    const scale = () => clamp(W / 360, 0.95, 1.6);
    const jeepStop = () => { const tw = towerPx(), sc = scale(); return { x: tw.x + 56 * sc, y: tw.y + 8 * sc }; };

    // ---------- the wave field: what the sea does with noise ----------
    let cs = 6, gw = 0, gh = 0, F0 = null, F1 = null, damp = null, fieldT = 0;
    const FIELD_HZ = 40;
    function initField() {
      cs = clamp(W / 78, 4.5, 8);
      gw = Math.ceil(W / cs) + 3; gh = Math.ceil(waterH / cs) + 3;
      F0 = new Float32Array(gw * gh); F1 = new Float32Array(gw * gh); damp = new Float32Array(gw * gh);
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        // a sponge at the open edges soaks waves up; the shore at the bottom reflects them
        const e = Math.min(x, gw - 1 - x, y);
        damp[y * gw + x] = e < 7 ? 0.9 + 0.082 * (e / 7) : 0.982;
      }
    }
    function stepField() {
      for (let y = 1; y < gh - 1; y++) {
        let i = y * gw + 1;
        for (let x = 1; x < gw - 1; x++, i++) F1[i] = ((F0[i - 1] + F0[i + 1] + F0[i - gw] + F0[i + gw]) * 0.5 - F1[i]) * damp[i];
      }
      const t = F0; F0 = F1; F1 = t;
    }
    function poke(x, y, a) {
      const ix = Math.round(x / cs) + 1, iy = Math.round(y / cs) + 1;
      if (ix < 2 || iy < 2 || ix >= gw - 2 || iy >= gh - 2) return;
      const i = iy * gw + ix;
      F0[i] += a; F0[i - 1] += a * 0.5; F0[i + 1] += a * 0.5; F0[i - gw] += a * 0.5; F0[i + gw] += a * 0.5;
    }
    function hAt(x, y) {
      const fx = x / cs + 1, fy = y / cs + 1, ix = fx | 0, iy = fy | 0;
      if (ix < 0 || iy < 0 || ix >= gw - 1 || iy >= gh - 1) return 0;
      const ux = fx - ix, uy = fy - iy, i = iy * gw + ix;
      return (F0[i] * (1 - ux) + F0[i + 1] * ux) * (1 - uy) + (F0[i + gw] * (1 - ux) + F0[i + gw + 1] * ux) * uy;
    }
    // every swimmer who can make noise does; the drowning make none
    function emit(state, t) {
      const sc = scale();
      for (const s of state.swimmers) {
        let every = 0, amp = 0;
        if (s.state === 'struggle') { every = 0.1; amp = 6; }
        else if (s.state === 'towed') { every = 0.2; amp = 1.6; }
        else if (s.state === 'swim' && s.kind === 'swimmer') { every = 0.4; amp = 1.5; }
        else if (s.state === 'swim' && s.kind === 'treader') { every = 0.85; amp = 0.8; }
        if (!every) continue;
        const slot = Math.floor((t + s.id * 0.37) / every);
        if (s._fslot === slot) continue;
        s._fslot = slot;
        let p = px(s);
        if (s.state === 'towed') { const q = towedPos(s, state); if (!q) continue; p = q; }
        const j = 5 * sc;
        poke(p.x + (hash(slot + s.id) - 0.5) * j, p.y + (hash(slot * 1.7 + s.id) - 0.5) * j, amp * (0.75 + 0.5 * hash(slot * 3.1 + s.id)));
      }
    }

    // ---------- static plates, built once per size ----------
    let grainPat = null;
    function grain(g, w, h, alpha) {
      if (!grainPat) {
        const c = document.createElement('canvas'); c.width = c.height = 96;
        const gg = c.getContext('2d'), d = gg.createImageData(96, 96);
        for (let i = 0; i < d.data.length; i += 4) { const v = hash(i * 0.731); const w8 = v > 0.5 ? 255 : 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = w8; d.data[i + 3] = Math.abs(v - 0.5) * 70; }
        gg.putImageData(d, 0, 0); grainPat = c;
      }
      g.save(); g.globalAlpha = alpha; g.fillStyle = g.createPattern(grainPat, 'repeat'); g.fillRect(0, 0, w, h); g.restore();
    }
    // uneven exposure: soft blotches and the horizontal streaks a coating brush leaves
    function mottle(g, y0, h, darkCol, lightCol, strength, seed) {
      const mw = Math.ceil(W / 12) + 2, mh = Math.ceil(h / 12) + 2;
      const c = document.createElement('canvas'); c.width = mw; c.height = mh;
      const gg = c.getContext('2d'), d = gg.createImageData(mw, mh);
      const dk = parseInt(darkCol.slice(1), 16), lt = parseInt(lightCol.slice(1), 16);
      for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
        const n = vnoise(x * 0.16, y * 0.16, seed) * 0.6 + vnoise(x * 0.5, y * 0.12, seed + 3) * 0.4;
        const i = (y * mw + x) * 4, col = n > 0.5 ? lt : dk, a = Math.abs(n - 0.5) * 2 * strength;
        d.data[i] = col >> 16; d.data[i + 1] = (col >> 8) & 255; d.data[i + 2] = col & 255; d.data[i + 3] = a * 255;
      }
      gg.putImageData(d, 0, 0);
      g.save(); g.imageSmoothingEnabled = true; g.drawImage(c, 0, 0, mw, mh, -6, y0 - 6, W + 12, h + 12); g.restore();
      for (let k = 0; k < 9; k++) {
        const y = y0 + hash(k * 9.1 + seed) * h, bh = (6 + 22 * hash(k * 3.3 + seed)) * scale();
        const gr = g.createLinearGradient(0, y - bh, 0, y + bh);
        gr.addColorStop(0, rgba(darkCol, 0)); gr.addColorStop(0.5, rgba(darkCol, 0.05 + 0.07 * hash(k + seed))); gr.addColorStop(1, rgba(darkCol, 0));
        g.fillStyle = gr; g.fillRect(0, y - bh, W, bh * 2);
      }
    }
    const SPOTS = [['umbrella', 0.07, 0.62], ['towel', 0.19, 0.3], ['umbrella', 0.3, 0.72], ['star', 0.4, 0.82],
      ['towel', 0.8, 0.3], ['umbrella', 0.9, 0.7], ['shell', 0.97, 0.25], ['umbrella', 0.2, 0.86]];
    function photograms(g, ink, sc) {
      const sandTop = waterH, sandH = H - waterH;
      g.save();
      g.shadowColor = ink; g.shadowBlur = 5 * sc;
      for (const [kind, u, v] of SPOTS) {
        const x = u * W, y = sandTop + 12 * sc + v * (sandH - 26 * sc), k = hash(u * 91 + v * 13);
        g.save(); g.translate(x, y); g.rotate((k - 0.5) * 0.8);
        if (kind === 'umbrella') {
          const r = 17 * sc;
          for (let s = 0; s < 8; s++) {
            g.fillStyle = rgba(ink, s % 2 ? 0.92 : 0.55);
            g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, s * 0.785, (s + 1) * 0.785); g.closePath(); g.fill();
          }
          g.fillStyle = rgba(ink, 1); g.beginPath(); g.arc(0, 0, 2 * sc, 0, 6.283); g.fill();
        } else if (kind === 'towel') {
          const w = 30 * sc, h = 14 * sc;
          g.fillStyle = rgba(ink, 0.7); g.fillRect(-w / 2, -h / 2, w, h);
          g.fillStyle = rgba(ink, 0.95);
          for (let q = 0; q < 4; q++) g.fillRect(-w / 2 + q * w / 4, -h / 2, w / 9, h);
        } else if (kind === 'star') {
          g.fillStyle = rgba(ink, 0.95); g.beginPath();
          for (let q = 0; q < 10; q++) { const a = q * Math.PI / 5 - Math.PI / 2, rr = (q % 2 ? 2.4 : 7) * sc; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
          g.closePath(); g.fill();
        } else if (kind === 'shell') {
          g.fillStyle = rgba(ink, 0.9); g.beginPath(); g.moveTo(0, 5 * sc); g.arc(0, 5 * sc, 9 * sc, Math.PI * 1.15, Math.PI * 1.85); g.closePath(); g.fill();
        }
        g.restore();
      }
      // footprints from the tower down to the water
      const tw = towerPx();
      g.shadowBlur = 2 * sc; g.fillStyle = rgba(ink, 0.55);
      for (let q = 0; q < 7; q++) {
        const f = q / 7, x = lerp(tw.x - 26 * sc, W * 0.4, f) + (q % 2 ? 4 : -4) * sc, y = lerp(tw.y - 6 * sc, sandTop + 6 * sc, f);
        g.beginPath(); g.ellipse(x, y, 1.8 * sc, 3 * sc, -0.35, 0, 6.283); g.fill();
      }
      // the lifeguard tower: hut, legs, ladder
      g.shadowBlur = 6 * sc; g.fillStyle = rgba(ink, 0.95);
      g.save(); g.translate(tw.x, tw.y);
      g.fillRect(-23 * sc, -15 * sc, 46 * sc, 30 * sc);
      g.beginPath(); g.moveTo(-30 * sc, -15 * sc); g.lineTo(0, -28 * sc); g.lineTo(30 * sc, -15 * sc); g.closePath(); g.fill();
      g.fillStyle = rgba(ink, 0.6);
      g.fillRect(-20 * sc, 15 * sc, 4 * sc, 10 * sc); g.fillRect(16 * sc, 15 * sc, 4 * sc, 10 * sc);
      g.restore();
      g.restore();
    }
    function buildPlate(isNeg) {
      const [c, g] = layer(W, H), sc = scale();
      // sea
      g.fillStyle = isNeg ? INK.paper : INK.prussian; g.fillRect(0, 0, W, waterH + 1);
      if (isNeg) mottle(g, 0, waterH, '#7f9fd6', '#ffffff', 0.18, 11);
      else mottle(g, 0, waterH, INK.deep, '#2d5fb0', 0.55, 7);
      // far water a little deeper
      const fg = g.createLinearGradient(0, 0, 0, waterH);
      fg.addColorStop(0, rgba(isNeg ? '#9fb6dc' : INK.deep, isNeg ? 0.12 : 0.35)); fg.addColorStop(0.6, rgba(INK.deep, 0)); g.fillStyle = fg; g.fillRect(0, 0, W, waterH);
      // sand: a lighter exposure, stippled
      g.fillStyle = isNeg ? '#e2e8f1' : INK.pale; g.fillRect(0, waterH, W, H - waterH);
      mottle(g, waterH, H - waterH, isNeg ? '#a8bde0' : '#3f6cb4', isNeg ? '#ffffff' : '#7c9fd6', 0.4, 23);
      for (let i = 0; i < W * (H - waterH) / 40; i++) {
        const x = hash(i * 1.37) * W, y = waterH + hash(i * 2.91) * (H - waterH);
        g.fillStyle = hash(i * 5.3) > 0.5 ? rgba(isNeg ? INK.prussian : INK.paper, 0.18) : rgba(INK.deep, 0.16);
        g.fillRect(x, y, 1.1, 1.1);
      }
      // wet sand along the waterline
      const wg = g.createLinearGradient(0, waterH, 0, waterH + 18 * sc);
      wg.addColorStop(0, rgba(INK.deep, isNeg ? 0.12 : 0.35)); wg.addColorStop(1, rgba(INK.deep, 0));
      g.fillStyle = wg; g.fillRect(0, waterH, W, 18 * sc);
      photograms(g, isNeg ? INK.prussian : INK.paper, sc);
      grain(g, W, H, isNeg ? 0.35 : 0.5);
      return c;
    }
    // the paper margin, with the ragged edge a coating brush leaves
    function buildFrame() {
      const [c, g] = layer(W, H);
      g.fillStyle = INK.paper; g.fillRect(0, 0, W, H);
      const m = margin, pts = [];
      const edge = (s, seed) => m * (0.45 * vnoise(s * 0.045, 0, seed) + 0.3 * vnoise(s * 0.21, 1, seed) + 0.25 * hash(s * 0.37 + seed));
      for (let x = m; x <= W - m; x += 2) pts.push([x, m - edge(x, 1) + m * 0.2]);
      for (let y = m; y <= H - m; y += 2) pts.push([W - m + edge(y, 2) - m * 0.2, y]);
      for (let x = W - m; x >= m; x -= 2) pts.push([x, H - m + edge(x, 3) - m * 0.2]);
      for (let y = H - m; y >= m; y -= 2) pts.push([m - edge(y, 4) + m * 0.2, y]);
      edgePath = new Path2D();
      pts.forEach(([x, y], i) => i ? edgePath.lineTo(x, y) : edgePath.moveTo(x, y));
      edgePath.closePath();
      g.globalCompositeOperation = 'destination-out';
      g.fill(edgePath);
      g.globalCompositeOperation = 'source-over';
      grain(g, W, H, 0.25);
      return c;
    }

    function resize(cssW) {
      dpr = Math.min(2, root.devicePixelRatio || 1);
      W = Math.round(cssW); H = Math.round(cssW * (cssW < 480 ? 1.12 : 0.92));
      waterH = Math.round(H * 0.8);
      margin = clamp(W * 0.02, 7, 13);
      canvas.style.height = H + 'px';
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initField();
      base = buildPlate(false); neg = buildPlate(true); frame = buildFrame();
      cache = null; cacheVision = null;
    }

    // ---------- the engraved sea ----------
    function engrave(t, vision, g) {
      const sc = scale();
      const sp0 = clamp(W / 72, 4.6, 7.5), step = clamp(W / 95, 4, 7), amp = cs * 1.1, lw = 0.62 * sc;
      const n = Math.ceil(W / step) + 1;
      const ys = new Float32Array(n), ws = new Float32Array(n);
      const swell = (x, y) => 0.8 * Math.sin(x * 0.016 + t * 0.8 + y * 0.05) + 0.55 * Math.sin(x * 0.0061 - t * 0.5 + y * 0.12) + 0.18 * Math.sin(x * 0.041 + y * 0.021 + t * 1.3);
      g.beginPath();
      for (let y0 = sp0 * 0.7; y0 < waterH - sp0 * 0.3;) {
        const depth = y0 / waterH, shore = Math.pow(depth, 6);
        for (let k = 0; k < n; k++) {
          const x = k * step, h = hAt(x, y0);
          const dy = clamp(h * amp, -sp0 * 1.6, sp0 * 1.6) + swell(x, y0);
          // light comes from out to sea: a surface tilting toward it engraves as a thicker, brighter line
          const tilt = (swell(x, y0 - 2) - swell(x, y0 + 2)) * 0.35 + (hAt(x, y0 - cs) - hAt(x, y0 + cs)) * 0.9;
          const light = clamp(0.55 + tilt, 0.12, 1.6);
          ys[k] = y0 + dy;
          ws[k] = lw * (0.35 + 1.05 * light) * (0.8 + 0.35 * depth) + shore * 1.8 * sc;
        }
        g.moveTo(0, ys[0]);
        for (let k = 1; k < n; k++) g.lineTo(k * step, ys[k] - ws[k] / 2);
        for (let k = n - 1; k >= 0; k--) g.lineTo(k * step, ys[k] + ws[k] / 2);
        g.closePath();
        y0 += sp0 * (0.85 + 0.35 * depth);
      }
      g.fillStyle = vision ? rgba(INK.prussian, 0.9) : rgba(INK.paper, 0.9);
      g.fill();
    }
    // figures are reserved in the engraving: a soft pool of plain blue around each one, so the lines fade out before them
    function reserve(state) {
      const sc = scale();
      for (const s of state.swimmers) {
        if (s.state === 'away' || s.state === 'saved' || s.state === 'gone') continue;
        if (s.state === 'lost' && state.t - s.since > 2.5) continue;
        const p = s.state === 'towed' ? towedPos(s, state) : px(s);
        if (!p) continue;
        const r = (s.state === 'struggle' ? 22 : s.kind === 'floater' ? 25 : 17) * sc;
        const gr = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r);
        gr.addColorStop(0, rgba(INK.prussian, 0.96)); gr.addColorStop(0.6, rgba(INK.prussian, 0.7)); gr.addColorStop(1, rgba(INK.prussian, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283); ctx.fill();
      }
    }
    // surf along the waterline: broken strokes, set as filled pieces (cheaper than dashed lines)
    function foam(t, vision) {
      const sc = scale();
      ctx.fillStyle = vision ? rgba(INK.prussian, 0.8) : rgba(INK.paper, 0.95);
      ctx.beginPath();
      for (let band = 0; band < 2; band++) {
        const dash = (band ? 3 : 14) * sc, gap = (band ? 7 : 6) * sc, w = (band ? 1.3 : 2.6) * sc, off = (t * (band ? 9 : 5) * sc) % (dash + gap);
        const yAt = x => waterH + (band ? 7 : 1) * sc + Math.sin(x * 0.045 + t * (band ? 1.4 : 1.1)) * 2.2 * sc;
        for (let x0 = -dash - gap + off; x0 < W; x0 += dash + gap) {
          const x1 = x0 + dash * (band ? 1 : 0.6 + 0.6 * hash(Math.round((x0 - off) / (dash + gap)) * 1.7));
          const ya = yAt(x0), ym = yAt((x0 + x1) / 2), yb = yAt(x1);
          ctx.moveTo(x0, ya - w / 2); ctx.lineTo((x0 + x1) / 2, ym - w / 2); ctx.lineTo(x1, yb - w / 2);
          ctx.lineTo(x1, yb + w / 2); ctx.lineTo((x0 + x1) / 2, ym + w / 2); ctx.lineTo(x0, ya + w / 2); ctx.closePath();
        }
      }
      ctx.fill();
    }

    // ---------- people ----------
    function disc(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
    function head(x, y, r, s, face, tilt) {
      const style = s.id % 4;
      ctx.fillStyle = INK.paper; disc(x, y, r);
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y - r * 0.12 + (tilt || 0) * r * 0.45, r * 1.04, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.clip();
      if (style === 0) { ctx.fillStyle = INK.capPale; ctx.fillRect(x - r * 1.2, y - r * 1.3, r * 2.4, r * 1.6); }
      else if (style === 2) { ctx.fillStyle = INK.deep; ctx.fillRect(x - r * 1.2, y - r * 1.3, r * 2.4, r * 1.6); }
      else {
        ctx.strokeStyle = INK.deep; ctx.lineWidth = Math.max(0.7, r * 0.1);
        ctx.beginPath();
        for (let k = -3; k <= 3; k++) {
          if (style === 1) { ctx.moveTo(x + k * r * 0.4 - r, y - r * 1.2); ctx.lineTo(x + k * r * 0.4 + r * 0.6, y + r * 0.4); }
          else { ctx.moveTo(x - r * 1.2, y - r * 0.2 + k * r * 0.28); ctx.lineTo(x + r * 1.2, y - r * 0.2 + k * r * 0.28); }
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = rgba(INK.deep, 0.55); ctx.lineWidth = Math.max(0.7, r * 0.09);
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke();
      // the face, in ink
      ctx.fillStyle = INK.deep; ctx.strokeStyle = INK.deep;
      const ey = y + r * 0.08 - (tilt || 0) * r * 0.35;
      if (face === 'shut') {
        ctx.lineWidth = Math.max(0.9, r * 0.13);
        ctx.beginPath(); ctx.moveTo(x - r * 0.45, ey); ctx.lineTo(x - r * 0.18, ey); ctx.moveTo(x + r * 0.18, ey); ctx.lineTo(x + r * 0.45, ey); ctx.stroke();
      } else {
        const lift = face === 'up' ? r * 0.12 : 0;
        ctx.beginPath(); ctx.arc(x - r * 0.32, ey - lift, r * 0.12, 0, 6.283); ctx.arc(x + r * 0.32, ey - lift, r * 0.12, 0, 6.283); ctx.fill();
      }
      ctx.lineWidth = Math.max(0.9, r * 0.12);
      if (face === 'scream') { ctx.beginPath(); ctx.ellipse(x, y + r * 0.5, r * 0.22, r * 0.27, 0, 0, 6.283); ctx.fill(); }
      else if (face === 'happy') { ctx.beginPath(); ctx.arc(x, y + r * 0.32, r * 0.3, 0.25, Math.PI - 0.25); ctx.stroke(); }
      else if (face === 'up') { ctx.beginPath(); ctx.ellipse(x, y + r * 0.45, r * 0.14, r * 0.09, 0, 0, 6.283); ctx.stroke(); }
    }
    function lifebuoy(x, y, r) {
      ctx.lineWidth = r * 0.58;
      for (let q = 0; q < 4; q++) {
        ctx.strokeStyle = q % 2 ? INK.paper : INK.red;
        ctx.beginPath(); ctx.arc(x, y, r, q * 1.5708 + 0.2, (q + 1) * 1.5708 + 0.2); ctx.stroke();
      }
    }
    function towedPos(s, state) {
      const ring = state.rings.find(q => q.who === s.id && q.mode === 'towing');
      if (!ring) return null;
      const tw = towerPx(), k = ease((state.t - ring.t0) / (ring.t1 - ring.t0)), a = px({ x: s.tx, y: s.ty });
      return { x: lerp(a.x, tw.x, k), y: lerp(a.y, Math.min(tw.y, waterH + 6), k) };
    }

    function swimmer(s, t, state) {
      const sc = scale(), r = 9.5 * sc;
      const p = px(s);
      if (s.state === 'towed') {
        const q = towedPos(s, state); if (!q) return;
        const tw = towerPx();
        ctx.strokeStyle = rgba(INK.paper, 0.9); ctx.lineWidth = 1.2 * sc; ctx.setLineDash([4 * sc, 3 * sc]);
        ctx.beginPath(); ctx.moveTo(tw.x, tw.y - 12 * sc); ctx.quadraticCurveTo((tw.x + q.x) / 2, (tw.y + q.y) / 2 + 14 * sc, q.x, q.y); ctx.stroke(); ctx.setLineDash([]);
        lifebuoy(q.x, q.y + r * 0.55, r * 1.15);
        head(q.x, q.y, r, s, 'happy');
        return;
      }
      if (s.state === 'away' || s.state === 'saved' || s.state === 'gone') return;
      const bob = Math.sin(t * 2.2 + s.id) * 1.2 * sc;
      if (s.state === 'lost') {
        const age = state.t - s.since; if (age > 2.5) return;
        for (let k = 0; k < 5; k++) {
          const yy = p.y - ((age * 18 + k * 7) % 22) * sc;
          ctx.strokeStyle = rgba(INK.paper, 0.8 * (1 - age / 2.5)); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(p.x + Math.sin(k * 2 + age * 3) * 4 * sc, yy, (1.5 + k % 3) * sc, 0, 6.283); ctx.stroke();
        }
        return;
      }
      ctx.globalAlpha = s.enter > 0 ? clamp((state.t - s.enter) / 0.8, 0, 1) : 1;
      if (s.kind === 'floater') {
        // on an inflatable ring, a photogram with stripes
        ctx.lineWidth = 5.5 * sc;
        for (let q = 0; q < 8; q++) { ctx.strokeStyle = rgba(INK.paper, q % 2 ? 0.95 : 0.6); ctx.beginPath(); ctx.arc(p.x, p.y + bob, r * 1.75, q * 0.785, (q + 1) * 0.785); ctx.stroke(); }
        ctx.fillStyle = rgba(INK.paper, 0.85); ctx.beginPath(); ctx.ellipse(p.x + r * 1.1, p.y + bob, r * 1.3, r * 0.5, 0.2, 0, 6.283); ctx.fill();
        head(p.x - r * 0.6, p.y + bob, r, s, 'shut');
      } else if (s.state === 'swim' && s.kind === 'swimmer') {
        const dir = Math.cos(t * 0.37 + s.id * 7.13) > 0 ? 1 : -1, st = Math.sin(t * 4 + s.id);
        ctx.fillStyle = rgba(INK.paper, 0.22); ctx.beginPath(); ctx.ellipse(p.x - dir * r * 1.4, p.y + 2 * sc, r * 1.9, r * 0.6, 0, 0, 6.283); ctx.fill();
        ctx.strokeStyle = INK.paper; ctx.lineWidth = 2.6 * sc; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * r * (1 + 0.6 * st), p.y - r * 0.9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * r * (1 - 0.6 * st), p.y + r * 0.9); ctx.stroke();
        head(p.x, p.y + bob * 0.3, r, s, 'happy');
      } else if (s.state === 'swim') {
        // treading water: upright and calm
        ctx.fillStyle = rgba(INK.paper, 0.18); ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 0.8, r * 1.3, r * 0.45, 0, 0, 6.283); ctx.fill();
        head(p.x, p.y + bob, r, s, 'calm');
      } else if (s.state === 'struggle') {
        const w = Math.sin(t * 11 + s.id * 3);
        ctx.strokeStyle = INK.paper; ctx.lineWidth = 2.8 * sc; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x - r * 0.6, p.y); ctx.lineTo(p.x - r * (1.4 + 0.4 * w), p.y - r * (1.9 + 0.5 * w)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x + r * 0.6, p.y); ctx.lineTo(p.x + r * (1.4 - 0.4 * w), p.y - r * (1.9 - 0.5 * w)); ctx.stroke();
        for (let k = 0; k < 7; k++) {
          const a = t * 6 + k * 0.9 + s.id, d = r * (1.3 + 0.9 * Math.abs(Math.sin(a * 1.7)));
          ctx.fillStyle = INK.paper; disc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * 0.6, 1.7 * sc);
        }
        head(p.x, p.y + Math.sin(t * 9 + s.id) * 2 * sc, r, s, 'scream');
        label(p.x, p.y - r * 3.2, 'HELP!', INK.red, sc);
      } else if (s.state === 'drown') {
        // The instinctive drowning response: upright, head back, mouth at the waterline, no sound. For most of it they
        // look like someone calmly treading water. Only near the end do they go under, and the sheet closes over them.
        const late = clamp((s.sink - 0.74) / 0.26, 0, 1), dip = Math.sin(t * 1.6 + s.id) * 0.5 + 0.5;
        head(p.x, p.y + late * r * 0.5 + dip * r * 0.12, r * (1 - 0.18 * late), s, late > 0.2 ? 'up' : 'calm', 0.35 + 0.65 * late);
        if (late > 0) {
          ctx.fillStyle = rgba(INK.prussian, 0.3 + 0.65 * late);
          ctx.fillRect(p.x - r * 1.3, p.y + r * (0.6 - 1.5 * late), r * 2.6, r * 2);
          for (let q = 0; q < 3; q++) {
            const a = (t * 1.3 + q * 0.33) % 1;
            ctx.strokeStyle = rgba(INK.paper, 0.7 * (1 - a) * late); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(p.x + (q - 1) * r * 0.5, p.y - a * r * 1.4, (1.2 + q * 0.4) * sc, 0, 6.283); ctx.stroke();
          }
        }
      }
      // marked by the whistle: nobody answered from here
      if (s.flagged !== false && s.flagged != null && s.state === 'drown') {
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.strokeStyle = rgba(INK.red, 0.6 + 0.4 * pulse); ctx.lineWidth = 2 * sc; ctx.setLineDash([4 * sc, 3 * sc]);
        reachPath(ctx, p.x, p.y, SW.RULES.reachDrown); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = INK.red; ctx.font = `800 ${Math.round(14 * sc)}px ${F_UI}`; ctx.textAlign = 'center';
        ctx.fillText('!', p.x + SW.RULES.reachDrown * W + 5 * sc, p.y - SW.RULES.reachDrown * waterH); ctx.textAlign = 'start';
      }
      if (s.reply && state.t - s.reply.t < 1.6 && s.reply.kind === 'wave') {
        ctx.globalAlpha = Math.min(1, (1 - (state.t - s.reply.t) / 1.6) * 2);
        label(p.x, p.y - r * 2.9, 'OK!', INK.prussian, sc);
      }
      ctx.globalAlpha = 1;
    }

    // ---------- labels, set like specimen tags ----------
    function fitText(text, x, y, maxW) {
      let size = parseFloat(ctx.font.match(/(\d+(?:\.\d+)?)px/)[1]);
      while (ctx.measureText(text).width > maxW && size > 8) { size -= 0.5; ctx.font = ctx.font.replace(/\d+(?:\.\d+)?px/, size + 'px'); }
      ctx.fillText(text, x, y);
    }
    function label(x, y, text, col, sc) {
      ctx.font = `700 ${Math.round(10.5 * sc)}px ${F_UI}`;
      const w = ctx.measureText(text).width + 12 * sc, h = 17 * sc;
      x = clamp(x, w / 2 + margin, W - w / 2 - margin); y = Math.max(y, h / 2 + margin);
      ctx.fillStyle = INK.paper; ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.beginPath(); ctx.moveTo(x - 4 * sc, y + h / 2 - 0.5); ctx.lineTo(x, y + h / 2 + 5 * sc); ctx.lineTo(x + 4 * sc, y + h / 2 - 0.5); ctx.fill();
      ctx.strokeStyle = rgba(INK.deep, 0.75); ctx.lineWidth = 0.8;
      ctx.strokeRect(x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - 1);
      ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 0.5); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
    function plate(cx, cy, title, sub, col, sc) {
      const bw = Math.min(W - margin * 2 - 8, 360 * sc), bh = (sub ? 60 : 40) * sc;
      ctx.fillStyle = INK.paper; ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
      ctx.strokeStyle = INK.deep; ctx.lineWidth = 1;
      ctx.strokeRect(cx - bw / 2 + 0.5, cy - bh / 2 + 0.5, bw - 1, bh - 1);
      ctx.lineWidth = 0.6; ctx.strokeRect(cx - bw / 2 + 3.5, cy - bh / 2 + 3.5, bw - 7, bh - 7);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = col; ctx.font = `${Math.round(22 * sc)}px ${F_DISPLAY}`;
      fitText(title, cx, cy - (sub ? 10 * sc : 0), bw - 20);
      if (sub) { ctx.fillStyle = INK.deep; ctx.font = `500 ${Math.round(12 * sc)}px ${F_UI}`; fitText(sub, cx, cy + 14 * sc, bw - 20); }
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }

    // ---------- the tower, rings, the Captain ----------
    function towerLive(t, state, vision) {
      const tw = towerPx(), sc = scale();
      ctx.save(); ctx.translate(tw.x, tw.y);
      // surf-lifesaving flag, red over yellow, on a pole from the roof
      ctx.strokeStyle = vision ? INK.prussian : INK.paper; ctx.lineWidth = 1.6 * sc;
      ctx.beginPath(); ctx.moveTo(0, -27 * sc); ctx.lineTo(0, -52 * sc); ctx.stroke();
      const fl = (y0, col) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, y0);
        for (let q = 0; q <= 6; q++) ctx.lineTo(q * 3 * sc, y0 + Math.sin(t * 5 + q * 0.9) * 1.6 * sc * q / 6);
        for (let q = 6; q >= 0; q--) ctx.lineTo(q * 3 * sc, y0 + 6 * sc + Math.sin(t * 5 + q * 0.9) * 1.6 * sc * q / 6);
        ctx.closePath(); ctx.fill();
      };
      fl(-52 * sc, INK.red); fl(-46 * sc, INK.yellow);
      // the lifeguard: yellow shirt, red-and-yellow cap
      ctx.fillStyle = INK.yellow; disc(0, -3 * sc, 8.5 * sc);
      ctx.fillStyle = INK.paper; disc(0, -9 * sc, 5.6 * sc);
      ctx.fillStyle = INK.red; ctx.beginPath(); ctx.arc(0, -10.5 * sc, 5.8 * sc, Math.PI, Math.PI * 1.5); ctx.lineTo(0, -10.5 * sc); ctx.fill();
      ctx.fillStyle = INK.yellow; ctx.beginPath(); ctx.arc(0, -10.5 * sc, 5.8 * sc, Math.PI * 1.5, Math.PI * 2); ctx.lineTo(0, -10.5 * sc); ctx.fill();
      if (state) {
        const ready = state.rings.filter(r => r.mode === 'ready').length;
        for (let k = 0; k < state.rings.length; k++) {
          ctx.globalAlpha = k < ready ? 1 : 0.25;
          lifebuoy((k - (state.rings.length - 1) / 2) * 15 * sc, 10 * sc, 5.5 * sc);
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
    function flights(state) {
      const tw = towerPx(), sc = scale();
      for (const r of state.rings) {
        if (r.mode === 'flying') {
          const k = clamp((state.t - r.t0) / (r.t1 - r.t0), 0, 1), tgt = px(r);
          const x = lerp(tw.x, tgt.x, k), y = lerp(tw.y - 10 * sc, tgt.y, k), h = Math.sin(k * Math.PI) * 42 * sc;
          ctx.strokeStyle = rgba(INK.paper, 0.75); ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
          reachPath(ctx, tgt.x, tgt.y, SW.RULES.reachStruggle); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = rgba(INK.deep, 0.45); ctx.beginPath(); ctx.ellipse(x, y, 8 * sc, 4 * sc, 0, 0, 6.283); ctx.fill();
          lifebuoy(x, y - h, (7 + 3 * Math.sin(k * Math.PI)) * sc);
        } else if (r.mode === 'retrieving') {
          const k = clamp((state.t - r.t0) / (r.t1 - r.t0), 0, 1), a = px(r);
          const x = lerp(a.x, tw.x, ease(k)), y = lerp(a.y, Math.min(tw.y, waterH + 4), ease(k));
          ctx.strokeStyle = rgba(INK.paper, 0.8); ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(tw.x, tw.y - 12 * sc); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
          lifebuoy(x, y, 7 * sc);
        }
      }
    }
    function captain(state, level, t, vision) {
      if (!level || !SW.hasCaptain(level)) return;
      const C = state.captain, sc = scale(), stop = jeepStop(), edge = { x: W + 50, y: stop.y };
      let pos = null;
      if (C.mode === 'driving') pos = { x: lerp(edge.x, stop.x, ease((state.t - C.t0) / SW.RULES.captainDrive)), y: stop.y };
      else if (C.mode === 'looking') pos = stop;
      else if (C.mode === 'leaving') pos = { x: lerp(stop.x, edge.x, ease((state.t - C.t0) / 1.2)), y: stop.y };
      else if (C.warnFor != null) pos = { x: lerp(edge.x, stop.x, ease(1 - (C.warnFor - state.t) / SW.RULES.captainWarn)), y: stop.y };
      if (!pos) return;
      if (C.mode === 'looking') {
        // his gaze sweeps the water
        const k = (state.t - C.t0) / SW.RULES.captainLook, ang = -Math.PI / 2 + Math.sin(k * Math.PI * 2) * 0.9;
        const g = ctx.createRadialGradient(pos.x, pos.y - 10, 10, pos.x, pos.y - 10, H);
        g.addColorStop(0, rgba(INK.violet, 0.26)); g.addColorStop(1, rgba(INK.violet, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(pos.x, pos.y - 10); ctx.arc(pos.x, pos.y - 10, H * 1.2, ang - 0.33, ang + 0.33); ctx.closePath(); ctx.fill();
      }
      const body = vision ? INK.prussian : INK.paper;
      ctx.save(); ctx.translate(pos.x, pos.y);
      ctx.fillStyle = rgba(INK.deep, 0.3); ctx.beginPath(); ctx.ellipse(2, 10 * sc, 23 * sc, 6 * sc, 0, 0, 6.283); ctx.fill();
      ctx.shadowColor = body; ctx.shadowBlur = 4 * sc;
      ctx.fillStyle = body; ctx.fillRect(-21 * sc, -9 * sc, 42 * sc, 17 * sc);
      ctx.shadowBlur = 0;
      ctx.fillStyle = rgba(INK.deep, 0.85); ctx.fillRect(-17 * sc, 7 * sc, 9 * sc, 4 * sc); ctx.fillRect(8 * sc, 7 * sc, 9 * sc, 4 * sc);
      ctx.fillStyle = INK.violet; ctx.beginPath(); ctx.arc(-11 * sc, -1 * sc, 3.2 * sc, 0, 6.283); ctx.fill();   // the badge on the door
      ctx.fillStyle = INK.paper; disc(5 * sc, -13 * sc, 5 * sc);
      ctx.strokeStyle = rgba(INK.deep, 0.6); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(5 * sc, -13 * sc, 5 * sc, 0, 6.283); ctx.stroke();
      ctx.fillStyle = INK.violet; ctx.fillRect(0, -20 * sc, 10 * sc, 4 * sc); ctx.fillRect(-2 * sc, -17 * sc, 14 * sc, 2 * sc);
      ctx.fillStyle = INK.paper; ctx.fillRect(10 * sc, -12 * sc, 6 * sc, 8 * sc);   // clipboard
      ctx.restore();
      const say = s => label(pos.x - 10 * sc, pos.y - 36 * sc, s, INK.violet, sc);
      if (C.mode === 'looking') say('Inspection!');
      else if (C.mode === 'leaving' && C.verdict && state.t - C.verdict.t < 1.6) say(C.verdict.ok ? '★ Safe beach!' : '✗ Unsafe!');
      else if (C.mode === 'driving') say('On my way!');
      else if (C.warnFor != null) say(`Inspection in ${Math.ceil(C.warnFor - state.t)}`);
    }

    // ---------- effects ----------
    // the Captain's seal, slapped onto the print: violet ink on a round paper certificate
    function stamp(k, sc) {
      const z = k < 0.1 ? 1.8 - 0.8 * (k / 0.1) : 1, fade = Math.min(1, (1 - k) * 3);
      const R = 50 * sc;
      ctx.save(); ctx.globalAlpha = fade; ctx.translate(W * 0.5, waterH * 0.48); ctx.rotate(-0.18); ctx.scale(z, z);
      ctx.shadowColor = 'rgba(5,20,60,0.45)'; ctx.shadowBlur = 12 * sc; ctx.shadowOffsetY = 4 * sc;
      ctx.fillStyle = INK.paper; ctx.beginPath();
      for (let q = 0; q <= 48; q++) { const a = q / 48 * 6.283, rr = R * 1.12 * (1 + (q % 2 ? 0.025 : -0.025)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = INK.violet; ctx.fillStyle = INK.violet;
      ctx.lineWidth = 3 * sc; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.stroke();
      ctx.lineWidth = 1.1 * sc; ctx.beginPath(); ctx.arc(0, 0, R * 0.72, 0, 6.283); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(27 * sc)}px ${F_DISPLAY}`; ctx.fillText('Safe', 0, -2 * sc);
      ctx.font = `700 ${Math.round(6.5 * sc)}px ${F_UI}`; ctx.fillText('★  BATHING  ★', 0, 14 * sc);
      // lettering round the rim: along the top, then along the bottom
      ctx.font = `800 ${Math.round(8 * sc)}px ${F_UI}`;
      const rim = (text, top) => {
        [...text].forEach((ch, i) => {
          const a = (i - (text.length - 1) / 2) * 0.2;
          ctx.save();
          if (top) { ctx.rotate(a); ctx.translate(0, -R * 0.86); } else { ctx.rotate(-a); ctx.translate(0, R * 0.86); }
          ctx.fillText(ch, 0, 0); ctx.restore();
        });
      };
      rim('CERTIFIED', true); rim('BY THE CAPTAIN', false);
      // ink that didn't take
      ctx.fillStyle = INK.paper;
      for (let i = 0; i < 110; i++) { const a = hash(i * 2.1) * 6.283, d = hash(i * 3.7) * R * 1.02; ctx.fillRect(Math.cos(a) * d, Math.sin(a) * d, 1.3 * sc, 1.1 * sc); }
      ctx.restore(); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
    function effects(v, t) {
      const vision = v.state && v.state.captain.mode === 'looking', sc = scale();
      for (const e of v.effects) {
        const k = (t - e.t0) / e.dur;
        if (k < 0 || k > 1) continue;
        if (e.type === 'splash') {
          if (!e._poked) { e._poked = true; poke(e.x, e.y, 22); }
          for (let j = 0; j < 10; j++) {
            const a = j / 10 * 6.283, d = 18 * sc * ease(k);
            ctx.fillStyle = rgba(INK.paper, 1 - k); disc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d * 0.6 - Math.sin(k * Math.PI) * 8, 2 * sc);
          }
        } else if (e.type === 'text') {
          ctx.globalAlpha = Math.sin(k * Math.PI);
          ctx.font = `800 ${Math.round((e.size || 14) * sc)}px ${F_UI}`;
          ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(INK.deep, 0.85);
          ctx.strokeText(e.text, e.x, e.y - 20 * k); ctx.fillStyle = e.col || INK.paper; ctx.fillText(e.text, e.x, e.y - 20 * k);
          ctx.textAlign = 'start'; ctx.globalAlpha = 1;
        } else if (e.type === 'tag') {
          const s = v.state && v.state.swimmers[e.who];
          if (!s || s.state === 'saved' || s.state === 'gone' || s.state === 'towed' || vision) continue;
          const p = px(s);
          ctx.globalAlpha = Math.min(1, (1 - k) * 3);
          label(p.x, p.y - 31 * sc, e.text, e.col, sc);
          ctx.globalAlpha = 1;
        } else if (e.type === 'banner') {
          ctx.globalAlpha = Math.min(1, k * 8, (1 - k) * 4);
          plate(W / 2, waterH * (e.low ? 0.8 : 0.2) - (1 - Math.min(1, k * 8)) * 6, e.text, e.sub, e.col || INK.deep, sc);
          ctx.globalAlpha = 1;
        } else if (e.type === 'stamp') {
          stamp(k, sc);
        } else if (e.type === 'whistle') {
          const tw = towerPx(), r = SW.RULES.whistleSpeed * (t - e.t0) * Math.max(W, waterH);
          ctx.strokeStyle = rgba(vision ? INK.prussian : INK.paper, 0.8 * (1 - k));
          for (const [dr, lw] of [[0, 2.4], [7, 1]]) {
            const rr = Math.max(1, r - dr * sc);
            ctx.lineWidth = lw * sc; ctx.beginPath(); ctx.ellipse(tw.x, tw.y, rr, rr * (waterH / W), 0, Math.PI, 2 * Math.PI); ctx.stroke();
          }
        } else if (e.type === 'confetti') {
          const x = e.x + e.vx * k, y = e.y + e.vy * k + 80 * k * k;
          ctx.fillStyle = e.col; ctx.globalAlpha = 1 - k;
          ctx.save(); ctx.translate(x, y); ctx.rotate(k * 9 + e.vx); ctx.fillRect(-2 * sc, -1.2 * sc, 4 * sc, 2.4 * sc); ctx.restore();
          ctx.globalAlpha = 1;
        }
      }
    }

    // ---------- a frame ----------
    function draw(v, t) {
      const st = v.state, vision = !!(st && st.captain.mode === 'looking');
      if (vision !== lastVision) { lastVision = vision; if (vision) visionAt = t; }
      // the sea moves first: noise in, waves out
      if (st) emit(st, t);
      if (t < fieldT || t - fieldT > 1) fieldT = t;
      const steps = Math.min(8, Math.floor((t - fieldT) * FIELD_HZ));
      for (let i = 0; i < steps; i++) stepField();
      fieldT += steps / FIELD_HZ;

      ctx.drawImage(vision ? neg : base, 0, 0, W, H);
      const now = root.performance ? performance.now() : Date.now();
      if (lastDraw && now - lastDraw > 26 && now - lastDraw < 200) slowFrames++; else if (slowFrames > 0) slowFrames -= 0.25;
      lastDraw = now; frameNo++;
      if (slowFrames > 45 && quality < 2) { quality++; slowFrames = 0; }
      if (quality === 0) engrave(t, vision, ctx);
      else {
        if (!cache) [cache, cctx] = layer(W, H);
        if (cacheVision !== vision || frameNo % (quality + 1) === 0) {
          cctx.setTransform(1, 0, 0, 1, 0, 0); cctx.clearRect(0, 0, cache.width, cache.height); cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          engrave(t, vision, cctx); cacheVision = vision;
        }
        ctx.drawImage(cache, 0, 0, W, H);
      }
      if (st && !vision) reserve(st);
      foam(t, vision);
      if (st && !vision) {
        // the drowning first, so the loud ones draw on top
        const order = st.swimmers.slice().sort((a, b) => (b.state === 'drown') - (a.state === 'drown'));
        for (const s of order) swimmer(s, t, st);
      }
      if (st && vision) {
        // the Captain notices the yelling, and nothing else
        for (const s of st.swimmers) if (s.state === 'struggle') {
          const p = px(s), pulse = 0.5 + 0.5 * Math.sin(t * 8);
          ctx.strokeStyle = INK.red; ctx.lineWidth = 2 * scale(); ctx.beginPath(); ctx.arc(p.x, p.y, (7 + 3 * pulse) * scale(), 0, 6.283); ctx.stroke();
        }
      }
      towerLive(t, st, vision);
      if (st) { flights(st); captain(st, v.level, t, vision); }
      // the brushed edge, a little darker where the chemistry pooled, then the paper margin
      if (edgePath) { ctx.save(); ctx.strokeStyle = rgba(vision ? '#8aa3d4' : INK.deep, 0.45); ctx.lineWidth = 3; ctx.stroke(edgePath); ctx.restore(); }
      ctx.drawImage(frame, 0, 0, W, H);
      if (st && vision) {
        const sc = scale();
        ctx.textAlign = 'center';
        ctx.fillStyle = INK.violet; ctx.font = `${Math.round(16 * sc)}px ${F_DISPLAY}`; ctx.fillText('What the Captain sees', W / 2, margin + 22 * sc);
        ctx.fillStyle = rgba(INK.deep, 0.8); ctx.font = `italic ${Math.round(12.5 * sc)}px ${F_ITALIC}`; ctx.fillText('he only reads the ripples', W / 2, margin + 39 * sc);
        ctx.textAlign = 'start';
      }
      effects(v, t);
      if (v.aim && !vision) {
        ctx.strokeStyle = rgba(INK.paper, 0.85); ctx.lineWidth = 1.3;
        reachPath(ctx, v.aim.x, v.aim.y, SW.RULES.reachStruggle); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(v.aim.x - 5, v.aim.y); ctx.lineTo(v.aim.x + 5, v.aim.y); ctx.moveTo(v.aim.x, v.aim.y - 5); ctx.lineTo(v.aim.x, v.aim.y + 5); ctx.stroke();
      }
      // the print flipping to its negative: a quick flash of paper, like a shutter
      const f = (t - visionAt) / 0.25;
      if (vision && f >= 0 && f < 1) { ctx.fillStyle = rgba(INK.paper, 0.7 * (1 - f)); ctx.fillRect(0, 0, W, H); }
    }

    function toWater(x, y) { return { x: x / W, y: y / waterH, inWater: y < waterH }; }
    function toPx(p) { return px(p); }
    function reset() { if (F0) { F0.fill(0); F1.fill(0); } }
    return { reset, resize, draw, toWater, toPx, towerPx, get W() { return W; }, get H() { return H; }, get waterH() { return waterH; } };
  }

  root.SWRender = { createRenderer, INK };
})(typeof window !== 'undefined' ? window : globalThis);
