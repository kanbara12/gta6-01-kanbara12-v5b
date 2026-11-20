// Vehicle models. The HEATLINE GT is built to read as a sports coupe
// from the rear three-quarter camera: sloped hood, raked glass, flared
// arches over real wheels, spoiler on mounts, twin exhausts, driver.
import * as THREE from 'three';

function box(w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshPhongMaterial({ color, shininess: opts.shininess ?? 40, specular: opts.specular ?? 0x333333 }),
  );
  m.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  return m;
}

export function buildHeroCar() {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhongMaterial({ color: 0xc81e2a, shininess: 140, specular: 0xff8877 });
  // Glass is bright, reflective AND see-through, so the raked panes
  // catch the sunset and the driver reads through them.
  const glass = new THREE.MeshPhongMaterial({ color: 0x3a5a7a, shininess: 240, specular: 0xffcc88, transparent: true, opacity: 0.72 });

  // Low body + LONG sloped hood (-0.22 rad), clearly lower than the
  // roofline, with the nose dropping toward the bumper.
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.6), paint);
  body.position.y = 0.62;
  car.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 1.9), paint);
  hood.position.set(0, 0.80, 1.45);
  hood.rotation.x = -0.22;
  car.add(hood);
  // Front bumper + grille band below the hood.
  car.add(box(1.9, 0.3, 0.35, 0x1a1a22, { y: 0.38, z: 2.28 }));
  car.add(box(1.5, 0.12, 0.06, 0x888899, { y: 0.55, z: 2.44 }));
  // Cabin set back from the nose, lower and sleeker, raked glass (-0.62 rad).
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 1.9), paint);
  cabin.position.set(0, 1.08, -0.3);
  car.add(cabin);
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95), glass);
  windshield.position.set(0, 1.14, 0.58);
  windshield.rotation.x = -0.62;
  car.add(windshield);
  const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), glass);
  rearGlass.position.set(0, 1.14, -1.28);
  rearGlass.rotation.x = 0.62;
  rearGlass.rotation.y = Math.PI;
  car.add(rearGlass);
  // Side windows, both flanks, taller so the cabin reads as glass.
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.5), glass);
    w.position.set(s * 0.82, 1.1, -0.3);
    w.rotation.y = s * Math.PI / 2;
    car.add(w);
  }
  // Flared wheel arches (torus segments) over real wheels with BIG
  // bright rims — the old small rims read as black discs.
  const archMat = new THREE.MeshPhongMaterial({ color: 0x8a0f18, shininess: 100 });
  const wheels = [];
  for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.10, 8, 12, Math.PI), archMat);
    arch.position.set(wx, 0.52, wz);
    arch.rotation.y = Math.PI / 2;
    car.add(arch);
    const wheel = new THREE.Group();
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14),
      new THREE.MeshLambertMaterial({ color: 0x14141a }),
    );
    tire.rotation.z = Math.PI / 2;
    wheel.add(tire);
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.30, 0.30, 0.32, 10),
      new THREE.MeshPhongMaterial({ color: 0xe8e8f0, shininess: 200 }),
    );
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);
    wheel.position.set(wx, 0.42, wz);
    car.add(wheel);
    wheels.push(wheel);
  }
  // Rear spoiler: a real wing on tall mounts with end plates, angled
  // slightly — not a flat board flush with the roof.
  car.add(box(0.12, 0.42, 0.12, 0x1a1a22, { x: -0.6, y: 1.12, z: -2.2 }));
  car.add(box(0.12, 0.42, 0.12, 0x1a1a22, { x: 0.6, y: 1.12, z: -2.2 }));
  const wing = box(1.9, 0.07, 0.55, 0x8a0f18, { y: 1.36, z: -2.28 });
  wing.material = paint;
  wing.rotation.x = -0.10;
  car.add(wing);
  for (const s of [-1, 1]) {
    car.add(box(0.06, 0.24, 0.5, 0x8a0f18, { x: s * 0.92, y: 1.32, z: -2.28 }));
  }
  // Twin exhausts: small, dark, tucked under the bumper — the old fat
  // beige cylinders read as logs hanging off the car.
  for (const s of [-1, 1]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8), new THREE.MeshPhongMaterial({ color: 0x555566, shininess: 160 }));
    ex.rotation.x = Math.PI / 2;
    ex.position.set(s * 0.5, 0.36, -2.32);
    car.add(ex);
  }
  // Emissive brake lights: one full-width light bar that glows red,
  // brighter when braking — the old pink squares read as flat paint.
  const brakeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const brakeBar = box(1.7, 0.12, 0.06, 0xff2222, { y: 0.86, z: -2.33 });
  brakeBar.material = brakeMat;
  car.add(brakeBar);
  // Headlights.
  car.add(box(0.4, 0.12, 0.06, 0xfff2b0, { x: -0.6, y: 0.62, z: 2.32 }));
  car.add(box(0.4, 0.12, 0.06, 0xfff2b0, { x: 0.6, y: 0.62, z: 2.32 }));
  // Driver: red helmet with a dark visor + blue torso, seated on the
  // camera (west) side, helmet + shoulders clear of the roofline so the
  // driver reads from the 3/4 camera instead of a bare beige ball.
  const driver = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.3), new THREE.MeshLambertMaterial({ color: 0x2a4a8a }));
  torso.position.y = 1.22;
  driver.add(torso);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshLambertMaterial({ color: 0xd8384a }));
  helmet.position.y = 1.62;
  driver.add(helmet);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.12), new THREE.MeshLambertMaterial({ color: 0x111122 }));
  visor.position.set(0, 1.62, 0.20);
  driver.add(visor);
  driver.position.set(0.35, 0, -0.3);
  car.add(driver);
  car.userData = { wheels, brakeMat, driver };
  return car;
}

