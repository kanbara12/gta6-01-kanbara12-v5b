// Police AI: pursuit, ramming, flanking, roadblocks, building collision
// avoidance, line-of-sight checks (lose sight -> SEARCHING). Each unit
// reports a live callsign, distance and status for the named HUD panel.
import * as THREE from 'three';
import { buildPoliceCar } from '../vehicles/models.js';
import { hitsBuilding } from '../world/world.js';

const CALLSIGNS = ['SNOOK-10', 'SNOOK-11', 'SNOOK-12', 'SNOOK-13', 'SNOOK-14'];

export function createPolice(scene, state) {
  const units = [];
  for (let i = 0; i < 5; i++) {
    const mesh = buildPoliceCar();
    scene.add(mesh);
    mesh.visible = false;
    units.push({
      callsign: CALLSIGNS[i],
      mesh,
      status: 'RESPONDING',
      dist: 0,
      angle: 0,
      speed: 0,
      searchT: 0,
      active: false,
      flashT: 0,
    });
  }

  // Police roadblocks for the staged chase: striped barriers + cones
  // parked across the beach road ahead of the hero car. They ride with
  // the car (shot mode cruises), so they stay ahead in the frame.
  const roadblockGroup = new THREE.Group();
  {
    const orange = new THREE.MeshLambertMaterial({ color: 0xe86a1a });
    const white = new THREE.MeshLambertMaterial({ color: 0xf5ead6 });
    const dark = new THREE.MeshLambertMaterial({ color: 0x2a2a33 });
    for (const [bx, bz] of [[-2.2, 0], [2.2, 0], [0, -7]]) {
      const bar = new THREE.Group();
      const board = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 0.18), orange);
      board.position.y = 0.95;
      bar.add(board);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 0.2), white);
      stripe.position.y = 0.95;
      bar.add(stripe);
      for (const s of [-1.4, 1.4]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.15, 0.7), dark);
        leg.position.set(s, 0.5, 0);
        bar.add(leg);
      }
      bar.position.set(bx, 0, bz);
      roadblockGroup.add(bar);
    }
    for (const [cx, cz] of [[-4.5, 2.5], [-1, 3], [4.5, 2.5], [0, -4.5]]) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 10), orange);
      cone.position.set(cx, 0.45, cz);
      roadblockGroup.add(cone);
    }
  }
  scene.add(roadblockGroup);
  roadblockGroup.visible = false;

  function losClear(from, to) {
    // Line of sight: sample the straight line; a building in between
    // breaks sight (units fall back to SEARCH).
    for (let t = 0.1; t < 1; t += 0.15) {
      const x = from.x + (to.x - from.x) * t;
      const z = from.z + (to.z - from.z) * t;
      if (hitsBuilding(x, z)) return false;
    }
    return true;
  }

  return {
    units,
    update(dt, t) {
      const target = state.inCar ? state.carPos : state.playerPos;
      // Roadblocks only in the staged chase, riding 32 m ahead of the
      // car — close enough to read clearly (at 42 m they were small and
      // half-hidden behind the pursuit units).
      if (state.mode === 'shot' && state.shot === 'chase') {
        roadblockGroup.visible = true;
        roadblockGroup.position.set(target.x, 0, target.z - 32);
      } else {
        roadblockGroup.visible = false;
      }
      // The staged yard sweep is a closed fight: no police cars drive
      // into the lot mid-frame. The HUD line still reads SEARCHING.
      if (state.mode === 'shot' && state.shot === 'mission') {
        for (const u of units) { u.active = false; u.mesh.visible = false; }
        return;
      }
      // Staged shots hold a fixed pursuit formation around the hero car
      // so the units are IN the frame with live distances + statuses.
      if (state.mode === 'shot' && state.shotFormation) {
        units.forEach((u, i) => {
          const f = state.shotFormation[i];
          if (!f) { u.active = false; u.mesh.visible = false; return; }
          u.active = true;
          u.mesh.visible = true;
          u.mesh.position.set(target.x + f[0], 0, target.z + f[1]);
          u.mesh.rotation.y = state.carHeading;
          u.dist = Math.round(Math.hypot(f[0], f[1]));
          u.status = f[2];
          u.flashT += dt;
          const on = Math.floor(u.flashT * 6) % 2 === 0;
          if (u.mesh.userData.lightBar) {
            u.mesh.userData.lightBar[0].material.color.setHex(on ? 0xff2a2a : 0x551111);
            u.mesh.userData.lightBar[1].material.color.setHex(on ? 0x111155 : 0x2a6aff);
          }
        });
        return;
      }
      const wanted = state.wanted;
      const wantActive = wanted > 0 ? Math.min(5, 2 + wanted) : 0;
      const roadblock = wanted >= 4;
      units.forEach((u, i) => {
        const shouldBeActive = i < wantActive || (state.shot === 'play' && i < state.shotPolice) || (state.shot === 'chase' && i < state.shotPolice);
        if (!shouldBeActive) { u.active = false; u.mesh.visible = false; return; }
        if (!u.active) {
          u.active = true;
          u.mesh.visible = true;
          // Spawn on the road near the player, never inside a building.
          const behind = state.carHeading;
          u.mesh.position.set(
            target.x - Math.sin(behind) * (10 + i * 7) + (i % 2 === 0 ? -4 : 4),
            0,
            target.z - Math.cos(behind) * (10 + i * 7),
          );
          u.speed = 10;
        }
        const dx = target.x - u.mesh.position.x;
        const dz = target.z - u.mesh.position.z;
        const dist = Math.hypot(dx, dz);
        u.dist = Math.round(dist);
        const seen = dist < 90 && losClear(u.mesh.position, target);
        if (!seen) {
          u.searchT += dt;
          u.status = 'SEARCHING';
        } else {
          u.searchT = 0;
          if (roadblock && i === 0) u.status = 'ROADBLOCK';
          else if (dist < 8) u.status = 'RAMMING';
          else if (i === 1 && dist < 20) u.status = 'FLANKING';
          else u.status = 'PURSUIT';
        }
        // Steer toward the player; if a building blocks the way ahead,
        // veer around it instead of driving through.
        let desired = Math.atan2(dx, dz);
        const aheadX = u.mesh.position.x + Math.sin(u.mesh.rotation.y) * 8;
        const aheadZ = u.mesh.position.z + Math.cos(u.mesh.rotation.y) * 8;
        if (hitsBuilding(aheadX, aheadZ)) desired += 0.9;
        let diff = desired - u.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        u.mesh.rotation.y += Math.max(-1.6 * dt, Math.min(1.6 * dt, diff));
        const targetSpeed = u.status === 'SEARCHING' ? 7 : Math.min(34, 14 + wanted * 4 + (state.inCar ? state.carSpeed * 0.55 : 0));
        u.speed += (targetSpeed - u.speed) * Math.min(1, dt * 1.2);
        u.mesh.position.x += Math.sin(u.mesh.rotation.y) * u.speed * dt;
        u.mesh.position.z += Math.cos(u.mesh.rotation.y) * u.speed * dt;
        // Police-car steering lean.
        u.mesh.rotation.z = Math.max(-0.06, Math.min(0.06, -diff * 0.05));
        // Light bar flash.
        u.flashT += dt;
        const on = Math.floor(u.flashT * 6) % 2 === 0;
        if (u.mesh.userData.lightBar) {
          u.mesh.userData.lightBar[0].material.color.setHex(on ? 0xff2a2a : 0x551111);
          u.mesh.userData.lightBar[1].material.color.setHex(on ? 0x111155 : 0x2a6aff);
        }
        // Ramming contact: a hard hit costs condition and health.
        if (dist < 3.2 && state.inCar) {
          state.cond = Math.max(20, state.cond - dt * 6);
          state.hp = Math.max(10, state.hp - dt * 3);
        }
      });
    },
  };
}
