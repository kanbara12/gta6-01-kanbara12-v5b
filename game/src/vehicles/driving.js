// Arcade driving: acceleration, braking, steering, drift with tire
// smoke and floating payouts, near-miss bonuses. Cruise mode holds a
// set speed for staged screenshots.
import * as THREE from 'three';
import { ECONOMY } from '../core/config.js';
import { hitsBuilding } from '../world/world.js';

export function createDriving(scene, state, traffic) {
  const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.4 });
  const smokes = [];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), smokeMat.clone());
    s.visible = false;
    scene.add(s);
    smokes.push({ mesh: s, ttl: 0 });
  }
  let smokeIdx = 0;
  let driftChain = 0;
  let driftTimer = 0;
  let nearMissCd = 0;

  function puff(x, y, z) {
    const s = smokes[smokeIdx];
    smokeIdx = (smokeIdx + 1) % smokes.length;
    s.mesh.position.set(x, y, z);
    s.mesh.visible = true;
    s.ttl = 0.9;
    s.mesh.scale.setScalar(0.6);
  }

  function popup(text) {
    state.popups.push({ text, ttl: 2.4 });
    if (state.popups.length > 3) state.popups.shift();
  }

  return {
    update(dt, input) {
      const maxSpeed = 55; // m/s ≈ 198 km/h
      if (state.cruise) {
        // Staged shot: hold the exact table speed, straight along the road.
        const target = (state.cruiseSpeed * 1000) / 3600;
        state.carSpeed += (target - state.carSpeed) * Math.min(1, dt * 6);
        const fwdX = Math.sin(state.carHeading);
        const fwdZ = Math.cos(state.carHeading);
        state.carPos.x += fwdX * state.carSpeed * dt;
        state.carPos.z += fwdZ * state.carSpeed * dt;
        state.speedKmh = Math.round(state.carSpeed * 3.6);
        if (state.carSpeed > 30) {
          driftChain = 3;
          driftTimer = 2.4;
        }
        return;
      }
      if (!state.inCar) { state.speedKmh = 0; return; }
      const ax = input.axis();
      const braking = input.keys.Space;
      const drifting = input.keys.ShiftLeft || input.keys.ShiftRight;
      if (ax.y > 0) state.carSpeed += 22 * dt;
      if (ax.y < 0) state.carSpeed -= 16 * dt;
      if (braking) state.carSpeed -= 34 * dt;
      if (ax.y === 0 && !braking) state.carSpeed -= 6 * dt;
      state.carSpeed = Math.max(0, Math.min(maxSpeed, state.carSpeed));
      const steer = ax.x * (drifting ? 1.5 : 1.0) * Math.min(1, state.carSpeed / 12 + 0.25);
      state.carHeading -= steer * dt * 1.9 * (state.carSpeed / 10 + 0.2);
      const fwdX = Math.sin(state.carHeading);
      const fwdZ = Math.cos(state.carHeading);
      const nx = state.carPos.x + fwdX * state.carSpeed * dt;
      const nz = state.carPos.z + fwdZ * state.carSpeed * dt;
      // Building collision: slide, never drive through a building.
      if (!hitsBuilding(nx, state.carPos.z)) state.carPos.x = nx;
      else state.carSpeed *= 0.6;
      if (!hitsBuilding(state.carPos.x, nz)) state.carPos.z = nz;
      else state.carSpeed *= 0.6;
      state.carPos.x = Math.max(-240, Math.min(210, state.carPos.x));
      state.carPos.z = Math.max(-230, Math.min(230, state.carPos.z));
      state.speedKmh = Math.round(state.carSpeed * 3.6);
      state.fuel = Math.max(0, state.fuel - dt * state.carSpeed * 0.004);

      // Drift: hard steer at speed, tire smoke + floating payout.
      if (drifting && state.carSpeed > 18) {
        driftTimer += dt;
        puff(state.carPos.x - fwdX * 2 + (Math.random() - 0.5), 0.4, state.carPos.z - fwdZ * 2);
        if (driftTimer > 1.2) {
          driftTimer = 0;
          driftChain = Math.min(5, driftChain + 1);
          const pay = ECONOMY.driftValue;
          state.money += pay;
          state.driftEarned += pay;
          popup(`DRIFT x${driftChain} +$${pay}`);
        }
      } else {
        driftTimer = 0;
        driftChain = Math.max(0, driftChain - dt * 0.4);
      }
      // Near miss: a traffic car passes within 2.5 m while fast.
      nearMissCd -= dt;
      if (nearMissCd <= 0 && traffic) {
        for (const t of traffic.cars) {
          const d = Math.hypot(t.mesh.position.x - state.carPos.x, t.mesh.position.z - state.carPos.z);
          if (d < 2.6 && d > 0.4 && state.carSpeed > 20) {
            nearMissCd = 2;
            state.money += ECONOMY.nearMissValue;
            popup(`NEAR MISS +$${ECONOMY.nearMissValue}`);
            break;
          }
        }
      }
      for (const s of smokes) {
        if (s.ttl > 0) {
          s.ttl -= dt;
          s.mesh.scale.addScalar(dt * 1.6);
          s.mesh.material.opacity = Math.max(0, s.ttl * 0.45);
          if (s.ttl <= 0) s.mesh.visible = false;
        }
      }
    },
  };
}
