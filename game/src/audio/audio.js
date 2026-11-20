// Synthesised audio only: WebAudio oscillators and noise, no samples,
// no files, no network. Engine hum, tires, footsteps, gunfire, impacts,
// UI blips. M mutes.
export function createAudio(state) {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { ctx = null; return; }
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 60;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    engineOsc.connect(lp);
    lp.connect(engineGain);
    engineGain.connect(ctx.destination);
    engineOsc.start();
  }

  function blip(freq, dur, vol, type = 'square') {
    if (!ctx || state.muted) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  function noise(dur, vol) {
    if (!ctx || state.muted) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  return {
    ensure,
    update() {
      if (!ctx) return;
      if (state.muted) { engineGain.gain.value = 0; return; }
      if (state.inCar) {
        engineGain.gain.value = 0.03 + Math.min(0.05, state.carSpeed * 0.001);
        engineOsc.frequency.value = 55 + state.carSpeed * 2.2;
      } else {
        engineGain.gain.value = 0;
      }
      if (state.firing) noise(0.12, 0.25);
    },
    gunshot() { noise(0.12, 0.3); },
    pickup() { blip(880, 0.12, 0.12, 'sine'); blip(1320, 0.18, 0.1, 'sine'); },
    mission() { blip(523, 0.15, 0.12, 'sine'); blip(784, 0.25, 0.12, 'sine'); },
  };
}
