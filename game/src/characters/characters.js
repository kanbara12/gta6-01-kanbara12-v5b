// Characters: the player on foot (with a visible pistol in hand), the
// crew, and the yard enemies with health bars.
import * as THREE from 'three';
import { WORLD } from '../world/constants.js';

function makeFigure(shirt, skin, hat = null) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.36), new THREE.MeshLambertMaterial({ color: shirt }));
  body.position.y = 1.05;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), new THREE.MeshLambertMaterial({ color: skin }));
  head.position.y = 1.78;
  g.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), new THREE.MeshLambertMaterial({ color: 0x2a2a33 }));
  legL.position.set(-0.16, 0.35, 0);
  const legR = legL.clone();
  legR.position.x = 0.16;
  g.add(legL, legR);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.16), new THREE.MeshLambertMaterial({ color: shirt }));
  armR.position.set(0.4, 1.1, 0.1);
  g.add(armR);
  const armL = armR.clone();
  armL.position.x = -0.4;
  g.add(armL);
  if (hat) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.12, 10), new THREE.MeshLambertMaterial({ color: hat }));
    h.position.y = 2.0;
    g.add(h);
  }
  return { group: g, legL, legR, armR, armL };
}

export function createCharacters(scene, state) {
  // Player: dark jacket, red cap, pistol held out in the right hand so
  // it reads from the shot camera (gun forward, not occluded by the body).
  const p = makeFigure(0x2a2a33, 0xf5d8b0, 0xc81e2a);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.55), new THREE.MeshLambertMaterial({ color: 0x3a3a4a }));
  gun.position.set(0.42, 1.18, 0.5);
  p.group.add(gun);
  const gunTip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.12), new THREE.MeshPhongMaterial({ color: 0xb8b8c8, shininess: 160 }));
  gunTip.position.set(0.42, 1.18, 0.8);
  p.group.add(gunTip);
  p.group.visible = true;
  scene.add(p.group);
  state.playerPos = new THREE.Vector3(WORLD.playerSpawn[0], 0, WORLD.playerSpawn[1]);
  state.playerHeading = Math.PI;

  // Yard enemies: red crew, health bar floating above each head.
  // Spots sit on the clear southern apron of the lot, south of the
  // stacked containers, so the mission camera has an open sightline
  // to all three — no container between the camera and any enemy.
  const enemies = [];
  const yardSpots = [[128, 146], [136, 152], [140, 146]];
  for (const [x, z] of yardSpots) {
    const e = makeFigure(0x8a2a2a, 0xc89a6a, 0x3a3a3a);
    e.group.position.set(x, 0, z);
    scene.add(e.group);
    const bar = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.14), new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide }));
    const fg = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.1), new THREE.MeshBasicMaterial({ color: 0xff4040, side: THREE.DoubleSide }));
    fg.position.z = 0.01;
    bar.add(bg, fg);
    bar.position.set(x, 2.35, z);
    scene.add(bar);
    enemies.push({ mesh: e.group, bar, barFg: fg, hp: 100, x, z });
  }

  return {
    player: p,
    gun,
    enemies,
    resetYard() {
      for (const e of enemies) {
        e.hp = 100;
        e.mesh.visible = true;
        e.bar.visible = true;
        e.barFg.scale.x = 1;
      }
      state.targetsDown = 0;
    },
    update(dt, t) {
      p.group.position.copy(state.playerPos);
      p.group.rotation.y = state.playerHeading;
      // Walk gait on foot.
      const moving = state.onFoot && (state.walkMove || 0) > 0.1;
      const swing = moving ? Math.sin(t * 9) * 0.55 : 0;
      p.legL.rotation.x = swing;
      p.legR.rotation.x = -swing;
      p.armL.rotation.x = -swing * 0.6;
      // Right arm stays forward holding the pistol while on foot.
      p.armR.rotation.x = state.onFoot ? -1.1 : 0;
      p.group.visible = state.onFoot;
      for (const e of enemies) {
        e.bar.position.set(e.mesh.position.x, 2.35 + Math.sin(t * 2 + e.x) * 0.05, e.mesh.position.z);
        e.bar.lookAt(state.playerPos.x, 2.35, state.playerPos.z);
      }
    },
  };
}
