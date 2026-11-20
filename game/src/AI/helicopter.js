// SKY-1: the police helicopter. Large in chase frames, orbits the player
// at wanted 3+, spotlight cone + bright pool tracking the hero car.
import * as THREE from 'three';
import { buildHeli, buildLightPool } from '../vehicles/models.js';

export function createHelicopter(scene, state) {
  const mesh = buildHeli();
  scene.add(mesh);
  mesh.visible = false;
  const pool = buildLightPool();
  scene.add(pool);
  pool.visible = false;
  // Spotlight cone lives in the scene (not parented to the heli) so it
  // can aim from the heli down at the light pool on the road.
  const cone = mesh.userData.cone;
  mesh.remove(cone);
  scene.add(cone);
  cone.visible = false;
  const up = new THREE.Vector3(0, 1, 0);
  let angle = 0.6;
  let dist = 42;

  function aimCone(from, to, t) {
    pool.position.set(to.x, 0.07, to.z);
    pool.material.opacity = 0.4 + Math.sin(t * 3) * 0.1;
    const dir = to.clone().sub(from);
    const len = dir.length();
    dir.normalize();
    cone.position.copy(from).add(to).multiplyScalar(0.5);
    cone.scale.set(1, len / 26, 1);
    cone.quaternion.setFromUnitVectors(up, dir.clone().negate());
  }

  return {
    mesh, pool,
    get dist() { return Math.round(dist); },
    update(dt, t) {
      const wantHeli = state.wanted >= 3 || state.shot === 'play' || state.shot === 'chase';
      if (!wantHeli) { mesh.visible = false; pool.visible = false; cone.visible = false; return; }
      mesh.visible = true;
      pool.visible = true;
      cone.visible = true;
      const target = state.inCar ? state.carPos : state.playerPos;
      // In staged chase frames the heli sits at a fixed offset: ahead and
      // to the west over the beach, close enough to read LARGE (rotor disc
      // ~22% of frame width) and low enough that the rotor stays inside
      // the frame, high enough to read as sky. Never behind a building
      // (open beach to the west), never clipped at the top.
      if (state.shot === 'play' || state.shot === 'chase') {
        angle = 0;
        dist = 36;
        mesh.scale.setScalar(1.4);
        // West of the car, over the beach: the body reads against open
        // sky and ocean, NEVER stacked on the ferris wheel (which sits
        // east of the road, right of frame). Low (y 8) so it sits below
        // the palm fronds and above the road, against the open horizon —
        // at y 12 it hid behind the fronds at the top-left. Far west
        // (-16) so it clears the sun disc too.
        mesh.position.set(target.x - 16, 8, target.z - 32);
        mesh.rotation.y = Math.atan2(target.x - mesh.position.x, target.z - mesh.position.z);
        mesh.userData.rotor.rotation.y += dt * 22;
        mesh.userData.tailRotor.rotation.x += dt * 30;
        // Pool lands on the road just ahead of the car, so the cone
        // leans forward away from the chase camera instead of washing
        // the lens.
        const poolX = target.x + Math.sin(state.carHeading) * 8 + Math.sin(t * 0.5) * 2;
        const poolZ = target.z + Math.cos(state.carHeading) * 8 + Math.cos(t * 0.5) * 2;
        aimCone(mesh.position.clone(), new THREE.Vector3(poolX, 0.1, poolZ), t);
        return;
      }
      angle += dt * 0.12;
      dist = 46;
      mesh.scale.setScalar(1);
      const hx = target.x + Math.cos(angle) * dist;
      const hz = target.z + Math.sin(angle) * dist - 14;
      mesh.position.set(hx, 26, hz);
      mesh.rotation.y = Math.atan2(target.x - hx, target.z - hz);
      mesh.userData.rotor.rotation.y += dt * 22;
      mesh.userData.tailRotor.rotation.x += dt * 30;
      // Pool lands on the road at the car; the cone aims from the heli
      // down at the pool, sweeping slowly.
      const poolX = target.x + Math.sin(t * 0.5) * 2;
      const poolZ = target.z + Math.cos(t * 0.5) * 2;
      aimCone(new THREE.Vector3(hx, 26, hz), new THREE.Vector3(poolX, 0.1, poolZ), t);
    },
  };
}
