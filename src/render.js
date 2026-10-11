// HUSH renderer. Every flower's signal history rises from it as a thread of smoke: the thread's width at each
// height is how open the flower was at that past moment. Reading the garden means reading those shapes.
(function (root) {
  'use strict';

  const PAL = {
    skyTop: [11, 15, 34], skyMid: [24, 28, 58], skyLow: [17, 24, 48],
    dawnTop: [58, 64, 112], dawnMid: [196, 132, 140], dawnLow: [246, 196, 150],
    ink: [201, 209, 239], pale: [176, 186, 214], accent: [255, 106, 92], water: [143, 216, 255], gold: [255, 210, 122],
    daisy: [255, 196, 96],
  };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);

  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const L = {};             // layout
    let starField = [];
    let grain = null;
    function makeGrain() {
      try {
        const g = document.createElement('canvas'); g.width = g.height = 256;
        const gc = g.getContext('2d'), img = gc.createImageData(256, 256);
        for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 70; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
        gc.putImageData(img, 0, 0);
        gc.strokeStyle = 'rgba(255,255,255,0.25)'; gc.lineWidth = 0.6;
        for (let k = 0; k < 40; k++) { const x = Math.random() * 256, y = Math.random() * 256, a = Math.random() * 6.28, l = 6 + Math.random() * 18; gc.beginPath(); gc.moveTo(x, y); gc.quadraticCurveTo(x + Math.cos(a + 0.5) * l / 2, y + Math.sin(a + 0.5) * l / 2, x + Math.cos(a) * l, y + Math.sin(a) * l); gc.stroke(); }
        grain = ctx.createPattern(g, 'repeat');
      } catch (e) { grain = null; }
    }
    function paper() {
      if (!grain) makeGrain();
      if (grain) { ctx.save(); ctx.globalAlpha = 0.06; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = grain; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(4,6,16,0.45)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }

    function resize(cssW) {
      dpr = Math.min(2.5, root.devicePixelRatio || 1);
      W = Math.round(cssW); H = Math.round(cssW * 1.04);
      canvas.style.height = H + 'px';
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      L.u = W / 100;
      L.headY = H * 0.74; L.stemBase = H * 0.90; L.pondY = H * 0.86;
      L.threadTop = H * 0.12;
      L.perch = { x: W * 0.86, y: H * 0.15 };
      starField = [];
      for (let i = 0; i < 70; i++) starField.push({ x: hash(i) * W, y: hash(i + 99) * H * 0.62, r: 0.4 + hash(i + 7) * 1.1, p: hash(i + 3) * 6.28 });
    }

    function flowerX(i, n) {
      const left = 0.15, right = 0.85;
      return W * (n === 1 ? 0.5 : left + (right - left) * i / (n - 1));
    }
    function radius(n) { return Math.min(clamp(W / (n * 2.5), 20, 46), W * 0.125); }

    // ---------- background ----------
    function sky(t, dawn, night) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rgba(mix(PAL.skyTop, PAL.dawnTop, dawn), 1));
      g.addColorStop(0.55, rgba(mix(PAL.skyMid, PAL.dawnMid, dawn), 1));
      g.addColorStop(1, rgba(mix(PAL.skyLow, PAL.dawnLow, dawn * 0.8), 1));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const s of starField) {
        const a = (0.35 + 0.35 * Math.sin(t * 1.3 + s.p)) * (1 - dawn);
        ctx.fillStyle = rgba(PAL.ink, a); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      // moon
      const prog = night == null ? 0.05 : clamp(night, 0, 1);
      const mx = W * (0.10 + 0.62 * prog), my = H * (0.15 - 0.06 * Math.sin(prog * Math.PI)), mr = W * 0.045;
      const halo = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 5);
      halo.addColorStop(0, rgba([230, 232, 255], 0.22 * (1 - dawn * 0.7)));
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, mr * 5, 0, 6.283); ctx.fill();
      {
        // crescent: the outer disc minus an offset disc, traced along both arcs
        const bx = mx + mr * 0.42, by = my - mr * 0.18, br = mr * 0.9;
        const d = Math.hypot(bx - mx, by - my), a = Math.atan2(by - my, bx - mx);
        const cosA = (mr * mr + d * d - br * br) / (2 * mr * d), alpha = Math.acos(clamp(cosA, -1, 1));
        const cosB = (br * br + d * d - mr * mr) / (2 * br * d), beta = Math.acos(clamp(cosB, -1, 1));
        ctx.fillStyle = rgba([236, 238, 255], 0.92 - dawn * 0.5);
        ctx.beginPath();
        ctx.arc(mx, my, mr, a + alpha, a - alpha + 6.283);
        ctx.arc(bx, by, br, a + Math.PI + beta, a + Math.PI - beta, true);
        ctx.closePath(); ctx.fill();
      }
      // ink hills
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = rgba(mix([20, 24, 52], [120, 92, 120], dawn), 0.35 + k * 0.12);
        ctx.beginPath(); ctx.moveTo(0, H);
        const base = H * (0.66 + k * 0.06);
        for (let x = 0; x <= W; x += W / 24) {
          const y = base - (Math.sin(x / W * (3 + k) + k * 2) * 0.5 + 0.5) * H * (0.07 - k * 0.015) - hash(Math.floor(x) + k * 50) * 2;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.fill();
      }
    }

    function branch() {
      const p = L.perch;
      ctx.strokeStyle = rgba([40, 36, 52], 0.95); ctx.lineCap = 'round';
      ctx.lineWidth = L.u * 1.6;
      ctx.beginPath(); ctx.moveTo(W + 4, p.y + L.u * 5.5); ctx.quadraticCurveTo(W * 0.92, p.y + L.u * 4.8, W * 0.74, p.y + L.u * 6.6); ctx.stroke();
      ctx.lineWidth = L.u * 0.7;
      ctx.beginPath(); ctx.moveTo(W * 0.80, p.y + L.u * 6.0); ctx.quadraticCurveTo(W * 0.77, p.y + L.u * 3.5, W * 0.72, p.y + L.u * 2.4); ctx.stroke();
      ctx.fillStyle = rgba([34, 40, 54], 0.9);
      for (let i = 0; i < 5; i++) {
        const lx = W * (0.73 + i * 0.05), ly = p.y + L.u * (6.2 + (i % 2) * 0.8);
        ctx.beginPath(); ctx.ellipse(lx, ly, L.u * 1.6, L.u * 0.6, 0.5 + i, 0, 6.283); ctx.fill();
      }
    }

    function pond(t, dawn) {
      const g = ctx.createLinearGradient(0, L.pondY, 0, H);
      g.addColorStop(0, rgba(mix([14, 22, 46], [90, 80, 110], dawn), 0.96));
      g.addColorStop(1, rgba(mix([8, 12, 28], [60, 56, 84], dawn), 1));
      ctx.fillStyle = g; ctx.fillRect(0, L.pondY, W, H - L.pondY);
      ctx.strokeStyle = rgba(PAL.ink, 0.08);
      ctx.lineWidth = 1;
      for (let k = 0; k < 7; k++) {
        const y = L.pondY + 4 + k * (H - L.pondY) / 7;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.05 + t * 0.8 + k) * 1.2);
        ctx.stroke();
      }
    }

    // ---------- smoke threads ----------
    function thread(v, i, n, t, breathT) {
      const f = v.flowers[i];
      const x0 = flowerX(i, n), r = radius(n);
      const y0 = L.headY - r * 0.6;
      const hist = f.hist;
      const span = 14;                       // breaths of history shown
      const step = (y0 - L.threadTop) / span;
      const pts = [];
      for (let k = hist.length - 1; k >= 0; k--) {
        const age = (hist.length - 1 - k) + breathT;
        if (age > span + 1) break;
        const s = hist[k];
        const y = y0 - age * step;
        const sway = Math.sin(t * 0.7 + age * 0.55 + i * 1.7) * age * 0.55 * L.u * 0.25 + (s.jog || 0);
        pts.push({ x: x0 + sway, y, s, age });
      }
      if (pts.length < 2) return;
      const fadeTop = a => clamp(1 - (a - span + 6) / 6, 0, 1);
      // Smooth the samples (Catmull-Rom) and draw the thread as a ribbon whose width follows the bloom.
      const dense = [];
      for (let k = 0; k < pts.length - 1; k++) {
        const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)];
        for (let j = 0; j < 4; j++) {
          const u = j / 4, u2 = u * u, u3 = u2 * u;
          const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
          dense.push({ x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y),
            o: p1.s.b + (p2.s.b - p1.s.b) * u, age: p1.age + (p2.age - p1.age) * u,
            hide: (p1.s.fog || p2.s.fog) ? 1 : (p1.s.glass || p2.s.glass) ? 0.85 : 0 });
        }
      }
      dense.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, o: pts[pts.length - 1].s.b, age: pts[pts.length - 1].age, hide: pts[pts.length - 1].s.fog ? 1 : 0 });
      const ribbon = (widthOf, alphaOf, blur) => {
        const left = [], right = [];
        for (let k = 0; k < dense.length; k++) {
          const a = dense[Math.max(0, k - 1)], b = dense[Math.min(dense.length - 1, k + 1)];
          let nx = -(b.y - a.y), ny = b.x - a.x; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
          const w = widthOf(dense[k]) / 2;
          left.push([dense[k].x + nx * w, dense[k].y + ny * w]); right.push([dense[k].x - nx * w, dense[k].y - ny * w]);
        }
        const g = ctx.createLinearGradient(0, dense[0].y, 0, dense[dense.length - 1].y);
        const yspan = (dense[dense.length - 1].y - dense[0].y) || 1;
        for (let k = 0; k < dense.length; k += 2) {
          const d = dense[k], pos = clamp((d.y - dense[0].y) / yspan, 0, 1);
          g.addColorStop(pos, rgba(mix(PAL.pale, PAL.accent, d.o), alphaOf(d) * fadeTop(d.age) * (1 - d.hide)));
        }
        if (blur && ctx.filter !== undefined) ctx.filter = `blur(${blur}px)`;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]);
        for (const q of left) ctx.lineTo(q[0], q[1]);
        for (let k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k][0], right[k][1]);
        ctx.closePath(); ctx.fill();
        if (blur && ctx.filter !== undefined) ctx.filter = 'none';
      };
      const ws = L.u * 0.3;
      const taper = d => 0.35 + 0.65 * fadeTop(d.age);
      ribbon(d => (4 + d.o * 22 + d.age * 0.5) * ws * taper(d), d => 0.10 + 0.20 * d.o, Math.max(2, L.u * 0.9));
      ribbon(d => (1.2 + d.o * 9) * ws * taper(d), d => 0.38 + 0.55 * d.o, 0);
      ribbon(d => (0.5 + d.o * 2.5) * ws * taper(d), d => 0.25 + 0.5 * d.o, 0);
      // marks on the thread: water beads, gusts, inspections
      for (const p of pts) {
        if (p.s.fog) continue;
        const fade = fadeTop(p.age);
        if (p.s.water) {
          ctx.fillStyle = rgba(PAL.water, 0.9 * fade);
          ctx.beginPath(); ctx.arc(p.x, p.y, L.u * 0.85, 0, 6.283); ctx.fill();
          ctx.strokeStyle = rgba(PAL.water, 0.35 * fade); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(p.x, p.y, L.u * 1.6, 0, 6.283); ctx.stroke();
        }
        if (p.s.gust) {
          ctx.strokeStyle = rgba(PAL.ink, 0.7 * fade); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(p.x - L.u * 3.2, p.y - L.u * 0.6);
          ctx.bezierCurveTo(p.x - L.u * 1.5, p.y - L.u * 1.4, p.x - L.u * 0.4, p.y + L.u * 0.6, p.x + L.u * 1.4, p.y - L.u * 0.2); ctx.stroke();
          ctx.fillStyle = rgba([150, 170, 120], 0.8 * fade);
          ctx.beginPath(); ctx.ellipse(p.x - L.u * 3.4, p.y - L.u * 0.6, L.u * 0.9, L.u * 0.4, -0.6, 0, 6.283); ctx.fill();
        }
        if (p.s.pass) {
          ctx.strokeStyle = rgba(PAL.gold, 0.9 * fade); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(p.x, p.y, L.u * 1.3, 0, 6.283); ctx.stroke();
        }
        if (p.s.caught) {
          ctx.strokeStyle = rgba(PAL.accent, 0.95 * fade); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(p.x - L.u, p.y - L.u); ctx.lineTo(p.x + L.u, p.y + L.u); ctx.moveTo(p.x + L.u, p.y - L.u); ctx.lineTo(p.x - L.u, p.y + L.u); ctx.stroke();
        }
      }
      // fog over a hidden past
      if (f.fogUntil != null) {
        const fogTop = L.threadTop, fogBottom = y0 - (hist.length - 1 - f.fogUntil + breathT) * step;
        if (fogBottom > fogTop) {
          for (let k = 0; k < 9; k++) {
            const yy = fogTop + (fogBottom - fogTop) * (k + 0.5) / 9 + Math.sin(t * 0.4 + k) * 4;
            const xx = x0 + Math.sin(t * 0.3 + k * 1.7) * r * 0.35;
            const rr = r * (0.7 + 0.3 * hash(i * 10 + k));
            const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, rr);
            g.addColorStop(0, 'rgba(150,160,200,0.20)'); g.addColorStop(1, 'rgba(150,160,200,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(xx, yy, rr, rr * 0.55, 0, 0, 6.283); ctx.fill();
          }
        }
      }
    }

    // ---------- flowers ----------
    function stem(x, r, f, t) {
      const droop = f.deadT != null ? ease((t - f.deadT) / 0.8) : 0;
      const sway = Math.sin(t * 0.9 + x * 0.03) * r * 0.06 + (f.jolt || 0) * r * 0.5;
      const hx = x + sway + droop * r * 0.7, hy = L.headY + droop * r * 0.9;
      ctx.strokeStyle = rgba(mix([92, 128, 110], [90, 90, 96], droop), 0.95);
      ctx.lineWidth = Math.max(2, r * 0.09); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, L.stemBase); ctx.quadraticCurveTo(x - r * 0.15, (L.stemBase + hy) / 2, hx, hy); ctx.stroke();
      ctx.fillStyle = rgba([70, 108, 92], 0.95);
      ctx.beginPath(); ctx.ellipse(x - r * 0.38, L.stemBase - r * 0.42, r * 0.42, r * 0.14, -0.5, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + r * 0.34, L.stemBase - r * 0.68, r * 0.36, r * 0.12, 0.6, 0, 6.283); ctx.fill();
      // pad on the water
      ctx.fillStyle = rgba([22, 48, 56], 0.9);
      ctx.beginPath(); ctx.ellipse(x, L.stemBase + r * 0.05, r * 0.95, r * 0.22, 0, 0.25, 6.0); ctx.fill();
      return { hx, hy };
    }

    function head(hx, hy, r, f, t) {
      const o = clamp(f.shown, 0, 1.08);          // displayed openness (springs slightly past 1)
      const oc = Math.min(1, o);
      const dead = f.deadT != null;
      const fold = f.kind === 'fold';
      const petals = fold ? 7 : 13;
      const col = dead ? [96, 96, 104] : mix(fold ? PAL.pale : [214, 214, 196], PAL.accent, oc);
      // glow
      if (!dead && o > 0.05) {
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * (1.2 + o * 1.4));
        g.addColorStop(0, rgba(PAL.accent, 0.28 * oc)); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, r * (1.2 + o * 1.4), 0, 6.283); ctx.fill();
      }
      const spread = 0.12 + 0.88 * o;
      for (let k = 0; k < petals; k++) {
        const u = petals === 1 ? 0 : k / (petals - 1) - 0.5;          // -0.5..0.5
        const ang = u * Math.PI * 1.7 * spread + Math.sin(t * 1.1 + k) * 0.02;
        const len = r * (fold ? 0.62 + 0.38 * o : 0.5 + 0.3 * o);
        const wid = r * (fold ? 0.22 : 0.10);
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
        const shade = 0.85 + 0.15 * Math.cos(u * 3);
        ctx.fillStyle = rgba(col.map(c => c * shade), dead ? 0.7 : 0.96);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-wid, -len * 0.55, 0, -len);
        ctx.quadraticCurveTo(wid, -len * 0.55, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      // heart
      ctx.fillStyle = dead ? 'rgba(70,70,76,0.9)' : rgba(fold ? mix([255, 220, 200], PAL.accent, o * 0.5) : PAL.daisy, 0.95);
      ctx.beginPath(); ctx.arc(hx, hy, r * (0.12 + 0.06 * o), 0, 6.283); ctx.fill();
    }

    function cloche(hx, hy, r, f, t) {
      const left = f.cloche, total = 6;
      const w = r * 1.08, top = hy - r * 1.45, base = hy + r * 0.55;
      ctx.save();
      // trapped smoke coiling inside the glass
      ctx.strokeStyle = rgba(mix(PAL.pale, PAL.accent, f.shown), 0.22);
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      for (let k = 0; k <= 40; k++) {
        const a = k / 40 * 6.283 * 2 + t * 0.8;
        const rr = r * (0.25 + 0.5 * k / 40);
        const xx = hx + Math.cos(a) * rr * 0.8, yy = hy - r * 0.55 + Math.sin(a) * rr * 0.45 - k / 40 * r * 0.3;
        k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
      // the dome
      ctx.beginPath();
      ctx.moveTo(hx - w, base);
      ctx.lineTo(hx - w, hy - r * 0.3);
      ctx.bezierCurveTo(hx - w, top, hx + w, top, hx + w, hy - r * 0.3);
      ctx.lineTo(hx + w, base);
      ctx.fillStyle = 'rgba(200,220,255,0.07)'; ctx.fill();
      ctx.strokeStyle = 'rgba(225,235,255,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = r * 0.06;
      ctx.beginPath(); ctx.moveTo(hx - w * 0.62, hy - r * 0.1); ctx.quadraticCurveTo(hx - w * 0.62, hy - r * 0.95, hx - w * 0.2, top + r * 0.22); ctx.stroke();
      ctx.fillStyle = 'rgba(225,235,255,0.6)'; ctx.beginPath(); ctx.arc(hx, top + r * 0.05, r * 0.09, 0, 6.283); ctx.fill();
      if (f.underGlass) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
        const cx = hx + w * 0.3, cy = hy - r * 0.6;
        for (let k = 0; k < 7; k++) {
          const a = k * 0.9 + 0.2, l = r * (0.35 + 0.25 * hash(k + 3));
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * l * 0.5, cy + Math.sin(a) * l * 0.5 + 2); ctx.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); ctx.stroke();
        }
        ctx.restore();
        return;
      }
      // breaths of glass left
      for (let k = 0; k < total; k++) {
        ctx.fillStyle = k < left ? rgba(PAL.gold, 0.85) : 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.arc(hx - w * 0.7 + (w * 1.4) * k / (total - 1), base + r * 0.2, r * 0.05 + 1, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }

    function reflection(hx, r, f) {
      if (f.deadT != null) return;
      const o = f.shown;
      ctx.fillStyle = rgba(mix(PAL.pale, PAL.accent, o), 0.10 + 0.12 * o);
      ctx.beginPath(); ctx.ellipse(hx, L.stemBase + r * 0.55, r * (0.3 + 0.5 * o), r * 0.12, 0, 0, 6.283); ctx.fill();
    }

    // ---------- the Owl ----------
    function owlShape(x, y, s, o, t) {
      // o: {eyes:'open'|'closed'|'glow', flap, look:{x,y}, selected}
      ctx.save(); ctx.translate(x, y);
      if (o.selected) {
        const g = ctx.createRadialGradient(0, 0, s * 0.5, 0, 0, s * 2.6);
        g.addColorStop(0, 'rgba(255,207,107,0.35)'); g.addColorStop(1, 'rgba(255,207,107,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 2.6, 0, 6.283); ctx.fill();
      }
      const body = [176, 158, 132], dark = [96, 82, 70];
      if (o.flap != null) {
        const fl = Math.sin(o.flap) * 0.9;
        ctx.fillStyle = rgba(dark, 0.95);
        for (const side of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(side * s * 0.4, -s * 0.1);
          ctx.quadraticCurveTo(side * s * 1.8, -s * (0.6 + fl), side * s * 2.0, s * (0.3 - fl * 0.6));
          ctx.quadraticCurveTo(side * s * 1.1, s * 0.25, side * s * 0.4, s * 0.35); ctx.fill();
        }
      }
      ctx.fillStyle = rgba(body, 1);
      ctx.beginPath(); ctx.ellipse(0, s * 0.25, s * 0.78, s * 0.95, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -s * 0.55, s * 0.72, s * 0.6, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s * 0.62, -s * 0.85); ctx.lineTo(-s * 0.48, -s * 1.3); ctx.lineTo(-s * 0.25, -s * 0.98); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.62, -s * 0.85); ctx.lineTo(s * 0.48, -s * 1.3); ctx.lineTo(s * 0.25, -s * 0.98); ctx.fill();
      ctx.fillStyle = rgba([210, 196, 170], 1);
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.5, s * 0.62, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = rgba(dark, 0.6); ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, s * (0.1 + k * 0.28), s * 0.28, 0.4, 2.7); ctx.stroke(); }
      for (const side of [-1, 1]) {
        const ex = side * s * 0.3, ey = -s * 0.58;
        ctx.fillStyle = rgba([238, 228, 206], 1); ctx.beginPath(); ctx.arc(ex, ey, s * 0.27, 0, 6.283); ctx.fill();
        if (o.eyes === 'closed') {
          ctx.strokeStyle = rgba(dark, 1); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(ex, ey - s * 0.02, s * 0.15, 0.3, 2.8); ctx.stroke();
        } else {
          const lx = o.look ? clamp(o.look.x, -1, 1) * s * 0.08 : 0, ly = o.look ? clamp(o.look.y, -1, 1) * s * 0.08 : 0;
          ctx.fillStyle = o.eyes === 'glow' ? '#ffcf6b' : '#e8a943';
          ctx.beginPath(); ctx.arc(ex + lx, ey + ly, s * 0.17, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.arc(ex + lx, ey + ly, s * 0.08, 0, 6.283); ctx.fill();
        }
      }
      ctx.fillStyle = rgba([120, 92, 60], 1);
      ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.42); ctx.lineTo(s * 0.08, -s * 0.42); ctx.lineTo(0, -s * 0.26); ctx.fill();
      ctx.restore();
    }

    function owl(v, n, t, breathT) {
      const ow = v.owl, s = clamp(W * 0.038, 12, 24);
      const p = L.perch;
      const hover = i => ({ x: flowerX(i, n), y: L.headY - radius(n) * 2.3 });
      let x = p.x, y = p.y, flap = null, eyes = 'open', look = null;
      if (ow.mode === 'flying') {
        const h = hover(ow.target), k = ease(breathT);
        const cx = (p.x + h.x) / 2, cy = Math.min(p.y, h.y) - H * 0.08;
        x = (1 - k) * (1 - k) * p.x + 2 * (1 - k) * k * cx + k * k * h.x;
        y = (1 - k) * (1 - k) * p.y + 2 * (1 - k) * k * cy + k * k * h.y;
        flap = t * 14; eyes = 'glow';
      } else if (ow.mode === 'resting' && ow.returnT != null && t - ow.returnT < 0.7) {
        const h = hover(ow.target), k = ease((t - ow.returnT) / 0.7);
        x = h.x + (p.x - h.x) * k; y = h.y + (p.y - h.y) * k - Math.sin(k * Math.PI) * H * 0.05;
        flap = t * 14; eyes = 'open';
      } else if (ow.mode === 'resting') {
        eyes = 'closed';
      }
      // where it is looking next
      if (ow.gaze != null && ow.mode === 'idle') {
        const h = hover(ow.gaze);
        look = { x: (h.x - x) / W * 4, y: (h.y - y) / H * 4 };
        ctx.setLineDash([3, 5]); ctx.strokeStyle = 'rgba(255,207,107,0.55)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.5); ctx.quadraticCurveTo((x + h.x) / 2, Math.min(y, h.y) - H * 0.06, h.x, h.y + radius(n) * 0.6); ctx.stroke();
        ctx.setLineDash([]);
        eyes = 'glow';
      }
      if (ow.inspectT != null && t - ow.inspectT < 0.5) eyes = 'glow';
      if (ow.mode === 'resting' && (ow.returnT == null || t - ow.returnT >= 0.7)) {
        ctx.fillStyle = 'rgba(201,209,239,0.6)'; ctx.font = `${Math.round(s * 0.8)}px Georgia`;
        const zz = (t * 0.8) % 1;
        ctx.fillText('z', x + s * 0.9, y - s * (1 + zz)); ctx.fillText('z', x + s * 1.3, y - s * (1.5 + zz));
      }
      owlShape(x, y, s, { eyes, flap, look, selected: ow.selected }, t);
      if (ow.drag) owlShape(ow.drag.x, ow.drag.y, s * 0.9, { eyes: 'glow', flap: t * 10, selected: true }, t);
      return { x, y, s };
    }

    // ---------- effects ----------
    function effects(v, t) {
      for (const e of v.effects) {
        const k = (t - e.t0) / e.dur;
        if (k < 0 || k > 1) continue;
        if (e.type === 'drop') {
          const y = e.y0 + (e.y1 - e.y0) * ease(k);
          ctx.fillStyle = rgba(PAL.water, 0.95 * (1 - k * 0.3));
          ctx.beginPath(); ctx.ellipse(e.x, y, 3, 5, 0, 0, 6.283); ctx.fill();
        } else if (e.type === 'ring') {
          ctx.strokeStyle = rgba(e.col, (1 - k) * (e.a || 0.8)); ctx.lineWidth = e.w || 2;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r0 + (e.r1 - e.r0) * ease(k), 0, 6.283); ctx.stroke();
        } else if (e.type === 'spark') {
          const x = e.x + e.vx * k, y = e.y + e.vy * k + 30 * k * k;
          ctx.fillStyle = rgba(e.col, 1 - k); ctx.beginPath(); ctx.arc(x, y, e.r * (1 - k * 0.5), 0, 6.283); ctx.fill();
        } else if (e.type === 'petal') {
          const x = e.x + e.vx * k + Math.sin(k * 8 + e.p) * 6, y = e.y + e.vy * k + 60 * k * k;
          ctx.save(); ctx.translate(x, y); ctx.rotate(k * 5 + e.p);
          ctx.fillStyle = rgba(e.col, 1 - k); ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, 6.283); ctx.fill(); ctx.restore();
        } else if (e.type === 'wind') {
          ctx.strokeStyle = rgba(PAL.ink, 0.35 * Math.sin(k * Math.PI)); ctx.lineWidth = 1.2;
          for (let j = 0; j < 4; j++) {
            const yy = e.y - 12 + j * 9, xx = e.x - 60 + k * 90 + j * 6;
            ctx.beginPath(); ctx.moveTo(xx - 26, yy); ctx.quadraticCurveTo(xx - 10, yy - 5, xx + 6, yy); ctx.stroke();
          }
        } else if (e.type === 'text') {
          ctx.globalAlpha = Math.sin(k * Math.PI);
          ctx.fillStyle = rgba(e.col, 1); ctx.font = `${e.size || 14}px Georgia`; ctx.textAlign = 'center';
          ctx.fillText(e.text, e.x, e.y - 16 * k); ctx.textAlign = 'start'; ctx.globalAlpha = 1;
        } else if (e.type === 'crack') {
          ctx.strokeStyle = rgba([255, 255, 255], 0.8 * (1 - k)); ctx.lineWidth = 1.2;
          for (let j = 0; j < 6; j++) {
            const a = j * 1.05 + 0.3;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * e.r * (0.4 + 0.6 * k), e.y + Math.sin(a) * e.r * (0.4 + 0.6 * k)); ctx.stroke();
          }
        }
      }
    }

    function labels(v, t, n) {
      for (const lb of v.labels || []) {
        const k = clamp((t - lb.t0) / 0.6, 0, 1) * (lb.gone ? clamp(1 - (t - lb.gone) / 0.4, 0, 1) : 1);
        if (k <= 0) continue;
        const x0 = flowerX(lb.f, n), r = radius(n);
        const y = L.headY - r * 0.6 - (L.headY - L.threadTop) * lb.at;
        ctx.font = `italic ${Math.round(clamp(W * 0.034, 11, 15))}px Georgia`;
        const tw = ctx.measureText(lb.text).width;
        let right = x0 < W * 0.55;
        if (right && x0 + r * 0.9 + tw + 8 > W) right = false;
        if (!right && x0 - r * 0.9 - tw - 8 < 0) right = true;
        const tx = right ? x0 + r * 0.9 : x0 - r * 0.9;
        ctx.globalAlpha = k;
        ctx.strokeStyle = 'rgba(232,236,255,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0 + (right ? 6 : -6), y); ctx.lineTo(tx, y); ctx.stroke();
        ctx.fillStyle = 'rgba(232,236,255,0.92)'; ctx.font = `italic ${Math.round(clamp(W * 0.034, 11, 15))}px Georgia`;
        ctx.textAlign = right ? 'left' : 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(lb.text, tx + (right ? 4 : -4), y);
        ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
      }
    }

    function draw(v, t) {
      const n = v.flowers.length;
      const bt = v.breathT;
      sky(t, v.dawn || 0, v.level && v.level.length < 9999 ? (v.state.breath + (v.running ? v.breathT : 0)) / v.level.length : null);
      branch();
      for (let i = 0; i < n; i++) thread(v, i, n, t, bt);
      pond(t, v.dawn || 0);
      const heads = [];
      for (let i = 0; i < n; i++) {
        const f = v.flowers[i], x = flowerX(i, n), r = radius(n);
        // telegraphed gust
        if (f.gustSoon) {
          f.jolt = Math.sin(t * 22) * 0.06;
          ctx.strokeStyle = `rgba(201,209,239,${0.18 + 0.12 * Math.sin(t * 9)})`; ctx.lineWidth = 1;
          for (let j = 0; j < 3; j++) {
            const yy = L.headY - r * (0.2 + j * 0.45), ph = ((t * 0.9 + j * 0.3) % 1);
            const xx = x - r * 3.2 + ph * r * 2.2;
            ctx.beginPath(); ctx.moveTo(xx - r * 0.9, yy); ctx.quadraticCurveTo(xx - r * 0.4, yy - r * 0.18, xx, yy); ctx.stroke();
          }
        } else if (!f.joltT || t - f.joltT > 0.6) f.jolt = 0;
        const h = stem(x, r, f, t);
        reflection(h.hx, r, f);
        head(h.hx, h.hy, r, f, t);
        if ((f.cloche > 0 && f.deadT == null) || f.underGlass) cloche(h.hx, h.hy, r, f, t);
        if (v.owl.selected && !f.cloche && f.deadT == null) {
          ctx.strokeStyle = 'rgba(255,207,107,0.45)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(h.hx, h.hy, r * 1.15, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
        }
        if (v.owl.gaze === i && v.owl.mode === 'idle') {
          ctx.strokeStyle = `rgba(255,207,107,${0.35 + 0.25 * Math.sin(t * 6)})`; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(h.hx, h.hy, r * 1.25, 0, 6.283); ctx.stroke();
        }
        if (f.pulse) {
          ctx.strokeStyle = `rgba(143,216,255,${0.35 + 0.3 * Math.sin(t * 5)})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(h.hx, h.hy, r * (1.1 + 0.1 * Math.sin(t * 5)), 0, 6.283); ctx.stroke();
        }
        heads.push(h);
      }
      L.heads = heads;
      if (v.level && v.level.owl) L.owlPos = owl(v, n, t, bt); else L.owlPos = null;
      effects(v, t);
      labels(v, t, n);
      paper();
    }

    function hitFlower(x, y, n) {
      if (!L.heads) return -1;
      const r = radius(n);
      let best = -1, bd = 1e9;
      L.heads.forEach((h, i) => {
        const dx = x - h.hx, dy = y - h.hy;
        if (Math.abs(dx) < Math.max(r * 1.1, W / n / 2) && dy > -r * 2.2 && dy < (L.stemBase - h.hy) + r * 0.5) {
          const d = dx * dx + dy * dy * 0.2;
          if (d < bd) { bd = d; best = i; }
        }
      });
      return best;
    }
    function hitOwl(x, y) {
      if (!L.owlPos) return false;
      const o = L.owlPos;
      return Math.hypot(x - o.x, y - o.y) < Math.max(o.s * 2.4, 28);
    }
    function headPos(i) { return L.heads && L.heads[i] ? { x: L.heads[i].hx, y: L.heads[i].hy } : { x: 0, y: 0 }; }

    return { resize, draw, hitFlower, hitOwl, headPos, flowerX, radius, get W() { return W; }, get H() { return H; }, L };
  }

  root.HushRender = { createRenderer };
})(typeof window !== 'undefined' ? window : globalThis);
