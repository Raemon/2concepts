// STILL WATER sound: a small WebAudio synth. No files. Everything is quiet until the reader turns sound on.
const SWAudio = (() => {
  let ac = null, master = null, on = false, sea = null;
  function ensure() {
    if (ac) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      return true;
    } catch (e) { return false; }
  }
  function noiseBuffer(secs) {
    const b = ac.createBuffer(1, Math.floor(ac.sampleRate * secs), ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function tone(type, f0, f1, dur, vol, delay) {
    const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
    return o;
  }
  function noise(dur, f0, f1, vol, q, delay) {
    const t = ac.currentTime + (delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuffer(dur + 0.05); f.type = 'bandpass'; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  function startSea() {
    if (sea || !ac) return;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    s.buffer = noiseBuffer(4); s.loop = true; f.type = 'lowpass'; f.frequency.value = 520;
    g.gain.value = 0.05; lfo.frequency.value = 0.12; lg.gain.value = 0.035;
    lfo.connect(lg); lg.connect(g.gain); s.connect(f); f.connect(g); g.connect(master);
    s.start(); lfo.start(); sea = { s, lfo };
  }
  function stopSea() { if (!sea) return; try { sea.s.stop(); sea.lfo.stop(); } catch (e) {} sea = null; }

  const sounds = {
    throw() { noise(0.25, 600, 2400, 0.12, 0.8); },
    splash() { noise(0.35, 1800, 300, 0.25, 0.7); },
    catch() { tone('sine', 520, 780, 0.12, 0.12); tone('sine', 780, 1040, 0.14, 0.1, 0.09); },
    saved() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, 0, 0.18, 0.12, i * 0.07)); },
    quietSave() { [392, 523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, 0, 0.22, 0.13, i * 0.06)); },
    help() { tone('sawtooth', 700, 520, 0.16, 0.03); },
    whistle() {
      const o = tone('square', 2350, 0, 0.32, 0.05);
      try { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 38; lg.gain.value = 180; l.connect(lg); lg.connect(o.frequency); l.start(); l.stop(ac.currentTime + 0.35); } catch (e) {}
    },
    flag() { tone('sine', 330, 300, 0.25, 0.08); tone('sine', 330, 300, 0.25, 0.08, 0.28); },
    lost() { tone('sine', 330, 110, 1.1, 0.16); },
    radio() { noise(0.18, 3000, 3000, 0.06, 2); tone('square', 880, 0, 0.08, 0.05, 0.2); tone('square', 1175, 0, 0.1, 0.05, 0.3); },
    horn() { tone('square', 392, 0, 0.16, 0.06); tone('square', 392, 0, 0.22, 0.06, 0.22); },
    strike() { tone('sawtooth', 150, 110, 0.5, 0.12); },
    star() { tone('sine', 1047, 0, 0.4, 0.1); tone('sine', 1568, 0, 0.5, 0.07, 0.1); },
    stamp() { noise(0.12, 200, 120, 0.4, 0.5); tone('sine', 90, 60, 0.18, 0.2); },
    win() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone('triangle', f, 0, 0.22, 0.12, i * 0.11)); },
    fail() { [392, 330, 262].forEach((f, i) => tone('triangle', f, 0, 0.3, 0.12, i * 0.18)); },
    tick() { tone('sine', 1200, 0, 0.04, 0.04); },
  };
  return {
    get on() { return on; },
    setOn(v) {
      on = !!v;
      if (on && ensure()) { try { ac.resume(); } catch (e) {} startSea(); } else stopSea();
    },
    play(name) { if (!on || !ensure() || !sounds[name]) return; try { sounds[name](); } catch (e) {} },
  };
})();
