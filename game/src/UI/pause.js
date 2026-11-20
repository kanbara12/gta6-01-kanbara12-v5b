// Pause menu (P / Esc): stats card with RESUME / SAVE / LOAD.
import { fmtMoney, repFor } from '../core/config.js';

export function createPause(state, saveApi) {
  const menu = document.getElementById('pauseMenu');
  const stats = document.getElementById('pauseStats');
  function render() {
    const rep = repFor(state.jobsDone, state.loopComplete);
    const stars = '★'.repeat(state.wanted) + '☆'.repeat(5 - state.wanted);
    stats.innerHTML =
      `Money <b>${fmtMoney(state.money)}</b> &nbsp;•&nbsp; Jobs done <b>${state.jobsDone}</b> &nbsp;•&nbsp; Stage <b>${Math.min(state.missionIndex + 1, 8)}/8</b><br>` +
      `Targets down <b>${state.targetsDown}</b> &nbsp;•&nbsp; Drift earnings <b>$${state.driftEarned}</b> &nbsp;•&nbsp; REP <b>${rep}</b><br>` +
      `Fuel <b>${Math.round(state.fuel)}%</b> &nbsp;•&nbsp; Wanted <b>${stars}</b> &nbsp;•&nbsp; Health <b>${Math.round(state.hp)}%</b>`;
  }
  return {
    open() {
      state.mode = 'paused';
      render();
      menu.style.display = 'flex';
    },
    close() {
      state.mode = 'play';
      menu.style.display = 'none';
    },
    bind(api) {
      document.getElementById('btnResume').addEventListener('click', () => this.close());
      document.getElementById('btnSave').addEventListener('click', () => { api.save(state); state.toast = 'SAVED'; state.toastTtl = 2; });
      document.getElementById('btnLoad').addEventListener('click', () => { api.load(state); this.close(); });
    },
  };
}
