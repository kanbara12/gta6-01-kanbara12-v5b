// Crew dialogue: show a CREW line on the dialogue card for a few seconds.
import { CREW } from '../core/config.js';

export function createDialog(state) {
  let ttl = 0;
  return {
    show(key, seconds = 7) {
      state.dialog = CREW[key] || null;
      ttl = seconds;
    },
    update(dt) {
      if (ttl > 0) {
        ttl -= dt;
        if (ttl <= 0) state.dialog = null;
      }
    },
  };
}
