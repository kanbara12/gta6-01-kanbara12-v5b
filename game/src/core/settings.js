// Quality presets: one call, applied once at boot.
export function applyQuality(renderer, level) {
  const dpr = Math.min(window.devicePixelRatio || 1, level === 'high' ? 2 : 1.25);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = false;
}
