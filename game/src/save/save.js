// Save / load through localStorage. Progress only — no network.
import { ECONOMY } from '../core/config.js';

const KEY = 'suncoast-heatline-save-v5';

export function createSave() {
  return {
    save(state) {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          money: state.money,
          missionIndex: state.missionIndex,
          jobsDone: state.jobsDone,
          wanted: state.wanted,
          hp: state.hp,
          fuel: state.fuel,
          cond: state.cond,
          driftEarned: state.driftEarned,
          targetsDown: state.targetsDown,
        }));
      } catch { /* storage unavailable — play continues */ }
    },
    load(state) {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        state.money = d.money ?? ECONOMY.startCash;
        state.missionIndex = d.missionIndex ?? 0;
        state.jobsDone = d.jobsDone ?? 0;
        state.wanted = d.wanted ?? 0;
        state.hp = d.hp ?? 100;
        state.fuel = d.fuel ?? 100;
        state.cond = d.cond ?? 100;
        state.driftEarned = d.driftEarned ?? 0;
        state.targetsDown = d.targetsDown ?? 0;
        state.toast = 'SAVE LOADED';
        state.toastTtl = 2;
      } catch { /* corrupt save — ignore */ }
    },
  };
}
