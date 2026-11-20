// Boardwalk kiosks: roof, sign board, warm interior light, awning, counter.
import * as THREE from 'three';

const NAMES = ['TACO TIDE', 'SUNSET SODA', 'PIER FRIES', 'CORAL CONES', 'BOARDWALK BAIT', 'NEON NACHOS'];

export function createBoardwalk(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const kiosks = [];
  for (let i = 0; i < 6; i++) {
    const z = -150 + i * 58;
    const k = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(5, 3.2, 4),
      new THREE.MeshLambertMaterial({ color: [0x7a4a5a, 0x4a6a7a, 0x8a6a3a, 0x5a7a4a, 0x7a3a6a, 0x3a5a8a][i] }),
    );
    body.position.y = 1.6;
    k.add(body);
    // Pitched roof, not a flat slab.
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(4.2, 1.8, 4),
      new THREE.MeshLambertMaterial({ color: 0xd8384a }),
    );
    roof.position.y = 4.1;
    roof.rotation.y = Math.PI / 4;
    k.add(roof);
    // Warm interior light strip + awning + counter.
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.9, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xffd76a }),
    );
    glow.position.set(0, 2.0, 2.05);
    k.add(glow);
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.18, 1.8),
      new THREE.MeshLambertMaterial({ color: 0xf5ead6 }),
    );
    awning.position.set(0, 2.9, 2.6);
    awning.rotation.x = 0.28;
    k.add(awning);
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 1.0, 0.7),
      new THREE.MeshLambertMaterial({ color: 0x6a4a30 }),
    );
    counter.position.set(0, 0.5, 2.5);
    k.add(counter);
    // Sign board with a short name.
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256; signCanvas.height = 48;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#1a1020';
    sctx.fillRect(0, 0, 256, 48);
    sctx.fillStyle = '#ffd76a';
    sctx.font = 'bold 26px Arial';
    sctx.textAlign = 'center';
    sctx.fillText(NAMES[i], 128, 34);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 0.9),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas) }),
    );
    sign.position.set(0, 3.6, 2.12);
    k.add(sign);
    k.position.set(-10, 0, z);
    group.add(k);
    kiosks.push(k);
  }
  return { group, kiosks };
}
