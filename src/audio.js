// Tiny WebAudio synth for HUSH. Starts on the first gesture; every call is safe if audio is unavailable.
(function (root) {
  'use strict';
  let ac = null, master = null, muted = false;
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return; }
    try {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
    } catch (e) { ac = null; }
  }
  function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.5; }

  function tone(freq, dur, { type = 'sine', vol = 0.2, attack = 0.005, glide = 0, delay = 0 } = {}) {
    if (!ac || muted) return;
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * glide), t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, { vol = 0.1, freq = 800, q = 0.7, delay = 0 } = {}) {
    if (!ac || muted) return;
    const t0 = ac.currentTime + delay;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master); src.start(t0);
  }
  const note = (i, base = 392) => base * Math.pow(2, PENTA[Math.max(0, Math.min(PENTA.length - 1, i))] / 12);

  const S = {
    unlock, setMuted, get muted() { return muted; },
    water() { tone(note(4, 523), 0.18, { vol: 0.12 }); tone(note(7, 523), 0.25, { vol: 0.08, delay: 0.05 }); },
    revive() { [0, 2, 4, 6].forEach((k, j) => tone(note(k + 2, 523), 0.35, { vol: 0.1, delay: j * 0.06 })); },
    calm() { tone(note(2, 392), 0.3, { vol: 0.08 }); },
    breath(level) { tone(110 + level * 4, 0.12, { vol: 0.012, type: 'triangle' }); },
    gust() { noise(0.6, { vol: 0.18, freq: 500, q: 0.5 }); },
    hoot() { tone(392, 0.22, { vol: 0.12, glide: 0.85 }); tone(330, 0.4, { vol: 0.12, glide: 0.8, delay: 0.25 }); },
    pass() { tone(1568, 0.6, { vol: 0.07, type: 'triangle' }); tone(2093, 0.5, { vol: 0.04, delay: 0.04 }); },
    caught() { tone(220, 0.35, { vol: 0.16, type: 'sawtooth', glide: 0.7 }); },
    death() { tone(196, 0.8, { vol: 0.14, glide: 0.5 }); },
    scandal() { noise(0.25, { vol: 0.25, freq: 3000, q: 1.5 }); tone(147, 1.0, { vol: 0.16, type: 'sawtooth', glide: 0.6, delay: 0.1 }); },
    dawn() { [0, 2, 4, 5, 7].forEach((k, j) => tone(note(k, 392), 0.7, { vol: 0.08, delay: j * 0.12 })); },
    select() { tone(660, 0.08, { vol: 0.06 }); },
  };
  root.HushAudio = S;
})(typeof window !== 'undefined' ? window : globalThis);
