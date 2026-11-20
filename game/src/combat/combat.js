// Combat: 4 weapons, yard enemies with health bars, damage, bounties,
// muzzle flash. Crosshair shows only on foot.
import * as THREE from 'three';
import { ECONOMY } from '../core/config.js';

export const WEAPONS = [
  { name: 'PISTOL', damage: 34, rate: 0.28, range: 55 },
  { name: 'SMG', damage: 16, rate: 0.09, range: 45 },
  { name: 'SHOTGUN', damage: 70, rate: 0.8, range: 26 },
  { name: 'BAT', damage: 45, rate: 0.45, range: 2.6 },
];

export function createCombat(scene, state, characters) {
  // Muzzle flash: a bright sprite at the barrel, shown for a few frames.
  const flashCanvas = document.createElement('canvas');
  flashCanvas.width = flashCanvas.height = 64;
  const fctx = flashCanvas.getContext('2d');
  const g = fctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(255, 250, 200, 1)');
  g.addColorStop(0.4, 'rgba(255, 180, 60, 0.8)');
  g.addColorStop(1, 'rgba(255, 120, 0, 0)');
  fctx.fillStyle = g;
  fctx.fillRect(0, 0, 64, 64);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(flashCanvas), transparent: true, depthWrite: false }));
  flash.scale.set(0.9, 0.9, 1);
  flash.visible = false;
  scene.add(flash);
  let flashTtl = 0;
  let cd = 0;
  let autoFireT = 0;

  function shoot(from, dir) {
    const w = WEAPONS[state.weapon];
    cd = w.rate;
    // In staged shots the flash holds longer so the frame catches it.
    flashTtl = state.mode === 'shot' ? 0.9 : 0.09;
    flash.position.copy(from).add(dir.clone().multiplyScalar(1.1));
    flash.position.y = 1.35;
    flash.visible = true;
    // Staged shots fire for the flash only: no damage, no bounty, no
    // kill — the staged cash and TARGETS count must not move.
    if (state.mode === 'shot') return;
    // Hit test against live yard enemies.
    for (const e of characters.enemies) {
      if (e.hp <= 0) continue;
      const toE = new THREE.Vector3(e.mesh.position.x - from.x, 0, e.mesh.position.z - from.z);
      const dist = toE.length();
      if (dist > w.range) continue;
      toE.normalize();
      const dot = toE.dot(dir);
      if (dot > 0.93 || dist < 3) {
        e.hp -= w.damage;
        if (e.hp <= 0) {
          e.hp = 0;
          e.mesh.visible = false;
          e.bar.visible = false;
          state.targetsDown += 1;
          state.money += ECONOMY.yardBounty;
          state.toast = `BOUNTY +$${ECONOMY.yardBounty}`;
          state.toastTtl = 2;
        }
        e.barFg.scale.x = Math.max(0.01, e.hp / 100);
        break;
      }
    }
  }

  return {
    flash,
    update(dt, input) {
      cd -= dt;
      if (flashTtl > 0) { flashTtl -= dt; if (flashTtl <= 0) flash.visible = false; }
      state.firing = false;
      // Weapon select 1-4.
      for (let i = 0; i < 4; i++) {
        if (input.pressed['Digit' + (i + 1)]) state.weapon = i;
      }
      if (!state.onFoot || (state.mode === 'shot' && state.shot !== 'mission')) return;
      // In the staged mission shot the player fires on a slow auto rhythm
      // so a muzzle flash is caught in the frame.
      if (state.mode === 'shot' && state.shot === 'mission') {
        autoFireT -= dt;
        if (autoFireT <= 0 && cd <= 0) {
          autoFireT = 0.8;
          const from = state.playerPos;
          const dir = new THREE.Vector3(Math.sin(state.playerHeading), 0, Math.cos(state.playerHeading));
          state.firing = true;
          shoot(from, dir);
        }
        return;
      }
      if (input.mouseDown && cd <= 0 && state.weapon < 3) {
        const from = state.playerPos;
        const dir = new THREE.Vector3(Math.sin(state.playerHeading), 0, Math.cos(state.playerHeading));
        state.firing = true;
        shoot(from, dir);
      }
    },
  };
}
