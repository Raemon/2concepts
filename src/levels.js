// HUSH level data.
// flowers: kind 'fold' (opens with thirst, closes again as it wilts) or 'mono' (keeps opening until it dies),
//          t = starting thirst 0..9, rate = breaths per thirst point, offset = phase of that rhythm.
// gusts:   at breath `at`, flower `f` gains `amount` thirst (glass shelters it).
// visits:  the Owl's patrol; at breath `at` it sets off for flower `f` and inspects it one breath later.
// hidden:  flowers whose past is fogged; alternatives lists every hidden thirst the player must allow for.
(function (root) {
  'use strict';
  const F = (t, rate, offset = 0) => ({ kind: 'fold', t, rate, offset });
  const M = (t, rate, offset = 0) => ({ kind: 'mono', t, rate, offset });

  const LEVELS = [
    // ---------- Thread 1: Thirst (the fold-back signal) ----------
    { id: 't1', thread: 0, name: 'Water', tutorial: true,
      hint: 'Tap an open flower to water it.',
      length: 16, water: { start: 2, max: 2, regen: 3 }, owl: false, stars: [1, 2],
      flowers: [F(3, 3, 0), F(4, 3, 1), F(2, 3, 2)], gusts: [], visits: [] },
    { id: 't2', thread: 0, name: 'Gust',
      hint: 'Watch the wind.',
      lose: 'The gust pushed it past its peak. It closed because it was wilting.',
      length: 16, water: { start: 1, max: 1, regen: 5 }, owl: false, stars: [1, 1],
      flowers: [F(2, 3, 0), F(5, 3, 1), F(4, 3, 2)], gusts: [{ at: 3, f: 1, amount: 4 }], visits: [] },
    { id: 't3', thread: 0, name: 'Wilting',
      hint: 'Read the smoke.',
      lose: 'It was closing on its own. Nobody had watered it: it was wilting.',
      length: 20, water: { start: 1, max: 2, regen: 4 }, owl: false, stars: [1, 2],
      flowers: [F(4, 3, 0), F(8, 3, 1), F(3, 3, 2)], gusts: [], visits: [] },
    { id: 't4', thread: 0, name: 'Listen',
      hint: 'One of these buds is dying.',
      lose: 'Water one and watch: a dying bud opens when helped.',
      length: 14, water: { start: 1, max: 2, regen: 3 }, owl: false, stars: [1, 2],
      flowers: [F(1, 4, 0), F(1, 4, 1), F(3, 3, 2)], gusts: [], visits: [],
      hidden: [0, 1], alternatives: [{ 0: 1, 1: 9 }, { 0: 9, 1: 1 }] },
    { id: 't5', thread: 0, name: 'Storm',
      hint: 'Quiet is not the same as calm.',
      lose: 'A closed flower after a gust is the most urgent one.',
      length: 26, water: { start: 2, max: 2, regen: 4 }, owl: false, stars: [1, 2],
      flowers: [F(2, 3, 0), F(3, 3, 1), F(4, 3, 2), F(1, 3, 0), F(3, 3, 1)],
      gusts: [{ at: 4, f: 2, amount: 4 }, { at: 11, f: 0, amount: 4 }, { at: 17, f: 4, amount: 4 }], visits: [] },

    // ---------- Thread 2: The Owl (refractory-check capture), daisies that only open wider ----------
    { id: 'o1', thread: 1, name: 'Inspection',
      hint: 'Drag the Owl to a flower that looks fine.',
      lose: 'Send the Owl somewhere you look good, and it can’t be where you look bad.',
      length: 16, water: { start: 0, max: 2, regen: 3 }, owl: true, stars: [2, 4],
      flowers: [M(7, 3, 0), M(2, 3, 1), M(3, 3, 2)], gusts: [], visits: [{ at: 1, f: 0 }, { at: 9, f: 2 }] },
    { id: 'o2', thread: 1, name: 'Clean first',
      hint: 'A pass earns glass. Glass stops the frost.',
      lose: 'Water it, then call the Owl. Passing buys glass before the frost.',
      length: 16, water: { start: 1, max: 1, regen: 6 }, owl: true, stars: [2, 3],
      flowers: [M(6, 3, 0), M(2, 3, 1), M(3, 4, 2)], gusts: [{ at: 4, f: 0, amount: 8 }], visits: [] },
    { id: 'o3', thread: 1, name: 'Busy owl',
      hint: 'A busy Owl misses its rounds.',
      lose: 'Keep the Owl busy with flowers that pass.',
      length: 20, water: { start: 0, max: 2, regen: 4 }, owl: true, stars: [3, 5],
      flowers: [M(5, 3, 0), M(6, 3, 1), M(2, 3, 2), M(3, 3, 0)], gusts: [], visits: [{ at: 1, f: 1 }, { at: 4, f: 0 }, { at: 12, f: 3 }] },
    { id: 'o4', thread: 1, name: 'Shelter',
      hint: 'Glass shelters. Glass also shuts out water.',
      lose: 'Under glass a flower still gets thirsty.',
      length: 20, water: { start: 0, max: 1, regen: 4 }, owl: true, stars: [2, 4],
      flowers: [M(3, 3, 0), M(4, 3, 1), M(4, 3, 2)], gusts: [{ at: 4, f: 1, amount: 5 }], visits: [{ at: 8, f: 2 }, { at: 14, f: 1 }] },

    // ---------- Thread 3: Glass (certified collapse) ----------
    { id: 'g1', thread: 2, name: 'Clean bill',
      hint: 'The Owl only reads the bloom.',
      lose: 'It passed because it was wilting. The glass sealed it away from water.',
      length: 18, water: { start: 0, max: 2, regen: 4 }, owl: true, stars: [2, 3],
      flowers: [F(2, 3, 0), F(8, 3, 0), F(3, 3, 2)], gusts: [], visits: [{ at: 2, f: 1 }, { at: 10, f: 2 }] },
    { id: 'g2', thread: 2, name: 'Getting better looks worse',
      hint: 'A wilting flower opens when you save it.',
      lose: 'Saving it made it open, so the Owl saw distress. Keep the Owl busy while it recovers.',
      length: 18, water: { start: 0, max: 1, regen: 4 }, owl: true, stars: [2, 3],
      flowers: [F(2, 3, 0), F(4, 3, 1), F(3, 3, 2)], gusts: [{ at: 3, f: 1, amount: 4 }], visits: [{ at: 5, f: 1 }, { at: 12, f: 2 }] },
    { id: 'g3', thread: 2, name: 'Certificates',
      hint: 'Collect glass. Carefully.',
      lose: 'A quiet flower passed and died under glass. That certificate was a symptom.',
      length: 22, water: { start: 1, max: 2, regen: 4 }, owl: true, stars: [3, 5],
      flowers: [F(3, 3, 0), F(8, 3, 1), F(3, 3, 2), F(5, 3, 0)], gusts: [{ at: 11, f: 2, amount: 4 }], visits: [{ at: 3, f: 3 }, { at: 12, f: 2 }] },
    { id: 'g4', thread: 2, name: 'The quiet ones',
      hint: 'The quietest flowers worry the Owl least.',
      lose: 'The Owl passes the quiet ones. Some of them are the worst off.',
      length: 26, water: { start: 1, max: 2, regen: 4 }, owl: true, stars: [3, 5],
      flowers: [F(2, 3, 0), F(8, 3, 1), F(4, 3, 2), F(3, 3, 0), F(1, 3, 1)], gusts: [{ at: 8, f: 3, amount: 4 }, { at: 13, f: 0, amount: 4 }],
      visits: [{ at: 3, f: 1 }, { at: 11, f: 3 }, { at: 19, f: 2 }] },
  ];

  const THREADS = ['Thirst', 'The Owl', 'Glass'];
  const API = { LEVELS, THREADS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.HUSH_LEVELS = API;
})(typeof window !== 'undefined' ? window : globalThis);
