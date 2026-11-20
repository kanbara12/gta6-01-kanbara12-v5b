// Procedural canvas textures. Everything is painted at runtime — no
// image files, no network. Deterministic per seed so ?seed=1 is stable.
import * as THREE from 'three';

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Building facade: warm base with a grid of windows, most lit amber.
export function buildingTexture(seed, base = '#3a2a33') {
  const rnd = mulberry(seed);
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = base;
  x.fillRect(0, 0, 128, 256);
  for (let r = 0; r < 14; r++) {
    for (let col = 0; col < 6; col++) {
      const lit = rnd() < 0.62;
      x.fillStyle = lit ? (rnd() < 0.8 ? '#ffcf7a' : '#ffe9b0') : '#14101c';
      x.fillRect(8 + col * 20, 10 + r * 17, 12, 9);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function roadTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#23202a';
  x.fillRect(0, 0, 128, 256);
  x.fillStyle = '#c8b060';
  x.fillRect(62, 0, 4, 256);
  x.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 8; i++) x.fillRect(14, i * 32 + 6, 3, 18);
  for (let i = 0; i < 8; i++) x.fillRect(111, i * 32 + 6, 3, 18);
  // Subtle wet-look sheen streaks from the sunset.
  x.fillStyle = 'rgba(255, 170, 90, 0.08)';
  x.fillRect(30, 0, 20, 256);
  x.fillRect(84, 0, 14, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function sandTexture() {
  const rnd = mulberry(77);
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#c9a86a';
  x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = rnd() < 0.5 ? 'rgba(120, 90, 50, 0.25)' : 'rgba(255, 230, 170, 0.25)';
    x.fillRect(rnd() * 128, rnd() * 128, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function waterTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, '#2a4a7a');
  g.addColorStop(0.5, '#e8703a');
  g.addColorStop(1, '#7a3a6a');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  x.strokeStyle = 'rgba(255, 220, 170, 0.35)';
  x.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    x.beginPath();
    const y = i * 18 + 8;
    for (let px = 0; px <= 256; px += 16) x.lineTo(px, y + Math.sin(px * 0.06 + i) * 4);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
