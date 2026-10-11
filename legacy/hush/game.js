// HUSH: game flow, input and animation state. Rules live in logic.js, drawing in render.js.
(function () {
  'use strict';
  const H = window.Hush, R = window.HushRender, A = window.HushAudio, SOLVER = window.HushSolver;
  const { LEVELS, THREADS, BLURBS, makeNight: generateNight } = window.HUSH_LEVELS;
  const $ = id => document.getElementById(id);

  const canvas = $('c');
  const rend = R.createRenderer(canvas);
  const ui = {
    hint: $('hint'), water: $('water'), certs: $('certs'), title: $('title'),
    intro: $('intro'), menu: $('menu'), result: $('result'),
    rTitle: $('rTitle'), rStars: $('rStars'), rText: $('rText'), rButtons: $('rButtons'), share: $('share'),
  };

  // ---------- persistence (storage can throw in a sandboxed iframe) ----------
  const progress = Shell.store.get('hush.progress', {});      // id -> best stars
  let best = Shell.store.get('hush.night', 0);
  A.setMuted(Shell.store.get('hush.muted', false));
  function saveProgress() { Shell.store.set('hush.progress', progress); }

  // ---------- view state ----------
  let view = null;              // everything the renderer needs for the current level
  let mode = 'intro';           // intro | play | result | menu
  let endless = null;           // { night, certs, seed } in endless mode
  let paused = false, visible = true;
  const now = () => performance.now() / 1000;

  const SPAN = 14;
  function pastTrail(f, n) {
    // The garden was going before you arrived: replay each flower's thirst backwards with no water.
    const out = [];
    for (let k = n; k >= 1; k--) {
      const steps = Math.floor(k / f.rate);
      const t = Math.max(0, f.t - steps);
      out.push({ b: H.bloomFrac(f.kind, t) });
    }
    return out;
  }

  function startLevel(level, opts = {}) {
    clearTimeout(resultTimer);
    const state = H.init(level);
    if (level.alternatives) {
      // A fogged past: the garden secretly picks which bud is dying, so the test, not memory, decides.
      const alt = level.alternatives[Math.floor(Math.random() * level.alternatives.length)];
      for (const [i, t] of Object.entries(alt)) state.flowers[+i].t = t;
    }
    const flowers = state.flowers.map((f, i) => {
      const hidden = (level.hidden || []).includes(i);
      const hist = pastTrail(f, SPAN).map(s => hidden ? Object.assign(s, { fog: true }) : s);
      hist.push({ b: H.bloomFrac(f.kind, f.t) });
      return { kind: f.kind, hist, shown: H.bloomFrac(f.kind, f.t), cloche: 0, deadT: null, fogUntil: hidden ? SPAN - 1 : null, pulse: false };
    });
    view = {
      level, state, flowers, breathT: 0, running: false, effects: [], dawn: 0,
      owl: { mode: 'idle', target: -1, gaze: null, selected: false, returnT: null, inspectT: null, flyT0: 0, flyT1: 1, drag: null },
      breathMs: opts.breathMs || (level.owl ? 920 : 840), endAt: null, outcome: null,
      labels: (level.labels || []).map(l => Object.assign({ t0: now() + 0.3, gone: null }, l)), streak: 0,
    };
    const up = H.upcoming(level, state, 3);
    view.owl.gaze = level.owl && up.visits.length ? up.visits[0].f : null;
    view.flowers.forEach((f, i) => { f.gustSoon = up.gusts.some(g => g.f === i && g.at === 0); });
    if (level.id === 't1') view.flowers.forEach((f, i) => { f.pulse = H.bloomOf('fold', level.flowers[i].t) >= 4; });
    mode = 'play';
    hideOverlays();
    $('restartBtn').style.visibility = 'visible';
    ui.hint.textContent = level.hint || '';
    const th = endless ? `Night ${endless.night}` : `${THREADS[level.thread]} · ${level.name}`;
    ui.title.innerHTML = `<b>HUSH</b> · ${th}`;
    refreshMeters();
  }

  function refreshMeters() {
    if (!view || mode === 'intro' || (mode === 'menu' && view.level.id === 'attract')) { ui.water.innerHTML = ''; ui.certs.textContent = ''; return; }
    const s = view.state, W = view.level.water;
    let html = '';
    for (let k = 0; k < W.max; k++) {
      let fill = 0;
      if (k < s.water) fill = 1;
      else if (k === s.water && W.regen) fill = ((s.breath % W.regen) + view.breathT) / W.regen;
      html += `<span class="drop"><i style="height:${Math.round(fill * 100)}%"></i></span>`;
    }
    ui.water.innerHTML = html;
    ui.certs.innerHTML = view.level.owl ? `<svg width="13" height="13" viewBox="0 0 13 13" style="vertical-align:-1px"><path d="M2 12V6.5a4.5 4.5 0 0 1 9 0V12z" fill="none" stroke="#ffd27a" stroke-width="1.3"/><circle cx="6.5" cy="1.4" r="1" fill="#ffd27a"/></svg> ${s.passes}` : '';
    ui.certs.title = 'Certificates: flowers the Owl passed';
  }

  // ---------- actions ----------
  function ensureRunning() {
    if (!view.running) { view.running = true; view.breathT = 0; }
    // callouts fade a few breaths after play begins
    const t = now(); view.labels.forEach(l => { if (!l.gone) l.gone = t + 2.5; });
  }

  function doWater(i) {
    const s = view.state;
    if (!H.canWater(s, i)) {
      if (s.water < 1) flash('No water yet.');
      return;
    }
    ensureRunning();
    const f = view.flowers[i], lf = s.flowers[i];
    const before = H.bloomFrac(lf.kind, lf.t);
    H.water(s, i);
    const after = H.bloomFrac(lf.kind, lf.t);
    const cur = f.hist[f.hist.length - 1];
    cur.b = after; cur.water = true;
    f.pulse = false;
    const p = rend.headPos(i), t = now();
    view.effects.push({ type: 'drop', x: p.x, y0: p.y - 120, y1: p.y, t0: t, dur: 0.22 });
    view.effects.push({ type: 'ring', x: p.x, y: p.y, r0: 6, r1: 40, col: [143, 216, 255], t0: t + 0.2, dur: 0.6 });
    if (after > before + 0.01) {
      // A wilting flower opens when helped: the dilution test, made audible.
      A.revive();
      for (let k = 0; k < 14; k++) view.effects.push({ type: 'spark', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 60, r: 2.2, col: [255, 140, 120], t0: t + 0.2, dur: 0.9 });
      view.effects.push({ type: 'text', text: 'it was wilting', x: p.x, y: p.y - 46, col: [255, 180, 160], t0: t + 0.25, dur: 1.6, size: 13 });
    } else {
      A.water();
    }
    refreshMeters();
  }

  function doSummon(i) {
    const s = view.state;
    view.owl.selected = false;
    if (!H.canSummon(view.level, s, i)) return;
    ensureRunning();
    H.summon(s, i);
    const t = now();
    view.owl.flyT0 = t; view.owl.flyT1 = t + (1 - view.breathT) * view.breathMs / 1000;
    view.owl.target = i; view.owl.mode = 'flying';
    A.hoot();
  }

  let flashTimer = null;
  function flash(msg) {
    const keep = view && view.level.hint;
    ui.hint.textContent = msg;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { if (mode === 'play') ui.hint.textContent = keep || ''; }, 1400);
  }

  // ---------- the breath ----------
  function breathe() {
    const lv = view.level, prevOwl = view.state.owl.mode;
    view.state = H.tick(lv, view.state);
    const s = view.state, t = now();
    // new history sample per flower
    s.flowers.forEach((lf, i) => {
      const f = view.flowers[i];
      f.hist.push({ b: lf.alive ? H.bloomFrac(lf.kind, lf.t) : 0, glass: lf.cloche > 0 });
      if (f.hist.length > SPAN + 4) { f.hist.shift(); if (f.fogUntil != null) f.fogUntil--; }
      f.cloche = lf.cloche;
    });
    for (const e of s.events) {
      const f = view.flowers[e.f], p = rend.headPos(e.f), cur = f && f.hist[f.hist.length - 1];
      if (e.type === 'gust') {
        cur.gust = true; cur.jog = 0; f.joltT = t; f.jolt = 0.35; A.gust();
        view.effects.push({ type: 'wind', x: p.x, y: p.y, t0: t - 0.1, dur: 0.7 });
        view.effects.push({ type: 'text', text: 'gust', x: p.x, y: p.y - 56, col: [220, 228, 255], t0: t, dur: 1.1, size: 13 });
      } else if (e.type === 'gust-blocked') {
        view.effects.push({ type: 'wind', x: p.x, y: p.y, t0: t - 0.1, dur: 0.7 });
        view.effects.push({ type: 'text', text: 'sheltered', x: p.x, y: p.y - 50, col: [220, 230, 255], t0: t, dur: 1.2, size: 12 });
      } else if (e.type === 'patrol') {
        view.owl.mode = 'flying'; view.owl.target = e.f; view.owl.flyT0 = t; view.owl.flyT1 = t + view.breathMs / 1000; A.hoot();
      } else if (e.type === 'pass') {
        cur.pass = true; A.pass(); view.owl.inspectT = t;
        view.effects.push({ type: 'ring', x: p.x, y: p.y - 10, r0: 10, r1: 60, col: [255, 210, 122], t0: t, dur: 0.8 });
        view.effects.push({ type: 'text', text: 'certified', x: p.x, y: p.y - 70, col: [255, 210, 122], t0: t, dur: 1.4, size: 13 });
      } else if (e.type === 'caught') {
        cur.caught = true; A.caught(); view.owl.inspectT = t;
        view.effects.push({ type: 'text', text: 'neglected!', x: p.x, y: p.y - 70, col: [255, 120, 100], t0: t, dur: 1.6, size: 15 });
      } else if (e.type === 'death' || e.type === 'scandal') {
        f.deadT = t;
        if (e.type === 'scandal') f.underGlass = true;
        for (let k = 0; k < 10; k++) view.effects.push({ type: 'petal', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 50, vy: 10 + Math.random() * 20, p: Math.random() * 6, col: [200, 160, 170], t0: t + k * 0.03, dur: 1.5 });
        if (e.type === 'scandal') {
          A.scandal();
          view.effects.push({ type: 'crack', x: p.x, y: p.y - 18, r: 46, t0: t, dur: 1.2 });
          view.effects.push({ type: 'text', text: 'died under glass', x: p.x, y: p.y - 80, col: [255, 120, 100], t0: t + 0.1, dur: 2.2, size: 15 });
        } else A.death();
      }
    }
    if (prevOwl === 'flying' && s.owl.mode === 'resting') view.owl.returnT = t;
    view.owl.mode = s.owl.mode === 'flying' ? 'flying' : s.owl.mode;
    if (s.owl.mode !== 'flying') view.owl.target = s.owl.target >= 0 ? s.owl.target : view.owl.target;
    if (lv.owl) A.breath(0);
    // what is coming
    const up = H.upcoming(lv, s, 3);
    view.owl.gaze = s.owl.mode === 'idle' && up.visits.length ? up.visits[0].f : null;
    view.flowers.forEach((f, i) => { f.gustSoon = up.gusts.some(g => g.f === i && g.at === s.breath); });
    if (H.finished(lv, s)) finishLevel();
    refreshMeters();
  }

  function finishLevel() {
    const lv = view.level, s = view.state, won = H.won(lv, s);
    view.running = false;
    view.outcome = won ? 'won' : 'lost';
    view.endAt = now();
    if (won) {
      A.dawn();
      const tt = now();
      for (let k = 0; k < 26; k++) view.effects.push({ type: 'spark', x: rend.W * Math.random(), y: rend.H * (0.5 + 0.3 * Math.random()), vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 60, r: 1.8, col: [255, 226, 160], t0: tt + Math.random() * 0.8, dur: 1.6 });
    }
    const finished = view;
    clearTimeout(resultTimer);
    resultTimer = setTimeout(() => { if (view === finished) showResult(); }, won ? 1400 : 1500);
  }
  let resultTimer = null;

  // ---------- results, menus ----------
  function hideOverlays() { ['intro', 'menu', 'result'].forEach(k => ui[k].classList.remove('on')); fitStage(); }
  // An overlay taller than the garden stretches the stage instead of spilling over the buttons.
  function fitStage() {
    const st = $('stage');
    st.style.minHeight = '';
    const open = ['intro', 'menu', 'result'].map(k => ui[k]).find(o => o.classList.contains('on'));
    if (open) {
      open.style.bottom = 'auto'; const need = open.scrollHeight; open.style.bottom = '';
      if (need > canvas.clientHeight) st.style.minHeight = need + 'px';
    }
    Shell.reportHeight();
  }
  function button(label, fn, primary) {
    const b = document.createElement('button'); b.textContent = label; if (primary) b.className = 'primary';
    b.addEventListener('click', e => { e.stopPropagation(); A.unlock(); fn(); }); return b;
  }

  function nextLevelIndex(lv) { const i = LEVELS.indexOf(lv); return i >= 0 && i + 1 < LEVELS.length ? i + 1 : -1; }

  function showResult() {
    const lv = view.level, s = view.state, won = view.outcome === 'won';
    mode = 'result';
    ui.rButtons.innerHTML = ''; ui.share.style.display = 'none';
    if (endless) return showNightResult(won);
    const st = H.stars(lv, s);
    if (won) {
      progress[lv.id] = Math.max(progress[lv.id] || 0, st); saveProgress();
      ui.rTitle.textContent = 'Dawn';
      ui.rStars.innerHTML = [1, 2, 3].map(k => `<span class="${k <= st ? '' : 'off'}">✦</span>`).join('');
      const thread = lv.thread;
      const ni = nextLevelIndex(lv);
      const nextTxt = ni >= 0 && LEVELS[ni].thread !== thread ? `Next: ${THREADS[LEVELS[ni].thread]}` : 'Next night';
      ui.rText.textContent = lv.owl ? (st < 3 ? `Certificates: ${s.passes}. More glass, more stars.` : 'Every flower alive, and the Owl impressed.') : (st < 2 ? 'Every flower alive. Save some water for more stars.' : 'Every flower alive.');
      if (ni >= 0) ui.rButtons.appendChild(button(nextTxt, () => startLevel(LEVELS[ni]), true));
      else ui.rButtons.appendChild(button('Endless night', startEndless, true));
      ui.rButtons.appendChild(button('Again', () => startLevel(lv)));
      ui.rButtons.appendChild(button('Levels', showMenu));
    } else {
      const scandal = s.flowers.some((f, i) => !f.alive && view.flowers[i].hist.length && view.flowers[i].hist[view.flowers[i].hist.length - 2] && view.flowers[i].hist[view.flowers[i].hist.length - 2].glass);
      ui.rTitle.textContent = s.caught ? 'The Owl saw' : scandal ? 'Certified' : 'Wilted';
      ui.rStars.innerHTML = '';
      ui.rText.textContent = s.caught && !s.lost ? 'The Owl found a flower in distress. Keep it looking elsewhere.' : (lv.lose || 'A flower wilted.');
      ui.rButtons.appendChild(button('Try again', () => startLevel(lv), true));
      ui.rButtons.appendChild(button('Levels', showMenu));
    }
    ui.result.classList.add('on'); fitStage();
  }

  function showMenu() {
    mode = 'menu';
    const m = ui.menu; m.innerHTML = '';
    THREADS.forEach((name, ti) => {
      const box = document.createElement('div'); box.className = 'thread';
      const h3 = document.createElement('h3'); h3.textContent = `${ti + 1} · ${name}`; box.appendChild(h3);
      const blurb = document.createElement('p'); blurb.textContent = BLURBS[ti]; box.appendChild(blurb);
      LEVELS.filter(l => l.thread === ti).forEach(l => {
        const b = button('', () => startLevel(l), false);
        b.className = 'lv';
        const stars = progress[l.id] ? '✦'.repeat(progress[l.id]) : '';
        b.innerHTML = `${l.name}<span class="s">${stars}</span>`;
        box.appendChild(b);
      });
      m.appendChild(box);
    });
    const row = document.createElement('div'); row.className = 'row'; row.style.marginTop = '8px';
    row.appendChild(button(`Endless night${best ? ` (best ${best})` : ''}`, startEndless, true));
    row.appendChild(button('Close', () => { if (view && view.outcome == null) { mode = 'play'; hideOverlays(); } else hideOverlays(); }));
    m.appendChild(row);
    hideOverlays(); m.classList.add('on'); fitStage(); refreshMeters();
  }

  // ---------- endless night ----------
  const makeNight = (night, seed) => generateNight(night, seed, lv => SOLVER.solveFeasible(lv, 40000) === 'solved');
  function daySeed() { const d = new Date(); return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); }
  function startEndless() {
    endless = { night: 1, certs: 0, seed: daySeed(), lost: [] };
    startNight();
  }
  function startNight() {
    const lv = makeNight(endless.night, endless.seed);
    startLevel(lv, { breathMs: Math.max(640, 900 - endless.night * 30) });
  }
  function showNightResult(won) {
    const s = view.state;
    if (won) {
      endless.certs += s.passes;
      ui.rTitle.textContent = `Dawn ${endless.night}`;
      ui.rStars.innerHTML = '';
      ui.rText.textContent = `${endless.night} night${endless.night > 1 ? 's' : ''} survived · ${endless.certs} certificate${endless.certs === 1 ? '' : 's'}`;
      ui.rButtons.appendChild(button('Next night', () => { endless.night++; startNight(); }, true));
      ui.rButtons.appendChild(button('Levels', () => { endless = null; showMenu(); }));
    } else {
      const nights = endless.night - 1;
      best = Math.max(best, nights); Shell.store.set('hush.night', best);
      const garden = s.flowers.map(f => f.alive ? '🌸' : '🥀').join('');
      ui.rTitle.textContent = 'The garden fell silent';
      ui.rStars.innerHTML = '';
      ui.rText.textContent = `You kept it alive ${nights} night${nights === 1 ? '' : 's'}. Best: ${best}.`;
      ui.share.value = `HUSH · daily night ${endless.seed}\n${nights} nights · ${endless.certs} certificates\n${garden}`;
      ui.share.style.display = 'block';
      ui.rButtons.appendChild(button('Copy', () => {
        ui.share.select();
        try { navigator.clipboard.writeText(ui.share.value).catch(() => document.execCommand('copy')); } catch (e) { try { document.execCommand('copy'); } catch (e2) {} }
      }));
      ui.rButtons.appendChild(button('Again', startEndless, true));
      ui.rButtons.appendChild(button('Levels', () => { endless = null; showMenu(); }));
    }
    ui.result.classList.add('on'); fitStage();
  }

  // ---------- input ----------
  const isActive = Shell.gate(canvas, active => { if (active === false && view && view.running) paused = true; else paused = false; });
  function pt(e) { const b = canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  let press = null;
  canvas.addEventListener('pointerdown', e => {
    A.unlock();
    if (!isActive() || mode !== 'play' || !view || view.outcome) return;
    paused = false;
    const p = pt(e), n = view.flowers.length;
    if (view.level.owl && rend.hitOwl(p.x, p.y) && view.state.owl.mode === 'idle') {
      view.owl.selected = !view.owl.selected; A.select();
      press = { owl: true, x: p.x, y: p.y, id: e.pointerId };
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      return;
    }
    const i = rend.hitFlower(p.x, p.y, n);
    if (i >= 0 && view.state.flowers[i].alive) {
      if (view.owl.selected) doSummon(i); else doWater(i);
      return;
    }
    view.owl.selected = false;
    if (!view.running) { ensureRunning(); flash('…'); }
  });
  canvas.addEventListener('pointermove', e => {
    if (!press || !press.owl) return;
    const p = pt(e);
    if (Math.hypot(p.x - press.x, p.y - press.y) > 12) { view.owl.drag = p; view.owl.selected = true; }
  });
  function endPress(e) {
    if (!press) return;
    if (press.owl && view && view.owl.drag) {
      const p = pt(e), i = rend.hitFlower(p.x, p.y, view.flowers.length);
      view.owl.drag = null;
      if (i >= 0 && view.state.flowers[i].alive) doSummon(i); else view.owl.selected = false;
    }
    press = null;
  }
  canvas.addEventListener('pointerup', endPress);
  canvas.addEventListener('pointercancel', () => { press = null; if (view) view.owl.drag = null; });
  window.addEventListener('keydown', e => {
    if (mode !== 'play' || !view) return;
    const k = parseInt(e.key, 10);
    if (k >= 1 && k <= view.flowers.length) { if (view.owl.selected) doSummon(k - 1); else doWater(k - 1); }
    if (e.key === 'o' || e.key === 'O') { if (view.level.owl && view.state.owl.mode === 'idle') { view.owl.selected = !view.owl.selected; A.select(); } }
    if (e.key === ' ') { e.preventDefault(); if (!view.running) ensureRunning(); else paused = !paused; }
  });

  ui.result.addEventListener('click', e => {
    if (e.target.closest('button') || e.target === ui.share) return;
    const primary = ui.rButtons.querySelector('button.primary');
    if (primary) primary.click();
  });
  $('playBtn').addEventListener('click', e => {
    e.stopPropagation(); A.unlock(); canvas.click();
    const first = LEVELS.find(l => !progress[l.id]) || LEVELS[0];
    startLevel(first);
  });
  $('levelsBtn').addEventListener('click', e => { e.stopPropagation(); A.unlock(); showMenu(); });
  $('nightBtn').addEventListener('click', e => { e.stopPropagation(); A.unlock(); canvas.click(); startEndless(); });
  $('restartBtn').addEventListener('click', () => { A.unlock(); if (view) { if (endless) startNight(); else startLevel(view.level); } });
  $('menuBtn').addEventListener('click', () => { A.unlock(); showMenu(); });
  const soundBtn = $('soundBtn');
  function soundLabel() { soundBtn.textContent = A.muted ? '♪̸' : '♪'; soundBtn.style.opacity = A.muted ? 0.5 : 1; }
  soundBtn.addEventListener('click', () => { A.unlock(); A.setMuted(!A.muted); Shell.store.set('hush.muted', A.muted); soundLabel(); });
  soundLabel();

  // ---------- attract mode behind the title ----------
  const attract = {
    id: 'attract', thread: 0, name: '', length: 9999, water: { start: 0, max: 0, regen: 0 }, owl: true,
    flowers: [{ kind: 'fold', t: 2, rate: 4, offset: 0 }, { kind: 'fold', t: 5, rate: 5, offset: 2 }, { kind: 'fold', t: 8, rate: 6, offset: 1 }, { kind: 'fold', t: 3, rate: 4, offset: 3 }, { kind: 'fold', t: 6, rate: 5, offset: 0 }],
    gusts: [], visits: [],
  };
  function startAttract() {
    startLevel(attract);
    mode = 'intro'; view.running = true; view.breathMs = 1400;
    ui.title.innerHTML = '<b>HUSH</b> · a night garden'; ui.hint.textContent = '';
    ui.intro.classList.add('on');
    refreshMeters();
    $('restartBtn').style.visibility = 'hidden';
  }

  // ---------- loop ----------
  let lastT = now();
  function frame() {
    const t = now(), dt = Math.min(0.1, t - lastT); lastT = t;
    if (view) {
      if (view.running && !paused && visible) {
        view.breathT += dt * 1000 / view.breathMs;
        if (mode === 'intro') {
          // keep the attract garden cycling: thirst rises, wilting buds reset
          if (view.breathT >= 1) {
            view.breathT -= 1; view.state.breath++;
            view.state.flowers.forEach((lf, i) => {
              if ((view.state.breath + lf.offset) % lf.rate === 0) lf.t = lf.t >= 9 ? 1 : lf.t + 1;
              view.flowers[i].hist.push({ b: H.bloomFrac(lf.kind, lf.t), water: lf.t === 1 });
              if (view.flowers[i].hist.length > SPAN + 4) view.flowers[i].hist.shift();
            });
          }
        } else {
          while (view.breathT >= 1 && view.running) { view.breathT -= 1; breathe(); }
          if (view.running) refreshMeters();
        }
      }
      // ease displayed bloom toward truth
      view.state.flowers.forEach((lf, i) => {
        const f = view.flowers[i], target = lf.alive ? H.bloomFrac(lf.kind, lf.t) : 0;
        // a little spring so petals settle with a bounce
        f.vel = (f.vel || 0) + (target - f.shown) * dt * 90;
        f.vel *= Math.pow(0.0009, dt);
        f.shown = Math.max(0, Math.min(1.08, f.shown + f.vel * dt));
      });
      if (view.outcome === 'won') view.dawn = Math.min(1, (t - view.endAt) / 1.3);
      view.effects = view.effects.filter(e => t - e.t0 < e.dur + 0.1);
      // the Owl's flight is timed to land exactly on the next breath
      const ov = Object.assign({}, view, { breathT: view.owl.mode === 'flying' ? Math.min(1, (t - view.owl.flyT0) / Math.max(0.05, view.owl.flyT1 - view.owl.flyT0)) : view.breathT });
      rend.draw(ov, t);
    }
    requestAnimationFrame(frame);
  }

  // ---------- sizing, visibility ----------
  function resize() { rend.resize(document.getElementById('hush').clientWidth); Shell.reportHeight(); }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  try {
    new IntersectionObserver(es => { visible = es[0].isIntersecting && !document.hidden; }).observe(document.getElementById('hush'));
  } catch (e) {}
  // Hooks for automated screenshots and tests.
  window.__hushDebug = {
    flower(i, b) { const p = rend.headPos(i); return { x: b.left + p.x, y: b.top + p.y }; },
    owl(b) { const o = rend.L.owlPos; return o ? { x: b.left + o.x, y: b.top + o.y } : null; },
    start(id) { canvas.click(); endless = null; startLevel(LEVELS.find(l => l.id === id)); },
    go() { if (view) ensureRunning(); },
    state() { return view && { breath: view.state.breath, water: view.state.water, t: view.state.flowers.map(f => f.t), outcome: view.outcome, owl: view.state.owl.mode, passes: view.state.passes }; },
  };
  resize();
  Shell.watchHeight();
  startAttract();
  requestAnimationFrame(frame);
})();
