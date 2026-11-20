// Suncoast itself: ocean, beach, boardwalk, 188+ buildings, palms,
// ferris wheel, lighthouse and pier. All procedural, all offline.
import * as THREE from 'three';
import { WORLD, BUILDINGS } from './constants.js';
import { buildingTexture, roadTexture, sandTexture, waterTexture } from './textures.js';

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(scene) {
  const rnd = mulberry(20261120);
  const group = new THREE.Group();
  scene.add(group);
  const animated = { water: null, foam: null, wheel: null, sunStreak: null };

  // Base ground: city slab.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(560, 560),
    new THREE.MeshLambertMaterial({ color: 0x4a3a4a }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.05, 0);
  group.add(ground);

  // Ocean: animated sunset water, west of the shore.
  const waterTex = waterTexture();
  waterTex.repeat.set(6, 6);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 560),
    new THREE.MeshPhongMaterial({ map: waterTex, shininess: 120, specular: 0xffb36b }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(-160, 0.0, 0);
  group.add(water);
  animated.water = waterTex;

  // Sun glitter streak on the water, pointing at the low sun.
  const streak = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 190),
    new THREE.MeshBasicMaterial({ color: 0xffc06a, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  streak.rotation.x = -Math.PI / 2;
  streak.position.set(-120, 0.06, 10);
  group.add(streak);
  animated.sunStreak = streak;

  // Foam line where the waves meet the sand.
  const foam = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 560),
    new THREE.MeshBasicMaterial({ color: 0xfff2d8, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(-63, 0.08, 0);
  group.add(foam);
  animated.foam = foam;

  // Sand strip.
  const sandTex = sandTexture();
  sandTex.repeat.set(4, 30);
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 560),
    new THREE.MeshLambertMaterial({ map: sandTex }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(-49, 0.02, 0);
  group.add(sand);

  // Roads: Beachfront Rd (north-south) + cross avenues.
  const roadTex = roadTexture();
  const mkRoad = (x, z, w, len, rotZ = 0) => {
    const t = roadTex.clone();
    t.needsUpdate = true;
    t.repeat.set(w / 10, len / 40);
    const r = new THREE.Mesh(
      new THREE.PlaneGeometry(w, len),
      new THREE.MeshPhongMaterial({ map: t, shininess: 60, specular: 0x664422 }),
    );
    r.rotation.x = -Math.PI / 2;
    r.rotation.z = rotZ;
    r.position.set(x, 0.04, z);
    group.add(r);
  };
  mkRoad(WORLD.beachRoadX, 0, 11, 440);
  mkRoad(40, 0, 10, 440);
  mkRoad(110, 0, 10, 440);
  mkRoad(0, -100, 10, 260, Math.PI / 2);
  mkRoad(0, 40, 10, 260, Math.PI / 2);
  mkRoad(0, 120, 10, 260, Math.PI / 2);

  // Sidewalk / boardwalk strip between road and kiosks.
  const walk = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 440),
    new THREE.MeshLambertMaterial({ color: 0x8a6a52 }),
  );
  walk.rotation.x = -Math.PI / 2;
  walk.position.set(-15, 0.03, 0);
  group.add(walk);

  // ---- Buildings: 188+, varied heights, footprints and palettes ----
  const bases = ['#3a2a33', '#40304a', '#2e3444', '#4a2f2a', '#33263a', '#2a3a3a', '#44352e'];
  const clearOfLandmarks = (x, z) =>
    Math.hypot(x - WORLD.yard[0], z - WORLD.yard[1]) >= 30 &&
    Math.hypot(x - WORLD.garage[0], z - WORLD.garage[1]) >= 15 &&
    Math.hypot(x - WORLD.safehouse[0], z - WORLD.safehouse[1]) >= 13;
  const facadeTex = [];
  for (let i = 0; i < 7; i++) facadeTex.push(buildingTexture(1000 + i * 37, bases[i]));
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x241a20 });
  let count = 0;
  const blocks = [];
  for (let gx = 0; gx < 5; gx++) {
    for (let gz = 0; gz < 9; gz++) {
      const bx = 8 + gx * 38;
      const bz = -200 + gz * 48;
      const n = 3 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) {
        const w = 9 + rnd() * 12;
        const d = 9 + rnd() * 12;
        const h = 9 + rnd() * rnd() * 62;
        const x = bx + (rnd() - 0.5) * 22;
        const z = bz + (rnd() - 0.5) * 28;
        if (x > 195 || z > 215 || z < -215) continue;
        // Keep the industrial yard lot clear for containers and the sweep.
        if (!clearOfLandmarks(x, z)) continue;
        blocks.push({ x, z, w, d, h });
        count++;
      }
    }
  }
  // A few tall towers on the skyline so the city reads from the beach.
  for (let i = 0; i < 12; i++) {
    const tx = 30 + rnd() * 140, tz = -190 + rnd() * 380;
    if (!clearOfLandmarks(tx, tz)) continue;
    blocks.push({ x: tx, z: tz, w: 14 + rnd() * 8, d: 14 + rnd() * 8, h: 55 + rnd() * 35 });
    count++;
  }
  for (const b of blocks) {
    const ti = Math.floor(rnd() * facadeTex.length);
    const mat = new THREE.MeshLambertMaterial({
      map: facadeTex[ti],
      emissive: 0xffc06a,
      emissiveMap: facadeTex[ti],
      emissiveIntensity: 0.38,
    });
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
    m.position.set(b.x, b.h / 2, b.z);
    group.add(m);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.6, 0.8, b.d + 0.6), roofMat);
    roof.position.set(b.x, b.h + 0.4, b.z);
    group.add(roof);
    BUILDINGS.push({ x: b.x, z: b.z, hw: b.w / 2 + 1, hd: b.d / 2 + 1 });
    // Rooftop sign on some towers.
    if (b.h > 45 && rnd() < 0.5) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(6, 1.6, 0.4),
        new THREE.MeshBasicMaterial({ color: rnd() < 0.5 ? 0xff5e7a : 0x7dffc8 }),
      );
      sign.position.set(b.x, b.h + 1.6, b.z + b.d / 2 + 0.3);
      group.add(sign);
    }
  }
  const buildingCount = count;

  // ---- Palms: trunk + 6-9 drooping fronds, never flat discs ----
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2e });
  const frondMats = [0x2e7a3a, 0x3a8a44, 0x276832].map((c) => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
  const frondGeo = new THREE.PlaneGeometry(0.9, 4.6, 1, 3);
  // Droop the frond tip downward by bending its vertices.
  {
    const pos = frondGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + 2.3) / 4.6;
      pos.setZ(i, -Math.pow(t, 2) * 1.7);
    }
    frondGeo.computeVertexNormals();
  }
  const palms = [];
  const palmSpots = [];
  for (let z = -210; z <= 210; z += 14) {
    palmSpots.push([-32.5, z + (rnd() - 0.5) * 4]);
    if (rnd() < 0.6) palmSpots.push([-19.5, z + 7 + (rnd() - 0.5) * 4]);
    if (rnd() < 0.4) palmSpots.push([2, z + (rnd() - 0.5) * 6]);
  }
  for (const [x, z] of palmSpots) {
    const h = 5.5 + rnd() * 2.5;
    const lean = (rnd() - 0.5) * 0.16;
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, h, 6), trunkMat);
    trunk.position.y = h / 2;
    trunk.rotation.z = lean;
    palm.add(trunk);
    const fronds = 6 + Math.floor(rnd() * 4);
    const fm = frondMats[Math.floor(rnd() * frondMats.length)];
    for (let f = 0; f < fronds; f++) {
      const fr = new THREE.Mesh(frondGeo, fm);
      const a = (f / fronds) * Math.PI * 2 + rnd() * 0.4;
      fr.position.set(Math.sin(lean) * h * 0.9, h, 0);
      fr.rotation.order = 'YXZ';
      fr.rotation.y = a;
      fr.rotation.x = -0.5 - rnd() * 0.45;
      fr.translateY(2.0);
      palm.add(fr);
    }
    palm.position.set(x, 0, z);
    group.add(palm);
    palms.push(palm);
  }

  // ---- Industrial yard: stacked containers, crates, fencing ----
  {
    const [yx, yz] = WORLD.yard;
    const contColors = [0x8a3a2a, 0x2a5a8a, 0x3a7a4a, 0x8a6a2a, 0x5a3a6a];
    const contSpots = [
      [yx - 12, yz - 8, 0], [yx - 12, yz - 8, 1], [yx - 4, yz - 10, 0],
      [yx + 6, yz - 9, 0], [yx + 6, yz - 9, 1], [yx + 14, yz - 6, 0],
      [yx - 14, yz + 6, 0], [yx + 12, yz + 8, 0], [yx + 12, yz + 8, 1],
      [yx - 2, yz + 10, 0],
    ];
    contSpots.forEach(([cx, cz, level], i) => {
      const c = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2.6, 2.6),
        new THREE.MeshLambertMaterial({ color: contColors[i % contColors.length] }),
      );
      c.position.set(cx, 1.3 + level * 2.6, cz);
      c.rotation.y = (i % 2 === 0) ? 0 : Math.PI / 2;
      group.add(c);
      BUILDINGS.push({ x: cx, z: cz, hw: 3.4, hd: 3.4 });
    });
    for (let i = 0; i < 9; i++) {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.3, 1.3),
        new THREE.MeshLambertMaterial({ color: 0x9a7a4a }),
      );
      crate.position.set(yx - 10 + (i % 3) * 9 + rnd() * 2, 0.65, yz + 2 + Math.floor(i / 3) * 4);
      crate.rotation.y = rnd() * 1.2;
      group.add(crate);
    }
    // Fencing around the lot: posts + two rails.
    const fenceMat = new THREE.MeshLambertMaterial({ color: 0x777788 });
    const fence = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.floor(len / 4);
      for (let i = 0; i <= n; i++) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 6), fenceMat);
        p.position.set(x0 + ((x1 - x0) * i) / n, 1.2, z0 + ((z1 - z0) * i) / n);
        group.add(p);
      }
      for (const y of [0.8, 1.9]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.12), fenceMat);
        rail.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
        rail.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
        group.add(rail);
      }
    };
    fence(yx - 18, yz - 13, yx + 18, yz - 13);
    fence(yx - 18, yz + 13, yx + 18, yz + 13);
    fence(yx - 18, yz - 13, yx - 18, yz + 13);
    fence(yx + 18, yz - 13, yx + 18, yz + 13);
  }

  // ---- Ferris wheel: rim, spokes, gondolas, legs; slowly turning ----
  const wheel = new THREE.Group();
  const rimMat = new THREE.MeshLambertMaterial({ color: 0xd8384a });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(17, 0.7, 8, 40), rimMat);
  wheel.add(rim);
  const spokeMat = new THREE.MeshLambertMaterial({ color: 0xf5ead6 });
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 34, 6), spokeMat);
    sp.rotation.z = (i / 8) * Math.PI;
    wheel.add(sp);
  }
  const gondolaMat = new THREE.MeshLambertMaterial({ color: 0xffd76a });
  const gondolas = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 1.6), gondolaMat);
    const a = (i / 10) * Math.PI * 2;
    g.position.set(Math.cos(a) * 17, Math.sin(a) * 17, 0);
    wheel.add(g);
    gondolas.push(g);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.4, 10), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x888899 });
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.0, 26, 6), legMat);
    leg.position.set(s * 7, -13, 0);
    leg.rotation.z = s * 0.28;
    wheel.add(leg);
  }
  wheel.position.set(WORLD.ferrisWheel[0], 26, WORLD.ferrisWheel[1]);
  wheel.rotation.y = Math.PI / 2; // face the beach road
  group.add(wheel);
  animated.wheel = wheel;

  // ---- Lighthouse at the north end of the beach road ----
  const lh = new THREE.Group();
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 4.4, 34, 12),
    new THREE.MeshLambertMaterial({ color: 0xf5ead6 }),
  );
  tower.position.y = 17;
  lh.add(tower);
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(3.7, 3.7, 4, 12),
    new THREE.MeshLambertMaterial({ color: 0xd8384a }),
  );
  band.position.y = 24;
  lh.add(band);
  const lamp = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 3.4, 10),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
  );
  lamp.position.y = 35.5;
  lh.add(lamp);
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(2.8, 2.6, 10),
    new THREE.MeshLambertMaterial({ color: 0x2a2a3a }),
  );
  cap.position.y = 38.4;
  lh.add(cap);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 6, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.set(30, 35.5, 0);
  lh.add(beam);
  lh.position.set(WORLD.lighthouse[0], 0, WORLD.lighthouse[1]);
  group.add(lh);

  // ---- Pier reaching into the ocean ----
  const pier = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 70), new THREE.MeshLambertMaterial({ color: 0x7a5a3a }));
  deck.position.y = 1.2;
  pier.add(deck);
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 6), new THREE.MeshLambertMaterial({ color: 0x5a4028 }));
    p.position.set(-3.4, 0, -30 + i * 9);
    pier.add(p);
    const p2 = p.clone();
    p2.position.x = 3.4;
    pier.add(p2);
  }
  const pierLight = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd76a }));
  pierLight.position.set(0, 3.4, -34);
  pier.add(pierLight);
  pier.position.set(WORLD.pier[0], 0, WORLD.pier[1]);
  group.add(pier);

  // ---- Marina docks (south end) ----
  const marina = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const dock = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 26), new THREE.MeshLambertMaterial({ color: 0x6a4a30 }));
    dock.position.set(-52 + i * 7, 0.8, 185);
    marina.add(dock);
    const boat = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 9), new THREE.MeshPhongMaterial({ color: 0xf5ead6, shininess: 80 }));
    boat.position.set(-52 + i * 7, 0.9, 172);
    marina.add(boat);
  }
  group.add(marina);

  return {
    group, animated, buildingCount,
    update(dt, t) {
      waterTex.offset.y = t * 0.008;
      waterTex.offset.x = t * 0.003;
      foam.material.opacity = 0.42 + Math.sin(t * 1.4) * 0.14;
      streak.material.opacity = 0.22 + Math.sin(t * 0.9) * 0.07;
      wheel.rotation.z += dt * 0.12;
      for (const g of gondolas) g.rotation.z = -wheel.rotation.z;
    },
  };
}

// Point-inside-building test for police collision avoidance.
export function hitsBuilding(x, z) {
  for (const b of BUILDINGS) {
    if (Math.abs(x - b.x) < b.hw && Math.abs(z - b.z) < b.hd) return true;
  }
  return false;
}
