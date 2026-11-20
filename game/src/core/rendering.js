// Renderer, camera, sunset sky and light. The sky is a gradient shader
// dome with a real sun disc and a warm glow halo; clouds are soft
// radial-gradient sprites, never hard rectangles.
import * as THREE from 'three';

export function createRendering(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1200);
  camera.position.set(0, 4, 12);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x3a1c3a, 120, 700);

  // Sunset sky dome: deep orange at the horizon through magenta to dusky
  // purple-blue at the zenith, warmest toward the sun in the west.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { sunDir: { value: new THREE.Vector3(-0.85, 0.16, 0.25).normalize() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec3 vDir; uniform vec3 sunDir;
      void main(){
        float h = clamp(vDir.y, -0.05, 1.0);
        vec3 horizon = vec3(1.0, 0.45, 0.16);
        vec3 mid = vec3(0.85, 0.30, 0.42);
        vec3 zenith = vec3(0.23, 0.13, 0.38);
        vec3 col = mix(horizon, mid, smoothstep(0.0, 0.22, h));
        col = mix(col, zenith, smoothstep(0.18, 0.65, h));
        float sunAmt = max(dot(normalize(vDir), sunDir), 0.0);
        col += vec3(1.0, 0.55, 0.2) * pow(sunAmt, 6.0) * 0.55;
        col += vec3(1.0, 0.8, 0.45) * pow(sunAmt, 24.0) * 0.9;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), skyMat));

  // Low sun disc over the water, west, with a soft glow halo sprite.
  const sunDir = new THREE.Vector3(-0.85, 0.14, 0.22).normalize();
  const sunPos = sunDir.clone().multiplyScalar(820);
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(34, 40),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, fog: false }),
  );
  sunDisc.position.copy(sunPos);
  sunDisc.lookAt(0, 0, 0);
  scene.add(sunDisc);

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 256;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 220, 140, 0.9)');
  grad.addColorStop(0.35, 'rgba(255, 150, 70, 0.45)');
  grad.addColorStop(1, 'rgba(255, 120, 50, 0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false }));
  glow.scale.set(340, 340, 1);
  glow.position.copy(sunPos);
  scene.add(glow);

  // Warm key light from the sun direction plus warm bounce so shaded
  // (east-facing) walls read as dark amber, never void black.
  const sun = new THREE.DirectionalLight(0xffb36b, 2.1);
  sun.position.set(-160, 55, 45);
  scene.add(sun);
  const bounce = new THREE.HemisphereLight(0xff9a5c, 0x4a2c4a, 1.15);
  scene.add(bounce);
  const fill = new THREE.DirectionalLight(0xffc090, 0.6);
  fill.position.set(120, 80, -60);
  scene.add(fill);

  // Soft clouds: billboard sprites painted with blurred blobs.
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 256; cloudCanvas.height = 96;
  const cctx = cloudCanvas.getContext('2d');
  const blob = (x, y, r, a) => {
    const g2 = cctx.createRadialGradient(x, y, 1, x, y, r);
    g2.addColorStop(0, `rgba(255, 205, 180, ${a})`);
    g2.addColorStop(1, 'rgba(255, 205, 180, 0)');
    cctx.fillStyle = g2;
    cctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  blob(70, 55, 46, 0.55); blob(120, 45, 58, 0.6); blob(175, 58, 48, 0.55); blob(210, 50, 30, 0.4);
  const cloudTex = new THREE.CanvasTexture(cloudCanvas);
  const clouds = [];
  const cloudSpots = [
    [-420, 150, -320, 260], [180, 190, -420, 300], [-120, 210, 420, 280],
    [420, 160, 260, 240], [-520, 180, 180, 300], [60, 230, -520, 320],
    [-260, 140, 480, 220], [520, 200, -140, 260],
  ];
  for (const [x, y, z, s] of cloudSpots) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.75, depthWrite: false, fog: false }));
    sp.position.set(x, y, z);
    sp.scale.set(s, s * 0.36, 1);
    scene.add(sp);
    clouds.push(sp);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    renderer, camera, scene, sun, clouds,
    update(dt, t) {
      for (const c of clouds) { c.position.x += dt * 0.6; if (c.position.x > 620) c.position.x = -620; }
      glow.material.opacity = 0.9 + Math.sin(t * 0.4) * 0.06;
    },
  };
}

// Rear three-quarter chase camera: low, close, offset to the side, so the
// hero car's flank, sloped hood, raked glass and wheels all read in frame.
// Never dead-centre rear, never high, never far.
export function chaseCamera(camera, carPos, heading, dt, snap = false) {
  const fwd = { x: Math.sin(heading), z: Math.cos(heading) };
  const right = { x: -fwd.z, z: fwd.x };
  // Low, close, offset to the WEST (sunlit) flank: the setting sun lights
  // that side of the car, and the beach stays in the left of the frame.
  const tx = carPos.x - fwd.x * 5.8 - right.x * 3.0;
  const tz = carPos.z - fwd.z * 5.8 - right.z * 3.0;
  const ty = carPos.y + 2.4;
  if (snap) {
    camera.position.set(tx, ty, tz);
  } else {
    const k = 1 - Math.exp(-dt * 7);
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
  }
  camera.lookAt(carPos.x + fwd.x * 7, carPos.y + 1.2, carPos.z + fwd.z * 7);
}
