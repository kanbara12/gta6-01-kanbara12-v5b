// SUNCOAST: HEATLINE — boot + main loop. Wires every module together.
// Runs fully offline from static files; no network request anywhere.
import * as THREE from 'three';
import { createState } from './config.js';
import { createInput } from './input.js';
import { createRendering, chaseCamera } from './rendering.js';
import { applyQuality } from './settings.js';
import { createWorld } from '../world/world.js';
import { createBoardwalk } from '../world/boardwalk.js';
import { createGarage } from '../world/garage.js';
import { createSafehouse } from '../world/safehouse.js';
import { createStashes } from '../world/stash.js';
import { createHeroCar, tryEnterExit } from '../vehicles/vehicles.js';
import { createDriving } from '../vehicles/driving.js';
import { createTraffic } from '../vehicles/traffic.js';
import { createPolice } from '../AI/police.js';
import { createHelicopter } from '../AI/helicopter.js';
import { createPedestrians } from '../AI/pedestrians.js';
import { createCombat } from '../combat/combat.js';
import { createCharacters } from '../characters/characters.js';
import { createMissions } from '../missions/missions.js';
import { createHud } from '../UI/hud.js';
import { createDialog } from '../UI/dialog.js';
import { createPause } from '../UI/pause.js';
import { createShots, missionCamera, endCamera } from '../UI/shots.js';
import { createAbilities } from '../UI/abilities.js';
import { createAudio } from '../audio/audio.js';
import { createRadio } from '../audio/radio.js';
import { createSave } from '../save/save.js';

const params = new URLSearchParams(window.location.search);
const seed = parseInt(params.get('seed') || '1', 10) || 1;
const shotParam = params.get('shot');

const state = createState();
window.__suncoast = { state, shot: null, version: 'v5' };

const input = createInput();
const { renderer, camera, scene, ...rendering } = createRendering(document.getElementById('game'));
applyQuality(renderer, 'high');

const world = createWorld(scene);
createBoardwalk(scene);
const garage = createGarage(scene, state);
const safehouse = createSafehouse(scene, state);
const stashes = createStashes(scene, state);
const heroCar = createHeroCar(scene, state);
const traffic = createTraffic(scene, seed);
const police = createPolice(scene, state);
const heli = createHelicopter(scene, state);
const pedestrians = createPedestrians(scene, state);
const characters = createCharacters(scene, state);
const combat = createCombat(scene, state, characters);
const missions = createMissions(scene, state);
const driving = createDriving(scene, state, traffic);
const dialog = createDialog(state);
const saveApi = createSave();
const pause = createPause(state, saveApi);
pause.bind(saveApi);
const hud = createHud(state, police, heli);
const shots = createShots(state, dialog);
const abilities = createAbilities(state, input);
const audio = createAudio(state);
const radio = createRadio(state, audio);

// On-foot movement (WASD): A/D turn, W/S walk. Sets walkMove for gait.
function updateOnFoot(dt) {
  if (!state.onFoot || state.mode !== 'play') { state.walkMove = 0; return; }
  const ax = input.axis();
  state.playerHeading -= ax.x * dt * 2.4;
  const speed = 5;
  const fx = Math.sin(state.playerHeading);
  const fz = Math.cos(state.playerHeading);
  state.walkMove = Math.abs(ax.y);
  state.playerPos.x += fx * ax.y * speed * dt;
  state.playerPos.z += fz * ax.y * speed * dt;
  state.playerPos.x = Math.max(-240, Math.min(210, state.playerPos.x));
  state.playerPos.z = Math.max(-230, Math.min(230, state.playerPos.z));
}

function startGame() {
  audio.ensure();
  document.getElementById('startCard').style.display = 'none';
  state.mode = 'play';
  dialog.show('rae', 7);
}

document.getElementById('btnStart').addEventListener('click', startGame);
document.getElementById('btnAgain').addEventListener('click', () => {
  document.getElementById('endCard').style.display = 'none';
  missions.reset();
  heroCar.reset();
  state.mode = 'play';
  state.playerPos.set(-18, 0, 66);
  state.playerHeading = Math.PI;
  state.onFoot = true;
  state.inCar = false;
  dialog.show('rae', 7);
});

let shotSnap = false;
if (shotParam && ['start', 'play', 'chase', 'mission', 'end'].includes(shotParam)) {
  shots.stageShot(shotParam, characters, heroCar, traffic);
  shotSnap = true;
}

const clock = new THREE.Clock();
let firstFrame = true;

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = (state.time += dt);

  // Global keys.
  if (input.pressed.KeyH) state.hudHidden = !state.hudHidden;
  if (input.pressed.Enter && state.mode === 'title') startGame();
  if ((input.pressed.KeyP || input.pressed.Escape) && state.mode === 'play') pause.open();
  else if ((input.pressed.KeyP || input.pressed.Escape) && state.mode === 'paused') pause.close();

  if (state.mode === 'play' || state.mode === 'shot') {
    state.stageElapsed += dt;
    if (state.mode === 'play') {
      tryEnterExit(state, input);
      updateOnFoot(dt);
      abilities.update(dt);
    }
    driving.update(dt, input);
    traffic.update(dt);
    pedestrians.update(dt, t);
    police.update(dt, t);
    heli.update(dt, t);
    characters.update(dt, t);
    combat.update(dt, input);
    missions.update(dt, t);
    garage.update(dt, t);
    safehouse.update(dt, t);
    stashes.update(dt, t);
    radio.update(dt, input);
    audio.update();
    if (state.mode !== 'shot') dialog.update(dt);
    // Popups decay in live play; staged frames hold theirs.
    if (state.mode !== 'shot') {
      for (const p of state.popups) p.ttl -= dt;
      state.popups = state.popups.filter((p) => p.ttl > 0);
    }
  }

  heroCar.sync();
  world.update(dt, t);
  rendering.update(dt, t);

  // Camera: staged scenes use their own framing; driving uses the low
  // close 3/4 chase camera; on foot follows just behind the player.
  // The title screen frames the hero car on the beach road.
  if (state.mode === 'shot' && state.shot === 'mission') {
    missionCamera(camera, state);
  } else if (state.mode === 'shot' && state.shot === 'end') {
    endCamera(camera, state);
  } else if (state.inCar || state.mode === 'title') {
    // In staged shots the camera holds the exact chase position every
    // frame — at cruise speed a lerped camera trails metres behind and
    // the car shrinks. In live play it eases instead.
    chaseCamera(camera, state.carPos, state.carHeading, dt, state.mode === 'shot' || shotSnap || firstFrame);
  } else if (state.mode !== 'title') {
    const h = state.playerHeading;
    const fx = Math.sin(h), fz = Math.cos(h);
    const tx = state.playerPos.x - fx * 4.4 + fz * 1.1;
    const tz = state.playerPos.z - fz * 4.4 - fx * 1.1;
    const k = 1 - Math.exp(-dt * 7);
    if (shotSnap || firstFrame) camera.position.set(tx, 2.1, tz);
    else {
      camera.position.x += (tx - camera.position.x) * k;
      camera.position.y += (2.1 - camera.position.y) * k;
      camera.position.z += (tz - camera.position.z) * k;
    }
    camera.lookAt(state.playerPos.x + fx * 4, 1.4, state.playerPos.z + fz * 4);
  }
  shotSnap = false;
  firstFrame = false;

  hud.update(dt);
  input.endFrame();
  renderer.render(scene, camera);
}

loop();
