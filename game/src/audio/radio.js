// Three original synth radio stations. R changes station, M mutes.
// The HUD shows the station name and the current track.
import { } from '../core/config.js';

const STATIONS = [
  { name: 'SHORELINE 96.7', track: 'Sunset Run', base: 110 },
  { name: 'PIER 102.5', track: 'Boardwalk Lights', base: 130 },
  { name: 'DUNE 89.9', track: 'Night Mirage', base: 98 },
];

export function createRadio(state, audio) {
  let ctx = null;
  let osc = null;
  let gain = null;
  let noteT = 0;
  let step = 0;
  const SCALE = [0, 3, 5, 7, 10, 12];

  function ensureCtx() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      osc = ctx.createOscillator();
      osc.type = 'triangle';
      gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
    } catch { ctx = null; }
  }

  return {
    update(dt, input) {
      if (input.pressed.KeyR) {
        state.station = (state.station + 1) % STATIONS.length;
        state.toast = `${STATIONS[state.station].name} • ${STATIONS[state.station].track}`;
        state.toastTtl = 2;
      }
      if (input.pressed.KeyM) {
        state.muted = !state.muted;
        state.toast = state.muted ? 'MUTED' : 'SOUND ON';
        state.toastTtl = 1.5;
      }
      if (state.muted || state.mode === 'title') { if (gain) gain.gain.value = 0; return; }
      ensureCtx();
      if (!ctx || !gain) return;
      noteT -= dt;
      if (noteT <= 0) {
        noteT = 0.22;
        const st = STATIONS[state.station];
        const semis = SCALE[step % SCALE.length];
        osc.frequency.value = st.base * Math.pow(2, semis / 12);
        gain.gain.value = 0.035;
        step++;
      }
    },
  };
}
