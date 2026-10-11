// STILL WATER: the rules, shared by the game and the solver.
// The beach is a unit square of water: x 0..1 left to right, y 0 (far out) .. 1 (the shoreline).
// The lifeguard tower stands on the sand just below the middle of the shoreline.
(function (root) {
  'use strict';

  const TOWER = { x: 0.5, y: 1.1 };
  const RULES = {
    flight: d => 0.32 + 0.45 * d,      // seconds for a thrown ring to land
    tow: d => 0.6 + 1.3 * d,          // seconds to haul a swimmer in
    retrieve: d => 0.3 + 0.5 * d,     // seconds to pull back a ring that caught nobody
    reachStruggle: 0.11,              // a struggling swimmer grabs a ring this close
    reachDrown: 0.06,                 // a drowning swimmer can barely reach: the ring must land on them
    whistleCooldown: 2,
    whistleSpeed: 1.8,                // how fast the whistle carries across the water
    captainDrive: 1.0,                // seconds for the Captain to arrive once called
    captainLook: 1.6,                 // seconds he spends looking
    captainWarn: 4,                   // seconds of warning before a scheduled visit
    captainTrust: 20,                 // after a clean inspection he stays away this long
  };

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // A level is data:
  // { length, rings, strikes, swimmers: [{ kind, x, y, enter, leave, trouble, struggle, drown }], captain: [times], canCall }
  //   kind: 'swimmer' (struggles loudly, then goes quiet), 'silent' (goes straight to quiet drowning),
  //         'treader' / 'floater' (quiet and fine: they wave back when whistled at)
  function init(level) {
    return {
      t: 0,
      rings: Array.from({ length: level.rings || 1 }, () => ({ mode: 'ready', t0: 0, t1: 0, x: TOWER.x, y: TOWER.y, who: -1 })),
      swimmers: level.swimmers.map((s, i) => ({
        id: i, kind: s.kind, x: s.x, y: s.y, x0: s.x, y0: s.y,
        enter: s.enter || 0, leave: s.leave == null ? Infinity : s.leave, trouble: s.trouble == null ? Infinity : s.trouble,
        struggle: s.kind === 'silent' ? 0 : (s.struggle || 6), drown: s.drown || 5,
        state: (s.enter || 0) > 0 ? 'away' : 'swim', since: 0, sink: 0, reply: null, wasLoud: false, flagged: false,
      })),
      whistle: { ready: 0, t0: -99 },
      captain: { mode: 'away', t0: 0, trustUntil: -1, callableAt: 0, warnFor: null, verdict: null, loudAtStart: [], schedule: (level.captain || []).slice() },
      strikes: 0, stars: 0, saved: 0, lost: 0, misses: 0, score: 0,
      events: [],
      over: null,
    };
  }

  function needsHelp(s) { return s.state === 'struggle' || s.state === 'drown'; }
  function loud(s) { return s.state === 'struggle'; }
  function inspecting(st) { return st.captain.mode === 'looking'; }

  function swimmerState(level, s, t) {
    if (t < s.enter) return 'away';
    if (t < s.trouble) return t >= s.leave ? 'gone' : 'swim';
    if (t < s.trouble + s.struggle) return 'struggle';
    if (t < s.trouble + s.struggle + s.drown) return 'drown';
    return 'lost';
  }

  // ---------- player actions ----------
  function canThrow(st) { return !st.over && !inspecting(st) && st.rings.some(r => r.mode === 'ready'); }
  function throwRing(st, x, y) {
    if (!canThrow(st)) return false;
    const r = st.rings.find(r => r.mode === 'ready');
    const d = dist(TOWER, { x, y });
    r.mode = 'flying'; r.t0 = st.t; r.t1 = st.t + RULES.flight(d); r.x = x; r.y = y; r.who = -1;
    st.events.push({ type: 'throw', x, y });
    return true;
  }
  function canWhistle(st) { return !st.over && st.t >= st.whistle.ready; }
  function blowWhistle(st) {
    if (!canWhistle(st)) return false;
    st.whistle.t0 = st.t; st.whistle.ready = st.t + RULES.whistleCooldown;
    st.swimmers.forEach(s => { s.reply = null; });
    st.events.push({ type: 'whistle' });
    return true;
  }
  function hasCaptain(level) { return !!(level.canCall || (level.captain && level.captain.length)); }
  function canCall(level, st) {
    // you radio "all calm here, come take a look": you can't say that while someone is yelling
    return !st.over && level.canCall !== false && hasCaptain(level) && st.captain.mode === 'away' && st.t >= st.captain.trustUntil &&
      st.t >= st.captain.callableAt && !st.swimmers.some(loud);
  }
  function callCaptain(level, st) {
    if (!canCall(level, st)) return false;
    st.captain.mode = 'driving'; st.captain.t0 = st.t; st.captain.called = true;
    st.events.push({ type: 'call' });
    return true;
  }

  // ---------- the world moves ----------
  function step(level, st, dt) {
    if (st.over) return st;
    const t0 = st.t, t1 = st.t + dt;
    st.t = t1;
    // swimmers
    for (const s of st.swimmers) {
      if (s.state === 'towed' || s.state === 'saved' || s.state === 'lost' || s.state === 'gone') continue;
      const next = swimmerState(level, s, t1);
      if (next !== s.state) {
        const prev = s.state;
        s.state = next; s.since = t1;
        if (next === 'swim' && prev === 'away') st.events.push({ type: 'enter', who: s.id });
        if (next === 'struggle') { s.wasLoud = true; st.events.push({ type: 'struggle', who: s.id }); }
        if (next === 'drown') st.events.push({ type: 'quiet', who: s.id, fromStruggle: prev === 'struggle' });
        if (next === 'lost') { st.lost++; st.events.push({ type: 'lost', who: s.id }); }
      }
      // gentle motion (deterministic): swimmers wander, strugglers drift out, the drowning hold still and sink
      const k = s.id * 7.13;
      if (s.state === 'swim') {
        s.x = s.x0 + Math.sin(t1 * 0.5 + k) * 0.03; s.y = s.y0 + Math.cos(t1 * 0.37 + k) * 0.02;
      } else if (s.state === 'struggle') {
        s.y = Math.max(0.04, s.y - 0.012 * dt); s.x += Math.sin(t1 * 2.1 + k) * 0.004 * dt;
        s.x0 = s.x; s.y0 = s.y;
      } else if (s.state === 'drown') {
        s.sink = Math.min(1, (t1 - s.since) / s.drown);
      }
    }
    // whistle replies, as the sound reaches each swimmer
    if (t1 - st.whistle.t0 < 3) {
      for (const s of st.swimmers) {
        if (s.reply || s.state === 'away' || s.state === 'gone' || s.state === 'towed' || s.state === 'saved' || s.state === 'lost') continue;
        const reach = dist(TOWER, s) / RULES.whistleSpeed;
        if (t1 - st.whistle.t0 >= reach) {
          s.reply = { t: t1, kind: s.state === 'struggle' ? 'help' : s.state === 'drown' ? 'none' : 'wave' };
          if (s.reply.kind === 'none' && s.flagged === false) s.flagged = t1;   // no answer: marked, and remembered
          st.events.push({ type: 'reply', who: s.id, kind: s.reply.kind });
        }
      }
    }
    // rings
    for (const r of st.rings) {
      if (r.mode === 'flying' && t1 >= r.t1) {
        // who can reach it?
        let best = null, bd = 1e9;
        for (const s of st.swimmers) {
          if (!needsHelp(s)) continue;
          const d = dist(s, r), reach = s.state === 'drown' ? RULES.reachDrown : RULES.reachStruggle;
          if (d <= reach && d < bd) { bd = d; best = s; }
        }
        const d = dist(TOWER, r);
        if (best) {
          const quiet = best.state === 'drown';
          const fast = Math.max(0, Math.round(50 - 10 * (t1 - best.trouble)));
          const points = 100 + fast + (quiet ? 50 : 0);
          best.state = 'towed'; best.since = t1; best.tx = r.x; best.ty = r.y;
          r.mode = 'towing'; r.who = best.id; r.t0 = t1; r.t1 = t1 + RULES.tow(d);
          st.score += points;
          st.events.push({ type: 'catch', who: best.id, x: r.x, y: r.y, quiet, fast, points });
        } else {
          r.mode = 'retrieving'; r.t0 = t1; r.t1 = t1 + RULES.retrieve(d);
          st.misses++;
          st.events.push({ type: 'miss', x: r.x, y: r.y });
        }
      } else if (r.mode === 'towing' && t1 >= r.t1) {
        const s = st.swimmers[r.who];
        s.state = 'saved'; st.saved++;
        st.events.push({ type: 'saved', who: s.id });
        r.mode = 'ready'; r.who = -1;
      } else if (r.mode === 'retrieving' && t1 >= r.t1) {
        r.mode = 'ready';
      }
    }
    // the Captain
    const C = st.captain;
    if (C.mode === 'away') {
      // scheduled visits; skipped while he trusts the beach
      const due = C.schedule.find(v => v > t0 - 1e-9 && v - RULES.captainWarn <= t1 + 1e-9);
      C.warnFor = due != null && due >= C.trustUntil ? due : null;
      const arrive = C.schedule.find(v => v > t0 - 1e-9 && v <= t1 + 1e-9);
      if (arrive != null) {
        C.schedule = C.schedule.filter(v => v !== arrive);
        if (arrive >= C.trustUntil) { C.mode = 'looking'; C.t0 = arrive; C.called = false; C.loudAtStart = st.swimmers.filter(loud).map(s => s.id); st.events.push({ type: 'inspect' }); }
        else st.events.push({ type: 'skip' });
      }
    } else if (C.mode === 'driving' && t1 - C.t0 >= RULES.captainDrive) {
      C.mode = 'looking'; C.t0 = t1; C.loudAtStart = st.swimmers.filter(loud).map(s => s.id); st.events.push({ type: 'inspect' });
    } else if (C.mode === 'looking' && t1 - C.t0 >= RULES.captainLook) {
      // a strike is someone yelling the whole time he looked
      const noisy = st.swimmers.filter(s => loud(s) && C.loudAtStart.includes(s.id)).map(s => s.id);
      if (noisy.length) { st.strikes++; C.callableAt = t1 + 6; C.verdict = { ok: false, t: t1, noisy }; st.events.push({ type: 'strike', noisy }); }
      else {
        st.stars++; st.score += 100; C.trustUntil = t1 + RULES.captainTrust; C.verdict = { ok: true, t: t1 };
        const quiet = st.swimmers.filter(s => s.state === 'drown').map(s => s.id);
        st.events.push({ type: 'star', quiet });
      }
      C.mode = 'leaving'; C.t0 = t1;
    } else if (C.mode === 'leaving' && t1 - C.t0 >= 1.2) {
      C.mode = 'away';
    }
    // end of shift
    const maxStrikes = level.strikes == null ? 1 : level.strikes;
    if (level.endless) {
      if (st.lost >= (level.lives || 3)) st.over = 'lost';
      else if (st.strikes >= maxStrikes) st.over = 'fired';
    } else {
      if (st.lost > 0) st.over = 'lost';
      else if (st.strikes >= maxStrikes) st.over = 'fired';
      else if (t1 >= level.length && !st.rings.some(r => r.mode === 'towing') && !st.swimmers.some(needsHelp)) st.over = 'won';
      else if (t1 >= level.length + 12) st.over = 'won';
    }
    if (st.over) st.events.push({ type: 'over', result: st.over });
    return st;
  }

  // Stars come from points: [two, three] thresholds are set from the solver's own score on each level.
  function stars(level, st) {
    if (st.over !== 'won') return 0;
    const [two, three] = level.stars || [Infinity, Infinity];
    return st.score >= three ? 3 : st.score >= two ? 2 : 1;
  }

  const API = { TOWER, RULES, dist, hash, init, step, throwRing, blowWhistle, callCaptain, canThrow, canWhistle, canCall,
    hasCaptain, needsHelp, loud, inspecting, swimmerState, stars };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SW = API;
})(typeof window !== 'undefined' ? window : globalThis);
