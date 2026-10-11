// STILL WATER levels. Three threads: Quiet (the fold-back signal), The Captain (refractory-check capture),
// Calm water (certified collapse). Every level is checked by tools/check-levels.js.
// Coordinates: x 0..1 across, y 0 (far out) .. 1 (the shoreline). Times in seconds.
(function (root) {
  'use strict';
  const S = (x, y, more) => Object.assign({ kind: 'swimmer', x, y }, more);
  const T = (x, y, more) => Object.assign({ kind: 'treader', x, y }, more);
  const F = (x, y, more) => Object.assign({ kind: 'floater', x, y }, more);
  const Q = (x, y, more) => Object.assign({ kind: 'silent', x, y }, more);

  const THREADS = [
    { id: 'quiet', name: 'Quiet', blurb: 'Drowning doesn’t look like drowning.' },
    { id: 'captain', name: 'The Captain', blurb: 'He checks for noise. You choose when.' },
    { id: 'calm', name: 'Calm water', blurb: 'The quietest beach passes every inspection.' },
  ];

  const LEVELS = [
    // ---------------- Quiet ----------------
    {
      id: 'first', thread: 'quiet', name: 'First shift', length: 24, rings: 1, whistle: false,
      intro: 'Someone yelling for help is in trouble. <b>Tap the water</b> next to them to throw the ring.',
      swimmers: [
        S(0.32, 0.62, { trouble: 1.5, struggle: 9 }),
        S(0.70, 0.45, { trouble: 8, struggle: 9 }),
        S(0.22, 0.30, { trouble: 13, struggle: 9 }),
        S(0.62, 0.22, { trouble: 17.5, struggle: 9 }),
        S(0.86, 0.72),
        S(0.50, 0.40, { leave: 12 }),
      ],
    },
    {
      id: 'quiet', thread: 'quiet', name: 'Quiet', length: 24, rings: 1, whistle: false,
      intro: 'Two at once, and you have one ring. Watch the one you can’t reach yet.',
      swimmers: [
        S(0.25, 0.62, { trouble: 3, struggle: 3, drown: 6 }),
        S(0.80, 0.30, { trouble: 3.2, struggle: 2, drown: 6 }),
        S(0.55, 0.45, { trouble: 12, struggle: 4, drown: 6 }),
        S(0.15, 0.25, { trouble: 13, struggle: 2.5, drown: 5 }),
        S(0.88, 0.70),
        S(0.45, 0.20),
      ],
    },
    {
      id: 'waving', thread: 'quiet', name: 'Not waving', length: 26, rings: 1,
      intro: 'Some people go under without a sound. <b>Blow the whistle</b>: everyone who’s fine waves back.',
      swimmers: [
        T(0.30, 0.36), T(0.72, 0.56), F(0.48, 0.64), T(0.88, 0.40),
        Q(0.18, 0.20, { trouble: 4, drown: 6 }),
        S(0.85, 0.15, { trouble: 4.5, struggle: 2, drown: 2.5 }),
        Q(0.62, 0.28, { trouble: 13, drown: 7 }),
        S(0.20, 0.68, { trouble: 14, struggle: 2.5, drown: 4 }),
      ],
    },
    {
      id: 'rush', thread: 'quiet', name: 'Rush hour', length: 32, rings: 2,
      intro: 'Two rings now. Busy water, and not everyone in trouble will tell you.',
      swimmers: [
        S(0.25, 0.55, { trouble: 2, struggle: 3.5, drown: 5 }),
        S(0.75, 0.50, { trouble: 2.5, struggle: 3, drown: 5 }),
        S(0.50, 0.25, { trouble: 3, struggle: 2.5, drown: 5 }),
        T(0.15, 0.30), F(0.62, 0.68), T(0.85, 0.25),
        Q(0.38, 0.40, { trouble: 9, drown: 6 }),
        S(0.80, 0.70, { trouble: 9.5, struggle: 3, drown: 5 }),
        Q(0.70, 0.18, { trouble: 16, drown: 6 }),
        S(0.12, 0.62, { trouble: 16.5, struggle: 2.5, drown: 5 }),
        S(0.45, 0.60, { trouble: 17, struggle: 3, drown: 5 }),
        Q(0.28, 0.15, { trouble: 23, drown: 5 }),
        S(0.90, 0.45, { trouble: 23.5, struggle: 2.5, drown: 5 }),
      ],
    },
    // ---------------- The Captain ----------------
    {
      id: 'inspect', thread: 'captain', name: 'Inspection', length: 30, rings: 1, strikes: 1, canCall: false,
      captain: [12, 26],
      intro: 'The Captain inspects your beach. Anyone <b>yelling</b> when he looks is a strike. Clear the water first.',
      swimmers: [
        S(0.30, 0.60, { trouble: 3, struggle: 8 }),
        S(0.72, 0.40, { trouble: 6.5, struggle: 8 }),
        S(0.20, 0.28, { trouble: 8.5, struggle: 8 }),
        S(0.60, 0.22, { trouble: 19, struggle: 8 }),
        S(0.40, 0.48, { trouble: 21.5, struggle: 8 }),
        S(0.86, 0.70), T(0.12, 0.45),
      ],
    },
    {
      id: 'timing', thread: 'captain', name: 'Your timing', length: 34, rings: 1, strikes: 1, canCall: true,
      captain: [24],
      intro: 'A rush is coming right when he’s due. After a clean inspection he stays away a while. <b>Radio him in early.</b>',
      swimmers: [
        S(0.35, 0.58, { trouble: 3, struggle: 7 }),
        S(0.15, 0.30, { trouble: 20.5, struggle: 7 }),
        S(0.85, 0.25, { trouble: 21, struggle: 7 }),
        S(0.55, 0.15, { trouble: 21.5, struggle: 7 }),
        S(0.70, 0.62, { trouble: 22, struggle: 7 }),
        T(0.45, 0.40), S(0.90, 0.75), S(0.10, 0.70, { leave: 18 }),
      ],
    },
    {
      id: 'twice', thread: 'captain', name: 'Twice', length: 46, rings: 1, strikes: 1, canCall: true,
      captain: [16, 40],
      intro: 'Two visits, two rushes. His trust runs out after 20 seconds.',
      swimmers: [
        S(0.30, 0.55, { trouble: 1.5, struggle: 6 }),
        S(0.20, 0.30, { trouble: 13.5, struggle: 6 }),
        S(0.80, 0.30, { trouble: 14, struggle: 6 }),
        S(0.60, 0.60, { trouble: 15, struggle: 6 }),
        S(0.45, 0.20, { trouble: 24, struggle: 6 }),
        S(0.15, 0.62, { trouble: 37.5, struggle: 6 }),
        S(0.75, 0.18, { trouble: 38, struggle: 6 }),
        S(0.88, 0.55, { trouble: 39, struggle: 6 }),
        T(0.50, 0.42), S(0.92, 0.80),
      ],
    },
    // ---------------- Calm water ----------------
    {
      id: 'clean', thread: 'calm', name: 'Clean bill', length: 32, rings: 1, strikes: 1, canCall: true,
      captain: [26],
      intro: 'When the Captain looks, you see what he sees: <b>only noise</b>. Calm water isn’t the same as safe water.',
      swimmers: [
        S(0.60, 0.60, { trouble: 2, struggle: 6 }),
        Q(0.20, 0.30, { trouble: 6, drown: 5 }),
        S(0.75, 0.35, { trouble: 11.5, struggle: 5 }),
        S(0.30, 0.55, { trouble: 13, struggle: 5 }),
        S(0.85, 0.60, { trouble: 15, struggle: 5 }),
        S(0.15, 0.42, { trouble: 17.5, struggle: 5 }),
        S(0.60, 0.20, { trouble: 19.5, struggle: 5 }),
        S(0.40, 0.30, { trouble: 21, struggle: 5 }),
        S(0.72, 0.50, { trouble: 23.5, struggle: 5 }),
        S(0.25, 0.20, { trouble: 25, struggle: 5 }),
        T(0.55, 0.48), F(0.70, 0.72), T(0.10, 0.18),
      ],
    },
    {
      id: 'last', thread: 'calm', name: 'Last light', length: 50, rings: 2, strikes: 1, canCall: true,
      captain: [20, 44],
      intro: 'Everything at once. Keep them alive, keep him happy, and don’t believe the calm.',
      swimmers: [
        S(0.30, 0.55, { trouble: 2, struggle: 4, drown: 4 }),
        S(0.70, 0.45, { trouble: 2.5, struggle: 3, drown: 4 }),
        Q(0.50, 0.30, { trouble: 7, drown: 5 }),
        T(0.15, 0.35), F(0.85, 0.65), T(0.62, 0.70), T(0.40, 0.18),
        S(0.20, 0.25, { trouble: 18, struggle: 4 }),
        S(0.80, 0.25, { trouble: 18.4, struggle: 4 }),
        S(0.55, 0.62, { trouble: 18.8, struggle: 4 }),
        S(0.10, 0.60, { trouble: 19.2, struggle: 4 }),
        S(0.68, 0.40, { trouble: 19.5, struggle: 4 }),
        Q(0.75, 0.15, { trouble: 27, drown: 5 }),
        S(0.35, 0.40, { trouble: 30, struggle: 3, drown: 4 }),
        S(0.25, 0.20, { trouble: 42, struggle: 4 }),
        S(0.88, 0.40, { trouble: 42.4, struggle: 4 }),
        S(0.60, 0.25, { trouble: 42.8, struggle: 4 }),
        S(0.45, 0.65, { trouble: 43.2, struggle: 4 }),
        S(0.12, 0.45, { trouble: 43.5, struggle: 4 }),
      ],
    },
  ];

  // ---------------- Endless summer ----------------
  // A long, seeded day at the beach: swimmers arrive and leave, trouble comes faster as the day goes on, the Captain
  // drops by every half minute or so. Three swimmers lost and the shift is over.
  function endless(seed) {
    let n = (seed >>> 0) || 1;
    const rnd = () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
    const sw = [];
    const kinds = ['swimmer', 'swimmer', 'swimmer', 'treader', 'treader', 'floater'];
    // regulars who never get in trouble keep the water busy
    for (let i = 0; i < 5; i++) sw.push({ kind: kinds[i], x: 0.1 + 0.8 * rnd(), y: 0.15 + 0.6 * rnd(), leave: 30 + 60 * rnd() });
    let t = 2;
    while (t < 900) {
      const pace = Math.max(1.8, 7 - t / 45);            // seconds between incidents, shrinking through the day
      const silent = t > 25 && rnd() < Math.min(0.4, 0.12 + t / 600);
      const x = 0.08 + 0.84 * rnd(), y = 0.1 + 0.65 * rnd();
      const enter = Math.max(0, t - 4 - 6 * rnd());
      if (silent) sw.push({ kind: 'silent', x, y, enter, trouble: t, drown: Math.max(3.5, 6 - t / 120) });
      else sw.push({ kind: 'swimmer', x, y, enter, trouble: t, struggle: Math.max(2.5, 6 - t / 90), drown: Math.max(3.5, 5.5 - t / 150) });
      // a calm swimmer arrives now and then, to be quiet and fine
      if (rnd() < 0.45) sw.push({ kind: kinds[Math.floor(rnd() * kinds.length)], x: 0.08 + 0.84 * rnd(), y: 0.12 + 0.65 * rnd(), enter: t, leave: t + 15 + 30 * rnd() });
      t += pace * (0.6 + 0.8 * rnd());
    }
    const captain = [];
    for (let c = 30 + 10 * rnd(); c < 900; c += 35 + 15 * rnd()) captain.push(+c.toFixed(1));
    return { id: 'endless', thread: 'endless', name: 'Endless summer', endless: true, lives: 3, length: 1e9, rings: 2, strikes: 3, canCall: true, captain, swimmers: sw, seed };
  }

  // Written by tools/check-levels.js: [points for 2 stars, points for 3 stars], from the solver's own score.
  const STARS = { first: [420, 510], quiet: [430, 530], waving: [440, 540], rush: [1100, 1350], inspect: [590, 720], timing: [630, 770], twice: [890, 1090], clean: [1050, 1290], last: [1720, 2110] };
  for (const L of LEVELS) if (STARS[L.id]) L.stars = STARS[L.id];

  const API = { THREADS, LEVELS, endless };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SWLevels = API;
})(typeof window !== 'undefined' ? window : globalThis);
