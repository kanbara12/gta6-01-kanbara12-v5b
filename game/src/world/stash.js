// Street-cash stashes: glowing green bundles worth $250 each, on foot or
// in the car. Pick one up and it stays gone for the run.
import * as THREE from 'three';
import { ECONOMY } from '../core/config.js';

const SPOTS = [[-20, 90], [44, -20], [100, 60], [-8, -150], [60, 160], [10, -160]];

export function createStashes(scene, state) {
  const items = [];
  for (const [x, z] of SPOTS) {
    const g = new THREE.Group();
    const bundle = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.35, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x2a8a4a }),
    );
    bundle.position.y = 0.4;
    g.add(bundle);
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.12, 0.65),
      new THREE.MeshBasicMaterial({ color: 0xffd76a }),
    );
    band.position.y = 0.42;
    g.add(band);
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 20),
      new THREE.MeshBasicMaterial({ color: 0x7dff9a, transparent: true, opacity: 0.3, depthWrite: false }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.06;
    g.add(glow);
    g.position.set(x, 0, z);
    scene.add(g);
    items.push({ group: g, x, z, taken: false });
  }
  return {
    update(dt, t) {
      if (state.mode !== 'play') return;
      const tgt = state.inCar ? state.carPos : state.playerPos;
      for (const it of items) {
        if (it.taken) continue;
        it.group.rotation.y = t * 0.8;
        const d = Math.hypot(tgt.x - it.x, tgt.z - it.z);
        if (d < 3) {
          it.taken = true;
          it.group.visible = false;
          state.money += ECONOMY.stashValue;
          state.toast = `STREET CASH +$${ECONOMY.stashValue}`;
          state.toastTtl = 2;
        }
      }
    },
  };
}
