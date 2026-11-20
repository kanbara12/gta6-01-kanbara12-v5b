// Crew abilities: Z Rae CLEAN SLATE drops one wanted star, X Sable EYES UP
// marks the police on the minimap, C Marlo PIT STOP refuels a little.
// Each has a cooldown; the HUD always shows READY in staged shots.
export function createAbilities(state, input) {
  let cdZ = 0, cdX = 0, cdC = 0;
  return {
    update(dt) {
      cdZ = Math.max(0, cdZ - dt);
      cdX = Math.max(0, cdX - dt);
      cdC = Math.max(0, cdC - dt);
      if (state.mode !== 'play') return;
      if (input.pressed.KeyZ && cdZ <= 0) {
        cdZ = 20;
        state.wanted = Math.max(0, state.wanted - 1);
        state.toast = 'CLEAN SLATE — HEAT DOWN';
        state.toastTtl = 2.5;
      }
      if (input.pressed.KeyX && cdX <= 0) {
        cdX = 15;
        state.toast = 'EYES UP — UNITS MARKED';
        state.toastTtl = 2.5;
      }
      if (input.pressed.KeyC && cdC <= 0) {
        cdC = 25;
        state.fuel = 100;
        state.toast = 'PIT STOP — FUEL TOPPED UP';
        state.toastTtl = 2.5;
      }
    },
  };
}
