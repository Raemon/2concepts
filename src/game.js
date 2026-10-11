// STILL WATER: the game controller. Input, the fixed-step loop, events -> effects and sound, level flow.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const { LEVELS, THREADS, endless } = SWLevels;
  const DT = 0.05;
  const canvas = $('c'), stage = $('stage');
  const rend = SWRender.createRenderer(canvas);

  let view = 'title';            // title | card | play | paused | result | menu
  let level = null, li = -1, st = null;
  let effects = [], acc = 0, vis = 0, lastNow = 0, slowUntil = 0, aim = null, resultTimer = 0, demo = null, held = false;
  const seen = {};               // one-time lessons shown this session
  const progress = Shell.store.get('sw-progress', {});
  let bestEndless = Shell.store.get('sw-endless', 0);

  // ---------- sizing ----------
  function fit() {
    const w = Math.max(300, Math.min(700, stage.clientWidth || 380));
    rend.resize(w);
    Shell.reportHeight();
  }
  window.addEventListener('resize', fit);

  // ---------- touch gating: swipes scroll the page until the reader taps the board ----------
  const isActive = Shell.gate(stage, on => {
    if (on === false && view === 'play') pause();
    $('tapHint').classList.toggle('on', on === false && view === 'play');
    if (on !== false) $('tapHint').classList.remove('on');
  });

  // ---------- overlays ----------
  function show(id) {
    for (const o of ['intro', 'card', 'menu', 'pause', 'result']) $(o).classList.toggle('on', o === id);
    Shell.reportHeight();
  }

  // ---------- effects ----------
  const fx = (type, o) => effects.push(Object.assign({ type, t0: vis, dur: 1.2 }, o));
  const at = p => rend.toPx(p);
  function text(p, s, col, size, dur) { const q = at(p); fx('text', { x: q.x, y: q.y - 18, text: s, col, size, dur: dur || 1.3 }); }
  function tag(who, s, col, dur) { fx('tag', { who, text: s, col, dur: dur || 2 }); }
  // a banner sits at the top of the water, or at the bottom when the swimmer it's about is up top
  function banner(s, sub, col, dur, who) {
    const w = who != null && st.swimmers[who];
    fx('banner', { text: s, sub, col, dur: dur || 3.2, low: !!(w && w.y < 0.45) });
  }
  function lesson(key, fn) { if (seen[key]) return; seen[key] = true; fn(); }
  function slow(secs) { slowUntil = vis + secs; }

  function handleEvents() {
    for (const e of st.events) {
      const s = e.who != null ? st.swimmers[e.who] : null;
      switch (e.type) {
        case 'throw': SWAudio.play('throw'); break;
        case 'catch': {
          const q = at(e); fx('splash', { x: q.x, y: q.y, dur: 0.6 });
          SWAudio.play('splash'); SWAudio.play(e.quiet ? 'quietSave' : 'catch');
          text(e, e.quiet ? `Quiet save! +${e.points}` : `+${e.points}`, e.quiet ? '#ffd166' : '#ffffff', e.quiet ? 16 : 14);
          break;
        }
        case 'miss': { const q = at(e); fx('splash', { x: q.x, y: q.y, dur: 0.6 }); SWAudio.play('splash'); text(e, 'missed', 'rgba(255,255,255,0.8)', 12, 0.9); break; }
        case 'saved': {
          SWAudio.play('saved');
          const tw = rend.towerPx();
          for (let k = 0; k < 14; k++) fx('confetti', { x: tw.x, y: tw.y - 20, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 90, col: ['#ffd166', '#ff6b4a', '#3ddc97', '#ffffff'][k % 4], dur: 1.1 });
          break;
        }
        case 'struggle':
          SWAudio.play('help');
          if (level.id === 'first') lesson('tapHere', () => tag(e.who, 'tap near me!', '#ffd166', 3.5));
          break;
        case 'quiet':
          if (e.fromStruggle) {
            tag(e.who, 'went quiet…', '#ffb36b', 2.4);
            lesson('foldback', () => { slow(1.8); banner('Quiet is worse', 'No strength left to shout. They’re drowning.', '#ffb36b', 3.6, e.who); });
          }
          break;
        case 'reply':
          if (e.kind === 'none') {
            SWAudio.play('flag');
            tag(e.who, 'no answer!', '#ff5a5f', 2.2);
            lesson('flag', () => banner('No answer', 'Too busy trying to breathe. Throw it right on them.', '#ff5a5f', 3.4, e.who));
          }
          break;
        case 'whistle': SWAudio.play('whistle'); fx('whistle', { dur: 1.4 }); break;
        case 'lost': SWAudio.play('lost'); break;
        case 'call': SWAudio.play('radio'); text({ x: 0.5, y: 0.93 }, 'Captain, come take a look!', '#ffffff', 12, 1.6); break;
        case 'inspect': SWAudio.play('horn'); break;
        case 'skip': text({ x: 0.75, y: 0.93 }, 'He trusts you: visit skipped', '#3ddc97', 13, 2); break;
        case 'strike':
          SWAudio.play('strike');
          banner('Strike!', 'He saw someone yelling.', '#ff5a5f', 2.4);
          break;
        case 'star':
          SWAudio.play('star'); SWAudio.play('stamp');
          fx('stamp', { dur: 1.8 });
          if (e.quiet && e.quiet.length) {
            for (const w of e.quiet) tag(w, 'certified safe…', '#ff5a5f', 3);
            lesson('certified', () => { slow(1.5); banner('Certified safe', 'He only saw calm water. Someone is drowning in it.', '#ff5a5f', 4, e.quiet[0]); });
          }
          break;
        case 'over': onOver(); break;
      }
    }
    st.events.length = 0;
  }

  // ---------- the loop ----------
  function frame(now) {
    const real = Math.min(0.1, Math.max(0, (now - lastNow) / 1000)) || 0;
    lastNow = now;
    const k = vis < slowUntil ? 0.3 : 1;
    const dv = real * k;
    if (view === 'play' && st && !st.over && !held) {
      acc += dv;
      while (acc >= DT && !st.over) { SW.step(level, st, DT); acc -= DT; handleEvents(); }
    } else if (demo && !level && st) { SW.step(demo, st, dv); st.events.length = 0; }
    if (view !== 'paused') vis += dv;
    effects = effects.filter(e => vis - e.t0 < e.dur);
    rend.draw({ state: st, level, effects, aim: view === 'play' ? aim : null }, vis);
    hud();
    requestAnimationFrame(frame);
  }

  // ---------- HUD ----------
  let hudKey = '';
  function hud() {
    const playing = !!st && (view === 'play' || view === 'paused' || view === 'result' || view === 'card');
    const L = level;
    const hasCap = L && SW.hasCaptain(L);
    $('whistleBtn').style.display = L && L.whistle === false ? 'none' : '';
    $('whistleBtn').disabled = !(playing && view === 'play' && SW.canWhistle(st));
    const cd = playing ? Math.max(0, Math.min(1, (st.whistle.ready - st.t) / SW.RULES.whistleCooldown)) : 0;
    $('whistleBtn').querySelector('.cd').style.width = (cd * 100) + '%';
    const cb = $('callBtn');
    cb.style.display = hasCap && L.canCall !== false ? '' : 'none';
    let label = 'Call Captain', trusted = false;
    if (playing && hasCap) {
      const C = st.captain;
      if (C.mode === 'driving') label = 'On his way…';
      else if (C.mode === 'looking') label = 'Inspecting…';
      else if (C.mode === 'away' && st.t < C.trustUntil) { label = `Trusted <small>${Math.ceil(C.trustUntil - st.t)}s</small>`; trusted = true; }
      else if (C.mode === 'away' && st.swimmers.some(SW.loud)) label = 'Call Captain <small>(not while someone yells)</small>';
    }
    cb.disabled = !(playing && view === 'play' && SW.canCall(L, st));
    cb.classList.toggle('trusted', trusted);
    const key = [label, playing ? st.score : '', playing ? st.strikes : '', playing ? st.lost : '', L ? L.id : ''].join('|');
    if (key !== hudKey) {
      hudKey = key;
      cb.innerHTML = label;
      $('score').textContent = playing ? st.score : '';
      $('lvName').textContent = L ? L.name : '';
      if (playing && hasCap && !L.endless) {
        const max = L.strikes == null ? 1 : L.strikes;
        $('strikes').innerHTML = Array.from({ length: max }, (_, i) => i < st.strikes ? '✗' : '<span class="off">✗</span>').join('');
        $('strikes').title = `${max - st.strikes} strike(s) left`;
      } else if (playing && L.endless) {
        $('strikes').innerHTML = Array.from({ length: L.strikes }, (_, i) => i < st.strikes ? '✗' : '<span class="off">✗</span>').join('');
      } else $('strikes').innerHTML = '';
      $('lives').textContent = playing && L.endless ? '♥'.repeat(Math.max(0, L.lives - st.lost)) : '';
    }
    const frac = playing && !L.endless ? Math.min(1, st.t / L.length) : playing ? (st.t % 60) / 60 : 0;
    $('clock').firstElementChild.style.width = (frac * 100) + '%';
  }

  // ---------- input ----------
  function local(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  canvas.addEventListener('pointerdown', e => {
    if (!isActive()) return;
    if (view !== 'play' || !st || st.over) return;
    const p = local(e), w = rend.toWater(p.x, p.y);
    if (!w.inWater) return;
    e.preventDefault();
    if (SW.inspecting(st)) { text(w, 'Not now: he’s inspecting', '#ffd166', 12, 1); return; }
    if (!SW.canThrow(st)) { text(w, 'no ring ready', 'rgba(255,255,255,0.85)', 12, 0.8); return; }
    SW.throwRing(st, w.x, w.y);
    handleEvents();
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const p = local(e), w = rend.toWater(p.x, p.y);
    aim = w.inWater ? p : null;
  });
  canvas.addEventListener('pointerleave', () => { aim = null; });

  function whistle() { if (view === 'play' && level && level.whistle !== false && SW.blowWhistle(st)) handleEvents(); }
  function call() { if (view === 'play' && SW.callCaptain(level, st)) handleEvents(); }
  $('whistleBtn').onclick = whistle;
  $('callBtn').onclick = call;
  document.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'w' || e.key === 'W') { if (view === 'play') { e.preventDefault(); whistle(); } }
    else if (e.key === 'c' || e.key === 'C') call();
    else if (e.key === 'r' || e.key === 'R') { if (level) restart(); }
    else if (e.key === 'Escape' && view === 'play') pause();
  });

  // ---------- flow ----------
  function setLevel(L, idx) {
    level = L; li = idx; st = SW.init(L); effects = []; acc = 0; slowUntil = 0; rend.reset();
    clearTimeout(resultTimer);
  }
  function openCard(idx) {
    const L = idx === -1 ? endless((Date.now() % 100000) + 1) : LEVELS[idx];
    setLevel(L, idx);
    if (L.endless) {
      $('cKicker').textContent = 'Endless';
      $('cTitle').textContent = 'Endless summer';
      $('cText').innerHTML = 'The beach fills up as the day goes on. Lose three swimmers, or get three strikes, and your shift is over.';
    } else {
      const th = THREADS.find(t => t.id === L.thread);
      $('cKicker').textContent = `${th.name} · Shift ${idx + 1} of ${LEVELS.length}`;
      $('cTitle').textContent = L.name;
      $('cText').innerHTML = L.intro;
    }
    view = 'card'; show('card');
  }
  function begin() { view = 'play'; show(null); SWAudio.setOn(SWAudio.on); }
  function restart() {
    if (li === -1 && level && level.endless) { setLevel(endless((Date.now() % 100000) + 1), -1); begin(); }
    else if (li >= 0) { setLevel(LEVELS[li], li); begin(); }
  }
  function pause() { if (view !== 'play') return; view = 'paused'; show('pause'); }
  function resume() { if (view !== 'paused') return; view = 'play'; show(null); }
  $('startBtn').onclick = begin;
  $('resumeBtn').onclick = resume;
  $('restartBtn').onclick = () => { if (level) restart(); };
  $('menuBtn').onclick = () => openMenu();
  $('playBtn').onclick = () => { const next = LEVELS.findIndex(L => !progress[L.id]); openCard(next < 0 ? 0 : next); };
  $('levelsBtn').onclick = () => openMenu();
  $('endlessBtn').onclick = () => openCard(-1);

  function onOver() {
    clearTimeout(resultTimer);
    const L = level, s = st;
    resultTimer = setTimeout(() => { if (st === s && view === 'play') showResult(L, s); }, s.over === 'won' ? 900 : 1600);
  }

  function lossReason(s) {
    const gone = s.swimmers.filter(w => w.state === 'lost');
    const w = gone[gone.length - 1];
    if (!w) return '';
    const V = s.captain.verdict;
    const certified = V && V.ok && w.since - V.t < 8 && w.since >= V.t - 2.5;
    if (certified) return 'The Captain looked, saw calm water, and certified your beach. Someone was drowning in it. <b>Calm isn’t safe.</b>';
    if (w.wasLoud) return 'They yelled for help, then went quiet. Quiet was worse: they had no strength left to shout. <b>Go to the ones who stop.</b>';
    return 'They never made a sound. Real drowning is quiet: <b>whistle</b>, and throw to whoever doesn’t wave back.';
  }

  function showResult(L, s) {
    view = 'result';
    const quietSaves = s.swimmers.filter(w => w.state === 'saved' && (w.flagged !== false || w.sink > 0)).length;
    let title, kicker, body, stars = 0;
    const btns = [];
    if (L.endless) {
      const saved = s.saved;
      const best = saved > bestEndless;
      if (best) { bestEndless = saved; Shell.store.set('sw-endless', saved); }
      kicker = 'Endless summer'; title = s.over === 'fired' ? 'Fired!' : 'Shift over';
      body = `You saved <b>${saved}</b> swimmer${saved === 1 ? '' : 's'}${quietSaves ? `, ${quietSaves} of them quiet` : ''} · ${s.score} points.<br>${best ? 'A new best!' : `Your best: ${bestEndless}.`}`;
      if (s.over === 'lost') body += '<br>' + lossReason(s);
      btns.push(['Play again', () => openCard(-1), true], ['Levels', openMenu]);
      SWAudio.play(best ? 'win' : 'fail');
    } else if (s.over === 'won') {
      stars = SW.stars(L, s);
      const prev = progress[L.id] || { stars: 0, score: 0 };
      progress[L.id] = { stars: Math.max(prev.stars, stars), score: Math.max(prev.score, s.score) };
      Shell.store.set('sw-progress', progress);
      kicker = `Shift ${li + 1} complete`; title = ['', 'Everyone’s safe', 'Nice work', 'Lifeguard of the year'][stars];
      body = `${s.saved} saved${quietSaves ? ` (${quietSaves} quiet)` : ''}${s.stars ? ` · ${s.stars} clean inspection${s.stars > 1 ? 's' : ''}` : ''} · <b>${s.score}</b> points`;
      if (stars < 3 && L.stars) body += `<br><small>${L.stars[stars === 1 ? 0 : 1]} for ${stars + 1} stars: faster rescues score more.</small>`;
      if (li + 1 < LEVELS.length) btns.push(['Next shift', () => openCard(li + 1), true]);
      else { body += '<br>That’s every shift. Try <b>Endless summer</b>.'; btns.push(['Endless summer', () => openCard(-1), true]); }
      btns.push(['Replay', restart], ['Levels', openMenu]);
      SWAudio.play('win');
    } else if (s.over === 'fired') {
      kicker = L.name; title = 'Fired!';
      body = 'The Captain saw someone yelling. Clear the water before he looks, or <b>radio him in</b> while it’s calm: after a clean inspection he stays away a while.';
      btns.push(['Try again', restart, true], ['Levels', openMenu]);
      SWAudio.play('fail');
    } else {
      kicker = L.name; title = 'Someone drowned';
      body = lossReason(s);
      btns.push(['Try again', restart, true], ['Levels', openMenu]);
      SWAudio.play('fail');
    }
    $('rKicker').textContent = kicker;
    $('rTitle').textContent = title;
    $('rStars').innerHTML = stars ? [1, 2, 3].map(i => i <= stars ? '★' : '<span class="off">★</span>').join('') : '';
    $('rStars').style.display = stars ? '' : 'none';
    $('rText').innerHTML = body;
    const row = $('rButtons'); row.innerHTML = '';
    for (const [label, fn, primary] of btns) {
      const b = document.createElement('button'); b.textContent = label; if (primary) b.className = 'primary'; b.onclick = fn; row.appendChild(b);
    }
    show('result');
  }

  function openMenu() {
    const m = $('menu'); m.innerHTML = '';
    const h = document.createElement('h2'); h.textContent = 'Shifts'; m.appendChild(h);
    THREADS.forEach(th => {
      const box = document.createElement('div'); box.className = 'thread';
      box.innerHTML = `<h3>${th.name}</h3><p>${th.blurb}</p>`;
      LEVELS.forEach((L, i) => {
        if (L.thread !== th.id) return;
        const unlocked = i === 0 || progress[LEVELS[i - 1].id] || progress[L.id];
        const b = document.createElement('button'); b.className = 'lv' + (unlocked ? '' : ' locked');
        const s = progress[L.id] ? progress[L.id].stars : 0;
        b.innerHTML = `${i + 1}. ${L.name}${s ? `<span class="s">${'★'.repeat(s)}</span>` : ''}`;
        b.onclick = () => openCard(i);
        if (!unlocked) b.title = 'Finish the shift before it (or play it anyway)';
        box.appendChild(b);
      });
      m.appendChild(box);
    });
    const end = document.createElement('div'); end.className = 'thread';
    end.innerHTML = `<h3>Endless summer</h3><p>${bestEndless ? `Your best: ${bestEndless} saved.` : 'How long can you keep everyone afloat?'}</p>`;
    const eb = document.createElement('button'); eb.className = 'lv'; eb.textContent = 'Play endless'; eb.onclick = () => openCard(-1);
    end.appendChild(eb); m.appendChild(end);
    const row = document.createElement('div'); row.className = 'row';
    const inGame = !!(level && st && !st.over && (view === 'play' || view === 'paused'));
    const back = document.createElement('button'); back.textContent = inGame ? 'Back to the beach' : 'Close';
    back.onclick = () => { if (inGame) { view = 'paused'; show('pause'); } else { view = 'title'; attract(); show('intro'); } };
    row.appendChild(back); m.appendChild(row);
    view = inGame ? 'paused' : 'menu';
    show('menu');
  }

  // ---------- sound ----------
  function soundLabel() { $('soundBtn').textContent = SWAudio.on ? '♪' : '♪̸'; $('soundBtn').style.opacity = SWAudio.on ? 1 : 0.55; }
  SWAudio.setOn(false);
  $('soundBtn').onclick = () => { SWAudio.setOn(!SWAudio.on); Shell.store.set('sw-sound', SWAudio.on); soundLabel(); };
  // sound starts on the first press of Play/Start if the reader had it on before (browsers need a gesture)
  const wantSound = Shell.store.get('sw-sound', true);
  for (const id of ['playBtn', 'startBtn', 'endlessBtn']) $(id).addEventListener('click', () => { if (wantSound && !SWAudio.on) { SWAudio.setOn(true); soundLabel(); } });
  soundLabel();

  // pause when the widget scrolls out of view or the tab hides
  try {
    new IntersectionObserver(es => { for (const e of es) if (!e.isIntersecting) pause(); }, { threshold: 0.15 }).observe(stage);
  } catch (e) {}
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', () => pause());

  // ---------- title screen: a calm beach behind the menu ----------
  function attract() {
    demo = { length: 1e9, rings: 1, swimmers: [
      { kind: 'swimmer', x: 0.25, y: 0.55 }, { kind: 'treader', x: 0.7, y: 0.35 }, { kind: 'floater', x: 0.45, y: 0.7 },
      { kind: 'swimmer', x: 0.8, y: 0.65 }, { kind: 'swimmer', x: 0.15, y: 0.25 }, { kind: 'treader', x: 0.55, y: 0.18 } ] };
    level = null; st = SW.init(demo);
  }

  // debug hooks for tests
  window.__swDebug = {
    get rend() { return rend; }, get state() { return st; }, get level() { return level; }, get view() { return view; }, get li() { return li; },
    openCard, begin, restart, whistle, call,
    throwAt(x, y) { if (view === 'play' && SW.throwRing(st, x, y)) { handleEvents(); return true; } return false; },
    // stepping also advances the visual clock and draws, so screenshots look like real play
    step(n) { for (let i = 0; i < n && st && !st.over; i++) { SW.step(level, st, DT); handleEvents(); vis += DT; rend.draw({ state: st, level, effects, aim: null }, vis); } effects = effects.filter(e => vis - e.t0 < e.dur); },
    setPaused(p) { if (p) { view = 'paused'; } else { view = 'play'; show(null); } },
    hold(h) { held = !!h; acc = 0; },
    canvasPoint(x, y) { const p = rend.toPx({ x, y }); const r = canvas.getBoundingClientRect(); return { x: r.left + p.x, y: r.top + p.y }; },
  };

  fit();
  attract();
  Shell.watchHeight();
  requestAnimationFrame(t => { lastNow = t; frame(t); });
})();
