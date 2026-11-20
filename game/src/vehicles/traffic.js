// 18 traffic cars looping the avenues, varied colours, headlights on.
import * as THREE from 'three';
import { buildTrafficCar } from './models.js';

const COLORS = [0x3a6a8a, 0x8a8a3a, 0x6a3a5a, 0x4a4a4a, 0x7a2a2a, 0x2a7a5a, 0x8a6a2a, 0x5a5a7a, 0xc8c8c8, 0x2a2a3a];
const LANES = [
  { x: -28.5, z0: -200, z1: 200, dir: -1 }, { x: -23.5, z0: -200, z1: 200, dir: 1 },
  { x: 37.5, z0: -200, z1: 200, dir: -1 }, { x: 42.5, z0: -200, z1: 200, dir: 1 },
  { x: 107.5, z0: -200, z1: 200, dir: -1 }, { x: 112.5, z0: -200, z1: 200, dir: 1 },
  { z: -102.5, x0: -20, x1: 190, dir: 1 }, { z: -97.5, x0: -20, x1: 190, dir: -1 },
  { z: 37.5, x0: -20, x1: 190, dir: -1 }, { z: 42.5, x0: -20, x1: 190, dir: 1 },
];

export function createTraffic(scene, seed = 1) {
  const cars = [];
  let s = seed * 12345 + 7;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = 0; i < 18; i++) {
    const lane = LANES[i % LANES.length];
    const mesh = buildTrafficCar(COLORS[i % COLORS.length]);
    scene.add(mesh);
    const vertical = lane.x !== undefined;
    const pos = vertical
      ? { x: lane.x, z: lane.z0 + rnd() * (lane.z1 - lane.z0) }
      : { x: lane.x0 + rnd() * (lane.x1 - lane.x0), z: lane.z };
    mesh.position.set(pos.x, 0, pos.z);
    const heading = vertical ? (lane.dir < 0 ? Math.PI : 0) : (lane.dir < 0 ? Math.PI / 2 : -Math.PI / 2);
    mesh.rotation.y = heading;
    cars.push({ mesh, lane, vertical, speed: 7 + rnd() * 5, heading });
  }
  return {
    cars,
    update(dt) {
      // Move along the lane direction; wrap at the ends.
      for (const c of cars) {
        if (c.vertical) {
          c.mesh.position.z += (c.lane.dir < 0 ? -1 : 1) * c.speed * dt;
          if (c.mesh.position.z < -205) c.mesh.position.z = 205;
          if (c.mesh.position.z > 205) c.mesh.position.z = -205;
        } else {
          c.mesh.position.x += (c.lane.dir < 0 ? -1 : 1) * c.speed * dt;
          if (c.mesh.position.x < -25) c.mesh.position.x = 195;
          if (c.mesh.position.x > 195) c.mesh.position.x = -25;
        }
        for (const w of c.mesh.userData.wheels) w.rotation.x += c.speed * dt * 2.4;
      }
    },
  };
}
