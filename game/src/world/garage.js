// Garage: drive the HEATLINE GT in to repaint, drop the heat and refuel.
import * as THREE from 'three';
import { WORLD } from './constants.js';

export function createGarage(scene, state) {
  const group = new THREE.Group();
  const shed = new THREE.Mesh(
    new THREE.BoxGeometry(12, 5, 10),
    new THREE.MeshLambertMaterial({ color: 0x3a4a5a }),
  );
  shed.position.y = 2.5;
  group.add(shed);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(9.5, 2.2, 4),
    new THREE.MeshLambertMaterial({ color: 0xd8384a }),
  );
  roof.position.y = 6.1;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(7, 3.6, 0.2),
    new THREE.MeshBasicMaterial({ color: 0xffd76a }),
  );
  door.position.set(0, 1.8, 5.05);
  group.add(door);
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 256; signCanvas.height = 48;
  const sctx = signCanvas.getContext('2d');
  sctx.fillStyle = '#1a1020';
  sctx.fillRect(0, 0, 256, 48);
  sctx.fillStyle = '#ffd76a';
  sctx.font = 'bold 26px Arial';
  sctx.textAlign = 'center';
  sctx.fillText('HEATLINE GARAGE', 128, 34);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 1.5),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas) }),
  );
  sign.position.set(0, 5.4, 5.1);
  group.add(sign);
  group.position.set(WORLD.garage[0], 0, WORLD.garage[1]);
  scene.add(group);
  let cd = 0;
  return {
    update(dt) {
      cd -= dt;
      if (cd > 0 || !state.inCar || state.mode !== 'play') return;
      const d = Math.hypot(state.carPos.x - WORLD.garage[0], state.carPos.z - WORLD.garage[1]);
      if (d < 9 && state.wanted > 0) {
        cd = 5;
        state.wanted = 0;
        state.heat = 0;
        state.fuel = 100;
        state.cond = 100;
        state.toast = 'REPAINT DONE — HEAT GONE';
        state.toastTtl = 3;
      }
    },
  };
}
