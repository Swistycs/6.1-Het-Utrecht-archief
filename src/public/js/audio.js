let ctx = null;
let master = null;
let ambient = null;
let enabled = true;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.8 : 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noiseBuffer(seconds, brown = false) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.5;
    } else {
      d[i] = white;
    }
  }
  return buf;
}

function envGain(t, attack, hold, release, peak) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  return g;
}

function noiseHit(t, { freq, q = 1, type = 'lowpass', attack = 0.005, hold = 0, release = 0.15, peak = 0.5, sweepTo }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(attack + hold + release + 0.05);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + attack + hold + release);
  f.Q.value = q;
  const g = envGain(t, attack, hold, release, peak);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

function tone(t, { freq, type = 'sine', attack = 0.005, release = 1.2, peak = 0.3 }) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = envGain(t, attack, 0, release, peak);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + attack + release + 0.05);
}

const EFFECTS = {
  water(t) {
    noiseHit(t, { freq: 1800, sweepTo: 250, attack: 0.01, release: 0.6, peak: 0.6 });
    noiseHit(t + 0.12, { freq: 900, type: 'bandpass', q: 3, sweepTo: 300, attack: 0.02, release: 0.5, peak: 0.25 });
  },
  voetstappen(t) {
    for (let i = 0; i < 4; i++) {
      noiseHit(t + i * 0.42, { freq: 700, q: 0.8, attack: 0.004, release: 0.09, peak: 0.55 });
      noiseHit(t + i * 0.42 + 0.03, { freq: 2500, type: 'highpass', attack: 0.002, release: 0.04, peak: 0.08 });
    }
  },
  paard(t) {
    const pattern = [0, 0.11, 0.38, 0.49, 0.76, 0.87, 1.14, 1.25];
    pattern.forEach((d, i) => {
      noiseHit(t + d, { freq: i % 2 ? 1400 : 1000, type: 'bandpass', q: 6, attack: 0.002, release: 0.07, peak: 0.7 });
    });
  },
  bel(t) {
    for (let i = 0; i < 3; i++) {
      const s = t + i * 0.32;
      tone(s, { freq: 1320, release: 0.5, peak: 0.18 });
      tone(s, { freq: 1320 * 2.76, release: 0.25, peak: 0.05 });
    }
  },
  klok(t) {
    [0, 1.6].forEach((d) => {
      tone(t + d, { freq: 220, release: 2.4, peak: 0.28 });
      tone(t + d, { freq: 220 * 2.4, release: 1.4, peak: 0.08 });
      tone(t + d, { freq: 220 * 3, release: 0.9, peak: 0.05 });
    });
  },
};

export function playEffect(name) {
  if (!enabled || !EFFECTS[name] || !ensure()) return;
  EFFECTS[name](ctx.currentTime + 0.05);
}

export function startAmbient() {
  if (!enabled || !ensure() || ambient) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(4, true);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 420;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.18;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain).connect(g.gain);
  src.connect(f).connect(g).connect(master);
  src.start();
  lfo.start();
  ambient = { src, lfo, g };
}

export function stopAmbient() {
  if (!ambient) return;
  const { src, lfo, g } = ambient;
  ambient = null;
  const t = ctx.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(g.gain.value, t);
  g.gain.linearRampToValueAtTime(0, t + 0.8);
  src.stop(t + 0.9);
  lfo.stop(t + 0.9);
}

export function setSoundEnabled(on) {
  enabled = Boolean(on);
  if (master) master.gain.setTargetAtTime(enabled ? 0.8 : 0, ctx.currentTime, 0.05);
  if (!enabled) stopAmbient();
}

export function isSoundEnabled() {
  return enabled;
}

export function unlockAudio() {
  ensure();
}