export function buildTrafficCar(color) {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhongMaterial({ color, shininess: 90, specular: 0x555555 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 4.2), paint);
  body.position.y = 0.6;
  car.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.0), new THREE.MeshPhongMaterial({ color: 0x223044, shininess: 160 }));
  cab.position.set(0, 1.15, -0.2);
  car.add(cab);
  const wheels = [];
  for (const [wx, wz] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]]) {
    const wg = new THREE.Group();
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10), new THREE.MeshLambertMaterial({ color: 0x14141a }));
    w.rotation.z = Math.PI / 2;
    wg.add(w);
    wg.position.set(wx, 0.38, wz);
    car.add(wg);
    wheels.push(wg);
  }
  // Headlights on at dusk.
  const hl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.08), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  hl.position.set(0, 0.6, 2.12);
  car.add(hl);
  car.userData = { wheels };
  return car;
}

export function buildPoliceCar() {
  const car = buildTrafficCar(0x1a1a22);
  // White doors + light bar.
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.4, 1.6), new THREE.MeshLambertMaterial({ color: 0xf5ead6 }));
  door.position.set(0, 0.62, 0);
  car.add(door);
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.3), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
  barR.position.set(-0.4, 1.5, -0.2);
  const barB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.3), new THREE.MeshBasicMaterial({ color: 0x2a6aff }));
  barB.position.set(0.4, 1.5, -0.2);
  car.add(barR, barB);
  car.userData.lightBar = [barR, barB];
  return car;
}

export function buildHeli() {
  const heli = new THREE.Group();
  // Lighter slate-blue body so it reads against the dusk sky — the old
  // near-black body was a featureless box in every chase frame.
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0x5a6a85, shininess: 80 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 5.2), bodyMat);
  heli.add(body);
  // White cheatline + red tail band so the body reads against the sky.
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.45, 5.25), new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }));
  stripe.position.y = 0.35;
  heli.add(stripe);
  const tailBand = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 0.6), new THREE.MeshLambertMaterial({ color: 0xd8384a }));
  tailBand.position.set(0, 0.4, -5.6);
  heli.add(tailBand);
  // Big glass cabin up front — bright blue, reflective, unmistakable.
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 2.4), new THREE.MeshPhongMaterial({ color: 0x6a9ac8, shininess: 220, specular: 0xffcc88 }));
  cabin.position.set(0, 0.25, 2.3);
  heli.add(cabin);
  // Tail boom + fin + tail rotor + skids, all readable at chase distance.
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7.5, 8), bodyMat);
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 0.4, -5.9);
  heli.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.7, 1.3), new THREE.MeshLambertMaterial({ color: 0xd8384a }));
  fin.position.set(0, 1.1, -8.8);
  heli.add(fin);
  const tailRotor = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.1), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
    b.rotation.z = (i / 2) * Math.PI;
    tailRotor.add(b);
  }
  tailRotor.position.set(0.5, 0.6, -9.0);
  tailRotor.rotation.y = Math.PI / 2;
  heli.add(tailRotor);
  for (const s of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 4.6), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    skid.position.set(s * 1.1, -1.5, 0.4);
    heli.add(skid);
    for (const sz of [1.4, -0.6]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.14), new THREE.MeshLambertMaterial({ color: 0x888899 }));
      strut.position.set(s * 1.1, -1.1, sz);
      heli.add(strut);
    }
  }
  // Nav lights: red port, green starboard, white tail strobe.
  const navL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
  navL.position.set(-1.35, 0.2, 1.5);
  heli.add(navL);
  const navR = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2aff66 }));
  navR.position.set(1.35, 0.2, 1.5);
  heli.add(navR);
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  strobe.position.set(0, 0.4, -9.2);
  heli.add(strobe);
  // Main rotor: two lighter blades + a denser translucent blur disc, so
  // the spinning rotor reads as a disc, not hard black bars.
  const rotor = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 11), new THREE.MeshLambertMaterial({ color: 0x666666 }));
    blade.rotation.y = (i / 2) * Math.PI;
    rotor.add(blade);
  }
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(6.0, 28),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  disc.rotation.x = -Math.PI / 2;
  rotor.add(disc);
  rotor.position.y = 1.7;
  heli.add(rotor);
  // Spotlight cone: a soft volume (wide, faint), not a hard triangle.
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, 26, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  cone.position.y = -13;
  heli.add(cone);
  heli.userData = { rotor, tailRotor, cone };
  return heli;
}

// Bright elliptical light pool, placed on the road under the heli.
export function buildLightPool() {
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(2.8, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(1, 1.6, 1);
  return pool;
}
