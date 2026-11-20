// 20 pedestrians on the sidewalks: walking paths, limb-swing gait,
// scatter away from speeding cars and gunfire, pause toward the player.
import * as THREE from 'three';

const SHIRT = [0xc84a4a, 0x4a8ac8, 0x4ac88a, 0xc8a44a, 0x8a4ac8, 0xc88a4a, 0x4a4a4a, 0xd8d8d8];
const SKIN = [0xf5d8b0, 0xc89a6a, 0x8a5a3a, 0xe8b890];

export function createPedestrians(scene, state) {
  const walkers = [];
  let s = 99;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = 0; i < 20; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.85, 0.32),
      new THREE.MeshLambertMaterial({ color: SHIRT[i % SHIRT.length] }),
    );
    body.position.y = 1.05;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshLambertMaterial({ color: SKIN[i % SKIN.length] }));
    head.position.y = 1.7;
    g.add(head);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), new THREE.MeshLambertMaterial({ color: 0x2a2a33 }));
    legL.position.set(-0.14, 0.35, 0);
    const legR = legL.clone();
    legR.position.x = 0.14;
    g.add(legL, legR);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.14), new THREE.MeshLambertMaterial({ color: SHIRT[i % SHIRT.length] }));
    armL.position.set(-0.36, 1.1, 0);
    const armR = armL.clone();
    armR.position.x = 0.36;
    g.add(armL, armR);
    const lane = i % 2 === 0 ? -31.5 : -19.5;
    const z = -200 + rnd() * 400;
    g.position.set(lane + (rnd() - 0.5) * 2, 0, z);
    scene.add(g);
    walkers.push({
      mesh: g, legL, legR, armL, armR,
      lane, dir: rnd() < 0.5 ? 1 : -1,
      speed: 1.0 + rnd() * 0.7, phase: rnd() * 6, scatter: 0,
    });
  }
  return {
    walkers,
    update(dt, t) {
      const threat = state.inCar ? state.carPos : state.playerPos;
      const threatFast = state.inCar && state.carSpeed > 15;
      const gunfire = state.firing;
      for (const w of walkers) {
        const dx = w.mesh.position.x - threat.x;
        const dz = w.mesh.position.z - threat.z;
        const d = Math.hypot(dx, dz);
        if ((threatFast || gunfire) && d < 12) w.scatter = 2.5;
        if (w.scatter > 0) {
          w.scatter -= dt;
          // Run away from the threat, sideways off the road.
          w.mesh.position.x += (dx / (d || 1)) * dt * 3.2;
          w.mesh.position.z += (dz / (d || 1)) * dt * 3.2;
          w.mesh.rotation.y = Math.atan2(dx, dz);
        } else if (d < 6) {
          // Pause and turn toward the player when close.
          w.mesh.rotation.y = Math.atan2(-dx, -dz);
        } else {
          w.mesh.position.z += w.dir * w.speed * dt;
          if (w.mesh.position.z > 205) w.dir = -1;
          if (w.mesh.position.z < -205) w.dir = 1;
          w.mesh.rotation.y = w.dir > 0 ? 0 : Math.PI;
        }
        // Walking gait: limbs swing, no sliding capsules.
        const swing = Math.sin(t * 5 + w.phase) * (w.scatter > 0 ? 0.9 : 0.5);
        w.legL.rotation.x = swing;
        w.legR.rotation.x = -swing;
        w.armL.rotation.x = -swing * 0.7;
        w.armR.rotation.x = swing * 0.7;
        w.mesh.position.x = Math.max(-33, Math.min(4, w.mesh.position.x));
        w.mesh.position.z = Math.max(-210, Math.min(210, w.mesh.position.z));
      }
    },
  };
}
