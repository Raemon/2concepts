// STILL WATER renderer. Top-down beach. Every splash and shout sends rings across the water, so the sea is a map
// of noise, and a swimmer in real trouble shows up as a hole in it. During an inspection the picture switches to
// what the Captain can see: only the rings.
(function (root) {
  'use strict';
  const SW = root.SW;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hash = SW.hash;

  const SKIN = ['#f1c7a3', '#d9a27e', '#a86f4c', '#7a4a2f', '#f4d2b8', '#c68b63'];
  const HAIR = ['#2b2018', '#6b3e1f', '#d9b25e', '#1c1c1c', '#9a4a26', '#4a3a2a'];
  const CAP = ['#ff5a5f', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#8338ec', '#fb8500'];

  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, waterH = 0, dpr = 1;
    const noise = [];                 // sound rings on the water: {x,y,t0,r,str}
    const decor = [];

    function resize(cssW) {
      dpr = Math.min(2.5, root.devicePixelRatio || 1);
      W = Math.round(cssW); H = Math.round(cssW * (cssW < 480 ? 1.12 : 0.92));
      waterH = Math.round(H * 0.8);
      canvas.style.height = H + 'px';
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      decor.length = 0;
      // towels and umbrellas, keeping the middle of the sand clear for the tower and the Captain's jeep
      const spots = [[0.06, 0.7], [0.17, 0.3], [0.28, 0.75], [0.8, 0.35], [0.9, 0.78], [0.97, 0.25], [0.36, 0.25]];
      spots.forEach(([u, v], i) => decor.push({ x: u * W, y: waterH + 14 + v * (H - waterH - 30), c: CAP[i % CAP.length], k: hash(i + 4) }));
    }
    const px = p => ({ x: p.x * W, y: p.y * waterH });
    // logic distances are in water units, so a reach circle is an ellipse on screen
    function reachPath(x, y, r) { ctx.beginPath(); ctx.ellipse(x, y, r * W, r * waterH, 0, 0, 6.283); }
    const towerPx = () => ({ x: W * 0.5, y: waterH + (H - waterH) * 0.42 });
    const scale = () => clamp(W / 360, 0.95, 1.6);

    // ---------- the sea ----------
    function sea(t, vision) {
      const g = ctx.createLinearGradient(0, 0, 0, waterH);
      g.addColorStop(0, vision ? '#0c1d2b' : '#1b6f9c');
      g.addColorStop(0.55, vision ? '#0f2433' : '#2a9cc0');
      g.addColorStop(1, vision ? '#14303f' : '#5fd0d6');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, waterH);
      if (vision) return;
      // swells rolling toward shore
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.4 * scale();
      for (let k = 0; k < 9; k++) {
        const y = ((k / 9 + t * 0.018) % 1) * waterH;
        ctx.beginPath();
        for (let x = -10; x <= W + 10; x += 12) {
          const yy = y + Math.sin(x * 0.03 + k * 1.7 + t * 0.6) * 3 + Math.sin(x * 0.011 + k) * 5;
          x === -10 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.globalAlpha = 0.35 + 0.65 * (y / waterH);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // sparkle
      for (let i = 0; i < 26; i++) {
        const x = hash(i * 3.1) * W, y = hash(i * 7.7) * waterH * 0.9;
        const a = Math.max(0, Math.sin(t * 1.7 + i * 2.3)) * 0.55;
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(x, y, 2 * scale(), 2 * scale());
      }
    }

    function sand(t) {
      const top = waterH;
      const g = ctx.createLinearGradient(0, top, 0, H);
      g.addColorStop(0, '#f3d9a4'); g.addColorStop(1, '#e9c584');
      ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
      // wet sand and foam line
      ctx.fillStyle = 'rgba(190,150,90,0.35)';
      ctx.beginPath(); ctx.moveTo(0, top);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, top + 8 + Math.sin(x * 0.04 + t * 0.9) * 3);
      ctx.lineTo(W, top); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3 * scale();
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) { const y = top + 2 + Math.sin(x * 0.05 + t * 1.2) * 2.5; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      // towels and umbrellas
      for (const d of decor) {
        ctx.save(); ctx.translate(d.x, d.y); ctx.rotate((d.k - 0.5) * 0.6);
        ctx.fillStyle = d.c; ctx.globalAlpha = 0.85; ctx.fillRect(-12 * scale(), -6 * scale(), 24 * scale(), 12 * scale());
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-12 * scale(), -1.5 * scale(), 24 * scale(), 3 * scale());
        ctx.restore();
        if (d.k > 0.5) {
          ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(d.x + 10, d.y + 8, 18 * scale(), 9 * scale(), 0, 0, 6.283); ctx.fill();
          for (let s = 0; s < 8; s++) {
            ctx.fillStyle = s % 2 ? '#ffffff' : d.c;
            ctx.beginPath(); ctx.moveTo(d.x + 4, d.y - 4); ctx.arc(d.x + 4, d.y - 4, 16 * scale(), s * 0.785, (s + 1) * 0.785); ctx.fill();
          }
        }
      }
    }

    function tower(t, state, vision) {
      const p = towerPx(), s = scale();
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(6, 20 * s, 30 * s, 10 * s, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#d64545'; ctx.fillRect(-22 * s, -14 * s, 44 * s, 30 * s);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-22 * s, -2 * s, 44 * s, 6 * s);
      ctx.fillStyle = '#b83232'; ctx.beginPath(); ctx.moveTo(-28 * s, -14 * s); ctx.lineTo(0, -26 * s); ctx.lineTo(28 * s, -14 * s); ctx.fill();
      // the lifeguard
      const busy = state && SW.inspecting(state);
      ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.arc(0, -4 * s, 8 * s, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#f1c7a3'; ctx.beginPath(); ctx.arc(0, -9 * s, 5.5 * s, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#2b2018'; ctx.beginPath(); ctx.arc(0, -11 * s, 5.5 * s, Math.PI, 0); ctx.fill();
      if (busy) { ctx.fillStyle = '#333'; ctx.font = `${Math.round(10 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('…', 0, -22 * s); ctx.textAlign = 'start'; }
      // rings waiting on the tower
      if (state) {
        const ready = state.rings.filter(r => r.mode === 'ready').length;
        for (let k = 0; k < state.rings.length; k++) {
          const rx = (-14 + k * 14 - (state.rings.length - 1) * 7 + 14) * s, ry = 10 * s;
          ctx.globalAlpha = k < ready ? 1 : 0.25;
          ringShape(rx, ry, 6 * s);
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    }

    function ringShape(x, y, r) {
      ctx.lineWidth = r * 0.55;
      for (let q = 0; q < 4; q++) {
        ctx.strokeStyle = q % 2 ? '#ffffff' : '#ff3b3b';
        ctx.beginPath(); ctx.arc(x, y, r, q * 1.5708, (q + 1) * 1.5708); ctx.stroke();
      }
    }

    // ---------- noise rings ----------
    function emitNoise(state, t) {
      for (const s of state.swimmers) {
        const p = px(s);
        const k = s.id * 1.37;
        let every = 0, str = 0;
        if (s.state === 'struggle') { every = 0.22; str = 1; }
        else if (s.state === 'swim' && s.kind === 'swimmer') { every = 1.1; str = 0.35; }
        else if (s.state === 'swim' && s.kind !== 'floater') { every = 2.4; str = 0.18; }
        if (!every) continue;
        const slot = Math.floor((t + k) / every), last = s._slot;
        if (last !== slot) { s._slot = slot; noise.push({ x: p.x + (hash(slot + k) - 0.5) * 6, y: p.y + (hash(slot * 1.3 + k) - 0.5) * 6, t0: t, str }); }
      }
      while (noise.length > 220) noise.shift();
    }
    function drawNoise(t, vision) {
      const s = scale();
      for (let i = noise.length - 1; i >= 0; i--) {
        const n = noise[i], age = t - n.t0, life = 0.9 + 1.3 * n.str;
        if (age > life) { noise.splice(i, 1); continue; }
        const k = age / life;
        const r = (6 + 46 * n.str) * s * ease(k) + 4 * s;
        const a = (1 - k) * (0.25 + 0.6 * n.str) * (vision ? 1.4 : 1);
        ctx.strokeStyle = vision ? `rgba(255,214,120,${clamp(a, 0, 1)})` : `rgba(255,255,255,${a})`;
        ctx.lineWidth = (1 + 2.2 * n.str * (1 - k)) * s;
        ctx.beginPath(); ctx.ellipse(n.x, n.y, r, r * 0.6, 0, 0, 6.283); ctx.stroke();
      }
    }

    // ---------- swimmers ----------
    function look(s) {
      return { skin: SKIN[Math.floor(hash(s.id + 1) * SKIN.length)], hair: HAIR[Math.floor(hash(s.id + 2) * HAIR.length)], cap: CAP[Math.floor(hash(s.id + 3) * CAP.length)], capOn: hash(s.id + 4) > 0.55 };
    }

    function head(x, y, r, L, face, tilt) {
      ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = L.capOn ? L.cap : L.hair;
      ctx.beginPath(); ctx.arc(x, y - r * 0.15 + (tilt || 0) * r * 0.4, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
      // face
      ctx.fillStyle = '#222';
      const ey = y + r * 0.05 - (tilt || 0) * r * 0.35;
      if (face === 'shut') {
        ctx.strokeStyle = '#222'; ctx.lineWidth = Math.max(1, r * 0.14);
        ctx.beginPath(); ctx.moveTo(x - r * 0.45, ey); ctx.lineTo(x - r * 0.2, ey); ctx.moveTo(x + r * 0.2, ey); ctx.lineTo(x + r * 0.45, ey); ctx.stroke();
      } else if (face === 'up') {
        ctx.beginPath(); ctx.arc(x - r * 0.32, ey - r * 0.1, r * 0.12, 0, 6.283); ctx.arc(x + r * 0.32, ey - r * 0.1, r * 0.12, 0, 6.283); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(x - r * 0.32, ey, r * 0.12, 0, 6.283); ctx.arc(x + r * 0.32, ey, r * 0.12, 0, 6.283); ctx.fill();
      }
      ctx.strokeStyle = '#222'; ctx.lineWidth = Math.max(1, r * 0.12);
      if (face === 'scream') { ctx.fillStyle = '#5a1a1a'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.48, r * 0.22, r * 0.26, 0, 0, 6.283); ctx.fill(); }
      else if (face === 'happy') { ctx.beginPath(); ctx.arc(x, y + r * 0.3, r * 0.3, 0.2, Math.PI - 0.2); ctx.stroke(); }
      else if (face === 'up') { ctx.beginPath(); ctx.ellipse(x, y + r * 0.42, r * 0.14, r * 0.09, 0, 0, 6.283); ctx.stroke(); }
    }

    function swimmer(s, t, state) {
      const L = look(s), sc = scale();
      const r = 9.5 * sc;
      let p = px(s);
      if (s.state === 'towed') {
        const ring = state.rings.find(q => q.who === s.id);
        if (ring) {
          const tw = towerPx(), k = ease((state.t - ring.t0) / (ring.t1 - ring.t0));
          const a = px({ x: s.tx, y: s.ty });
          p = { x: lerp(a.x, tw.x, k), y: lerp(a.y, Math.min(tw.y, waterH + 6), k) };
          ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2 * sc;
          ctx.beginPath(); ctx.moveTo(tw.x, tw.y - 10 * sc); ctx.quadraticCurveTo((tw.x + p.x) / 2, (tw.y + p.y) / 2 + 12 * sc, p.x, p.y); ctx.stroke();
          ringShape(p.x, p.y + r * 0.6, r * 1.15);
          head(p.x, p.y, r, L, 'happy');
        }
        return;
      }
      if (s.state === 'away' || s.state === 'saved' || s.state === 'gone') return;
      const bob = Math.sin(t * 2.2 + s.id) * 1.2 * sc;
      const fade = s.enter > 0 ? clamp((state.t - s.enter) / 0.8, 0, 1) : 1;
      ctx.globalAlpha = fade;
      if (s.state === 'lost') {
        const age = state.t - s.since;
        if (age > 2.5) return;
        for (let k = 0; k < 5; k++) {
          const yy = p.y - ((age * 18 + k * 7) % 22) * sc;
          ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - age / 2.5)})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(p.x + Math.sin(k * 2 + age * 3) * 4 * sc, yy, (1.5 + k % 3) * sc, 0, 6.283); ctx.stroke();
        }
        return;
      }
      // shadow of the body under water
      ctx.fillStyle = 'rgba(10,50,70,0.25)';
      if (s.kind === 'floater') {
        // on an inflatable ring
        ctx.strokeStyle = L.cap; ctx.lineWidth = 5 * sc; ctx.beginPath(); ctx.arc(p.x, p.y + bob, r * 1.7, 0, 6.283); ctx.stroke();
        ctx.fillStyle = L.skin; ctx.beginPath(); ctx.ellipse(p.x + r * 1.1, p.y + bob, r * 1.3, r * 0.5, 0.2, 0, 6.283); ctx.fill();
        head(p.x - r * 0.6, p.y + bob, r, L, 'shut');
        ctx.fillStyle = '#111'; ctx.fillRect(p.x - r * 1.05, p.y + bob - r * 0.1, r * 0.9, r * 0.28);
      } else if (s.state === 'swim' && s.kind === 'swimmer') {
        const dir = Math.cos(t * 0.37 + s.id * 7.13) > 0 ? 1 : -1;
        ctx.beginPath(); ctx.ellipse(p.x - dir * r * 1.4, p.y + 2 * sc, r * 1.9, r * 0.6, 0, 0, 6.283); ctx.fill();
        const st = Math.sin(t * 4 + s.id);
        ctx.strokeStyle = L.skin; ctx.lineWidth = 2.6 * sc; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * r * (1 + 0.6 * st), p.y - r * 0.9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dir * r * (1 - 0.6 * st), p.y + r * 0.9); ctx.stroke();
        head(p.x, p.y + bob * 0.3, r, L, 'happy');
      } else if (s.state === 'swim') {
        // treading water: upright and calm
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1 * sc;
        ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 0.7, r * 1.5, r * 0.5, 0, 0, 6.283); ctx.stroke();
        head(p.x, p.y + bob, r, L, 'calm');
      } else if (s.state === 'struggle') {
        const w = Math.sin(t * 11 + s.id * 3);
        ctx.strokeStyle = L.skin; ctx.lineWidth = 2.8 * sc; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x - r * 0.6, p.y); ctx.lineTo(p.x - r * (1.4 + 0.4 * w), p.y - r * (1.9 + 0.5 * w)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x + r * 0.6, p.y); ctx.lineTo(p.x + r * (1.4 - 0.4 * w), p.y - r * (1.9 - 0.5 * w)); ctx.stroke();
        // splashes
        for (let k = 0; k < 6; k++) {
          const a = t * 6 + k * 1.1 + s.id, d = r * (1.3 + 0.8 * Math.abs(Math.sin(a * 1.7)));
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * 0.6, 1.6 * sc, 0, 6.283); ctx.fill();
        }
        head(p.x, p.y + Math.sin(t * 9 + s.id) * 2 * sc, r, L, 'scream');
        bubble(p.x, p.y - r * 3.1, 'HELP!', '#e63946', sc);
      } else if (s.state === 'drown') {
        // The instinctive drowning response: upright, head back, mouth at the waterline, arms pressing down, no
        // sound. For most of it they look like someone calmly treading water. Only near the end do they go under.
        const k = s.sink, late = clamp((k - 0.74) / 0.26, 0, 1);
        const dip = Math.sin(t * 1.6 + s.id) * 0.5 + 0.5;          // bobbing: mouth under, mouth up
        head(p.x, p.y + late * r * 0.5 + dip * r * 0.12, r * (1 - 0.18 * late), L, late > 0.2 ? 'up' : 'calm', 0.35 + 0.65 * late);
        if (late > 0) {
          ctx.fillStyle = `rgba(40,140,175,${0.25 + 0.65 * late})`;
          ctx.beginPath(); ctx.rect(p.x - r * 1.3, p.y + r * (0.6 - 1.5 * late), r * 2.6, r * 2); ctx.fill();
          for (let q = 0; q < 3; q++) {
            const a = (t * 1.3 + q * 0.33) % 1;
            ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - a) * late})`; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(p.x + (q - 1) * r * 0.5, p.y - a * r * 1.4, (1.2 + q * 0.4) * sc, 0, 6.283); ctx.stroke();
          }
        }
        // no ripple ring: they aren't kicking
      }
      // flagged by the whistle: nobody answered from here
      if (s.flagged !== false && s.flagged != null && s.state === 'drown') {
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.strokeStyle = `rgba(255,70,80,${0.55 + 0.45 * pulse})`; ctx.lineWidth = 2 * sc; ctx.setLineDash([4 * sc, 3 * sc]);
        reachPath(p.x, p.y, SW.RULES.reachDrown); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#ff4650'; ctx.font = `bold ${Math.round(13 * sc)}px -apple-system, sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('!', p.x + SW.RULES.reachDrown * W + 4 * sc, p.y - SW.RULES.reachDrown * waterH); ctx.textAlign = 'start';
      }
      // whistle reply
      if (s.reply && state.t - s.reply.t < 1.6) {
        const a = 1 - (state.t - s.reply.t) / 1.6;
        ctx.globalAlpha = Math.min(1, a * 2);
        if (s.reply.kind === 'wave') bubble(p.x, p.y - r * 2.8, 'OK!', '#2a7d4f', sc);
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = 1;
    }

    function fitText(text, x, y, maxW) {
      let size = parseFloat(ctx.font.match(/(\d+(?:\.\d+)?)px/)[1]);
      while (ctx.measureText(text).width > maxW && size > 8) { size -= 0.5; ctx.font = ctx.font.replace(/\d+(?:\.\d+)?px/, size + 'px'); }
      ctx.fillText(text, x, y);
    }
    function bubble(x, y, text, col, sc, dark) {
      ctx.font = `bold ${Math.round(11 * sc)}px -apple-system, Segoe UI, sans-serif`;
      const w = ctx.measureText(text).width + 10 * sc, h = 17 * sc;
      x = clamp(x, w / 2 + 2, W - w / 2 - 2);
      ctx.fillStyle = dark ? 'rgba(4,30,44,0.88)' : 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - h / 2, w, h, 6 * sc) : ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 4 * sc, y + h / 2); ctx.lineTo(x, y + h / 2 + 5 * sc); ctx.lineTo(x + 4 * sc, y + h / 2); ctx.fill();
      ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 0.5); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }

    // ---------- rings in the air ----------
    function rings(state) {
      const tw = towerPx(), sc = scale();
      for (const r of state.rings) {
        if (r.mode === 'flying') {
          const k = clamp((state.t - r.t0) / (r.t1 - r.t0), 0, 1);
          const tgt = px(r);
          const x = lerp(tw.x, tgt.x, k), y = lerp(tw.y - 10 * sc, tgt.y, k);
          const h = Math.sin(k * Math.PI) * 40 * sc;
          ctx.fillStyle = 'rgba(0,40,60,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, 8 * sc, 4 * sc, 0, 0, 6.283); ctx.fill();
          ringShape(x, y - h, (7 + 3 * Math.sin(k * Math.PI)) * sc);
          // target marker
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
          reachPath(tgt.x, tgt.y, SW.RULES.reachStruggle); ctx.stroke(); ctx.setLineDash([]);
        } else if (r.mode === 'retrieving') {
          const k = clamp((state.t - r.t0) / (r.t1 - r.t0), 0, 1);
          const a = px(r), x = lerp(a.x, tw.x, ease(k)), y = lerp(a.y, Math.min(tw.y, waterH + 4), ease(k));
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(tw.x, tw.y - 10 * sc); ctx.lineTo(x, y); ctx.stroke();
          ringShape(x, y, 7 * sc);
        }
      }
    }

    // ---------- the Captain ----------
    function captain(state, level, t) {
      if (!level || !(level.captain || level.canCall)) return;
      const C = state.captain, sc = scale(), tw = towerPx();
      const stop = { x: tw.x + 52 * sc, y: tw.y + 8 * sc }, edge = { x: W + 40, y: tw.y + 8 * sc };
      let pos = null;
      if (C.mode === 'driving') pos = { x: lerp(edge.x, stop.x, ease((state.t - C.t0) / SW.RULES.captainDrive)), y: stop.y };
      else if (C.mode === 'looking') pos = stop;
      else if (C.mode === 'leaving') pos = { x: lerp(stop.x, edge.x, ease((state.t - C.t0) / 1.2)), y: stop.y };
      else if (C.warnFor != null) {
        const left = C.warnFor - state.t;
        pos = { x: lerp(edge.x, stop.x, ease(1 - left / SW.RULES.captainWarn)), y: stop.y };
      }
      if (!pos) return;
      // jeep
      ctx.save(); ctx.translate(pos.x, pos.y);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(2, 9 * sc, 22 * sc, 6 * sc, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(-20 * sc, -9 * sc, 40 * sc, 16 * sc);
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-16 * sc, 6 * sc, 9 * sc, 4 * sc); ctx.fillRect(7 * sc, 6 * sc, 9 * sc, 4 * sc);
      ctx.fillStyle = '#7fd4ff'; ctx.fillRect(-14 * sc, -7 * sc, 10 * sc, 7 * sc);
      // the Captain: hat and clipboard
      ctx.fillStyle = '#f1c7a3'; ctx.beginPath(); ctx.arc(4 * sc, -12 * sc, 5 * sc, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#1d3557'; ctx.fillRect(-1 * sc, -19 * sc, 10 * sc, 4 * sc); ctx.fillRect(-3 * sc, -16 * sc, 14 * sc, 2 * sc);
      ctx.fillStyle = '#fff'; ctx.fillRect(9 * sc, -11 * sc, 6 * sc, 8 * sc);
      ctx.restore();
      if (C.mode === 'looking') {
        // his gaze sweeps the water; he only notices noise
        const k = (state.t - C.t0) / SW.RULES.captainLook;
        const ang = -Math.PI / 2 + Math.sin(k * Math.PI * 2) * 0.9;
        const g = ctx.createRadialGradient(pos.x, pos.y - 10, 10, pos.x, pos.y - 10, H);
        g.addColorStop(0, 'rgba(255,220,120,0.28)'); g.addColorStop(1, 'rgba(255,220,120,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y - 10); ctx.arc(pos.x, pos.y - 10, H * 1.2, ang - 0.35, ang + 0.35); ctx.closePath(); ctx.fill();
        bubble(pos.x - 10 * sc, pos.y - 34 * sc, 'Inspection!', '#1d3557', sc);
      } else if (C.mode === 'leaving' && C.verdict && state.t - C.verdict.t < 1.6) {
        bubble(pos.x - 10 * sc, pos.y - 34 * sc, C.verdict.ok ? '★ Safe beach!' : '✗ Unsafe!', C.verdict.ok ? '#2a7d4f' : '#e63946', sc);
      } else if (C.mode === 'driving') {
        bubble(pos.x - 10 * sc, pos.y - 34 * sc, 'On my way!', '#1d3557', sc);
      } else if (C.warnFor != null) {
        const left = Math.ceil(C.warnFor - state.t);
        bubble(pos.x - 10 * sc, pos.y - 34 * sc, `Inspection in ${left}`, '#1d3557', sc);
      }
    }

    // ---------- effects ----------
    function effects(v, t) {
      const vision = v.state && v.state.captain.mode === 'looking';
      for (const e of v.effects) {
        const k = (t - e.t0) / e.dur;
        if (k < 0 || k > 1) continue;
        if (e.type === 'splash') {
          for (let j = 0; j < 9; j++) {
            const a = j / 9 * 6.283, d = 18 * scale() * ease(k);
            ctx.fillStyle = `rgba(255,255,255,${1 - k})`;
            ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d * 0.6 - Math.sin(k * Math.PI) * 8, 2 * scale(), 0, 6.283); ctx.fill();
          }
        } else if (e.type === 'text') {
          ctx.globalAlpha = Math.sin(k * Math.PI);
          ctx.font = `bold ${Math.round((e.size || 14) * scale())}px -apple-system, Segoe UI, sans-serif`;
          ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.strokeText(e.text, e.x, e.y - 20 * k); ctx.fillStyle = e.col || '#fff'; ctx.fillText(e.text, e.x, e.y - 20 * k);
          ctx.textAlign = 'start'; ctx.globalAlpha = 1;
        } else if (e.type === 'whistle') {
          const tw = towerPx(), r = SW.RULES.whistleSpeed * (t - e.t0) * Math.max(W, waterH);
          ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.lineWidth = 3 * scale();
          ctx.beginPath(); ctx.ellipse(tw.x, tw.y, r, r * (waterH / W), 0, Math.PI, 2 * Math.PI); ctx.stroke();
        } else if (e.type === 'tag') {
          const s = v.state && v.state.swimmers[e.who];
          if (!s || s.state === 'saved' || s.state === 'gone' || vision) continue;
          let p = px(s);
          if (s.state === 'towed') continue;
          ctx.globalAlpha = Math.min(1, (1 - k) * 3);
          bubble(p.x, p.y - 30 * scale(), e.text, e.col, scale(), true);
          ctx.globalAlpha = 1;
        } else if (e.type === 'banner') {
          const a = Math.min(1, k * 8, (1 - k) * 4), sc = scale();
          ctx.globalAlpha = a;
          const y = waterH * (e.low ? 0.8 : 0.2);
          ctx.fillStyle = 'rgba(4,30,44,0.82)';
          const bw = Math.min(W - 24, 360 * sc), bh = (e.sub ? 58 : 38) * sc;
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W / 2 - bw / 2, y - bh / 2, bw, bh, 12 * sc) : ctx.rect(W / 2 - bw / 2, y - bh / 2, bw, bh); ctx.fill();
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = e.col || '#fff'; ctx.font = `900 ${Math.round(20 * sc)}px -apple-system, Segoe UI, sans-serif`;
          ctx.fillText(e.text, W / 2, y - (e.sub ? 10 * sc : 0));
          if (e.sub) { ctx.fillStyle = '#eef8fb'; ctx.font = `${Math.round(12.5 * sc)}px -apple-system, Segoe UI, sans-serif`; fitText(e.sub, W / 2, y + 14 * sc, bw - 16); }
          ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
        } else if (e.type === 'stamp') {
          const sc = scale(), z = k < 0.12 ? 2.2 - 1.2 * (k / 0.12) : 1;
          ctx.save(); ctx.globalAlpha = Math.min(1, (1 - k) * 3); ctx.translate(W / 2, waterH * 0.5); ctx.rotate(-0.18); ctx.scale(z, z);
          ctx.strokeStyle = '#2fbf71'; ctx.fillStyle = '#2fbf71'; ctx.lineWidth = 4 * sc;
          const bw = 170 * sc, bh = 54 * sc;
          ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
          ctx.font = `900 ${Math.round(26 * sc)}px -apple-system, Segoe UI, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('SAFE ✓', 0, -4 * sc);
          ctx.font = `700 ${Math.round(9 * sc)}px -apple-system, Segoe UI, sans-serif`; ctx.fillText('CERTIFIED BY THE CAPTAIN', 0, 16 * sc);
          ctx.restore();
        } else if (e.type === 'confetti') {
          const x = e.x + e.vx * k, y = e.y + e.vy * k + 80 * k * k;
          ctx.fillStyle = e.col; ctx.globalAlpha = 1 - k; ctx.fillRect(x, y, 3 * scale(), 3 * scale()); ctx.globalAlpha = 1;
        }
      }
    }

    function draw(v, t) {
      const st = v.state, vision = st && st.captain.mode === 'looking';
      sea(t, vision);
      if (st) emitNoise(st, t);
      drawNoise(t, vision);
      if (st && !vision) {
        // drowning swimmers first so the loud ones draw on top
        const order = st.swimmers.slice().sort((a, b) => (a.state === 'drown') - (b.state === 'drown'));
        for (const s of order.reverse()) swimmer(s, t, st);
      }
      if (st && vision) {
        // Captain vision: he sees only noise. Swimmers who are making none are not there for him.
        ctx.fillStyle = 'rgba(255,214,120,0.85)'; ctx.font = `bold ${Math.round(12 * scale())}px -apple-system, sans-serif`;
        ctx.textAlign = 'center'; ctx.fillText('WHAT THE CAPTAIN SEES', W / 2, 18 * scale());
        ctx.fillStyle = 'rgba(255,214,120,0.6)'; ctx.font = `${Math.round(11 * scale())}px -apple-system, sans-serif`;
        ctx.fillText('he only notices noise', W / 2, 33 * scale()); ctx.textAlign = 'start';
        for (const s of st.swimmers) if (s.state === 'struggle') { const p = px(s); ctx.fillStyle = 'rgba(255,90,90,0.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, 5 * scale(), 0, 6.283); ctx.fill(); }
      }
      sand(t);
      tower(t, st, vision);
      if (st) { rings(st); captain(st, v.level, t); }
      effects(v, t);
      if (v.aim && !vision) {
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5;
        reachPath(v.aim.x, v.aim.y, SW.RULES.reachStruggle); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(v.aim.x - 5, v.aim.y); ctx.lineTo(v.aim.x + 5, v.aim.y); ctx.moveTo(v.aim.x, v.aim.y - 5); ctx.lineTo(v.aim.x, v.aim.y + 5); ctx.stroke();
      }
    }

    function toWater(x, y) { return { x: x / W, y: y / waterH, inWater: y < waterH }; }
    function toPx(p) { return px(p); }
    function reset() { noise.length = 0; }
    return { reset, resize, draw, toWater, toPx, towerPx, get W() { return W; }, get H() { return H; }, get waterH() { return waterH; } };
  }

  root.SWRender = { createRenderer };
})(typeof window !== 'undefined' ? window : globalThis);
