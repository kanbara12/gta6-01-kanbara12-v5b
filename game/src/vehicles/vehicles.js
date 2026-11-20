// The hero car: spawn, enter/exit, syncing the mesh to the state.
import * as THREE from 'three';
import { WORLD } from '../world/constants.js';
import { buildHeroCar } from './models.js';

export function createHeroCar(scene, state) {
  const mesh = buildHeroCar();
  scene.add(mesh);
  state.carPos = new THREE.Vector3(WORLD.carSpawn[0], 0, WORLD.carSpawn[1]);
  state.carHeading = Math.PI; // facing north (-Z) along Beachfront Rd
  state.carSpeed = 0;
  mesh.position.copy(state.carPos);
  mesh.rotation.y = state.carHeading;
  return {
    mesh,
    reset() {
      state.carPos.set(WORLD.carSpawn[0], 0, WORLD.carSpawn[1]);
      state.carHeading = Math.PI;
      state.carSpeed = 0;
      mesh.position.copy(state.carPos);
      mesh.rotation.y = state.carHeading;
    },
    sync() {
      mesh.position.copy(state.carPos);
      mesh.rotation.y = state.carHeading;
      // Wheels spin with speed; brake lights flare when braking.
      const spin = state.carSpeed * 0.016 * 2.4;
      for (const w of mesh.userData.wheels) w.rotation.x += spin;
      mesh.userData.brakeMat.color.setHex(0xff2a2a);
    },
  };
}

// E near the car: get in. E while driving: get out on foot.
export function tryEnterExit(state, input) {
  if (!input.pressed.KeyE) return;
  if (state.inCar) {
    state.inCar = false;
    state.onFoot = true;
    state.playerPos.copy(state.carPos);
    state.playerPos.x += 2.2;
    state.playerHeading = state.carHeading;
    return;
  }
  const d = state.playerPos.distanceTo(state.carPos);
  if (d < 4.5) {
    state.inCar = true;
    state.onFoot = false;
    state.toast = 'HEATLINE GT — YOURS NOW';
    state.toastTtl = 2.5;
  }
}
