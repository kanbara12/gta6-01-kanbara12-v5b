// Safehouse: step inside on foot to heal up.
import * as THREE from 'three';
import { WORLD } from './constants.js';

export function createSafehouse(scene, state) {
  const group = new THREE.Group();
  const house = new THREE.Mesh(
    new THREE.BoxGeometry(9, 4.5, 8),
    new THREE.MeshLambertMaterial({ color: 0x5a3a4a }),
  );
  house.position.y = 2.25;
  group.add(house);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(7.2, 2.0, 4),
    new THREE.MeshLambertMaterial({ color: 0x2a2a3a }),
  );
  roof.position.y = 5.5;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);
  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.0, 0.2),
    new THREE.MeshBasicMaterial({ color: 0xffd76a }),
  );
  lamp.position.set(0, 2.2, 4.05);
  group.add(lamp);
  group.position.set(WORLD.safehouse[0], 0, WORLD.safehouse[1]);
  scene.add(group);
  let cd = 0;
  return {
    update(dt) {
      cd -= dt;
      if (cd > 0 || state.onFoot === false || state.mode !== 'play') return;
      const d = Math.hypot(state.playerPos.x - WORLD.safehouse[0], state.playerPos.z - WORLD.safehouse[1]);
      if (d < 7 && state.hp < 100) {
        cd = 4;
        state.hp = 100;
        state.toast = 'SAFEHOUSE — PATCHED UP';
        state.toastTtl = 2.5;
      }
    },
  };
}
