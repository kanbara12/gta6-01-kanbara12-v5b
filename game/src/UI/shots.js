// Screenshot staging: ?shot=start|play|chase|mission|end with &seed=1.
// Each scene sets mission, cash, REP, jobs done, wanted, timer, speed,
// police, heli and dialogue TOGETHER from the plan's table — never one
// alone. Scenes run live (traffic, heli, waves) before capture.
import * as THREE from 'three';
import { STAGES, CREW, MISSIONS } from '../core/config.js';
import { WORLD } from '../world/constants.js';

export function createShots(state, dialog) {
  function applyStage(name) {
    const s = STAGES[name];
    state.shot = name;
    state.mode = 'shot';
    state.missionIndex = s.job - 1;
    state.money = s.cash;
    state.jobsDone = s.done;
    state.wanted = s.wanted;
    state.stageElapsed = s.elapsed;
    state.loopComplete = name === 'end';
    state.targetsDown = name === 'mission' ? 2 : (name === 'end' ? 3 : 0);
    state.driftEarned = name === 'chase' ? 150 : 0;
    state.hp = 100;
    state.fuel = 100;
    state.cond = 100;
    state.dialog = s.dialog ? CREW[s.dialog] : null;
    state.popups = [];
    state.shotFormation = null;
    state.shotPolice = 0;
    document.getElementById('startCard').style.display = 'none';
    document.getElementById('endCard').style.display = 'none';
  }

  return {
    stageShot(name, characters, heroCar, traffic) {
      applyStage(name);
      const s = STAGES[name];
      if (name === 'start') {
        // Hero open-world: beach road, ocean left, ferris wheel right.
        // Staged 170 m south of the wheel so it frames fully even after
        // the car cruises north during the settle.
        state.carPos.set(-26, 0, 60);
        state.carHeading = Math.PI;
        state.carSpeed = (s.speed * 1000) / 3600;
        state.inCar = true;
        state.onFoot = false;
        state.cruise = true;
        state.cruiseSpeed = s.speed;
        state.speedKmh = s.speed;
        state.clockLabel = 'GOLDEN';
      } else if (name === 'play') {
        // Full beachfront chase: ocean + palms + ferris wheel in frame.
        state.carPos.set(-26, 0, 40);
        state.carHeading = Math.PI;
        state.carSpeed = (s.speed * 1000) / 3600;
        state.inCar = true;
        state.onFoot = false;
        state.cruise = true;
        state.cruiseSpeed = s.speed;
        state.speedKmh = s.speed;
        state.shotPolice = 3;
        state.shotFormation = [
          [-4.5, -11, 'PURSUIT'], [4, -14, 'PURSUIT'],
          [-4, 12, 'RESPONDING'],
        ];
        // Stage 4 traffic cars on the beach road ahead of the hero car,
        // so 3+ read clearly near the chase at capture (the seeded lanes
        // alone left the road empty): two northbound in the west lane,
        // two southbound oncoming in the east lane.
        if (traffic) {
          const z = state.carPos.z;
          // Traffic staged 40-75 m ahead of the hero car: at capture
          // (car cruises ~20 m during the 6 s settle) they sit 15-45 m
          // ahead, 3+ clearly near. The old spots (28-70 m) left the
          // nearest car ~11 m ahead — a black slab dead-centre that hid
          // the hero car's front.
          traffic.cars[0].mesh.position.set(-28.5, 0, z - 40);
          traffic.cars[1].mesh.position.set(-23.5, 0, z - 50);
          traffic.cars[10].mesh.position.set(-28.5, 0, z - 62);
          traffic.cars[11].mesh.position.set(-23.5, 0, z - 75);
        }
        state.clockLabel = 'GOLDEN';
      } else if (name === 'chase') {
        // Staged 170 m south of the ferris wheel like the start shot, so
        // the wheel frames fully in the distance and never hides SKY-1.
        state.carPos.set(-26, 0, 60);
        state.carHeading = Math.PI;
        state.carSpeed = (s.speed * 1000) / 3600;
        state.inCar = true;
        state.onFoot = false;
        state.cruise = true;
        state.cruiseSpeed = s.speed;
        state.speedKmh = s.speed;
        state.shotPolice = 4;
        state.shotFormation = [
          [-4.5, -11, 'RAMMING'], [4, -9, 'FLANKING'],
          [-4, 14, 'PURSUIT'], [5, 20, 'RESPONDING'],
        ];
        // Floating drift payout, held for the frame.
        state.popups.push({ text: 'DRIFT x3 +$150', ttl: 999 });
        state.clockLabel = 'DUSK';
      } else if (name === 'mission') {
        // On-foot yard sweep, re-staged INSIDE the lot facing NORTH:
        // the old staging put the player on the west fence line with
        // the camera outside the fence, so fence rails crossed the
        // frame and the gun (on the player's far side) was occluded.
        // Now the camera sits inside the yard on the gun side, the
        // fence is behind it, the NW sun is in the frame, and all
        // three enemies stand clear of the containers.
        state.inCar = false;
        state.onFoot = true;
        state.cruise = false;
        state.carSpeed = 0;
        state.speedKmh = 0;
        state.carPos.set(108, 0, 136);
        state.playerPos.set(136, 0, 152);
        state.playerHeading = Math.PI;
        characters.resetYard();
        state.targetsDown = 2;
        // Two enemies already bloodied by the sweep so far.
        characters.enemies[0].hp = 40;
        characters.enemies[0].barFg.scale.x = 0.4;
        characters.enemies[1].hp = 65;
        characters.enemies[1].barFg.scale.x = 0.65;
        state.clockLabel = 'GOLDEN';
      } else if (name === 'end') {
        // Loop complete at the lighthouse: player AND car in frame.
        // Player stands on the ocean side of the car, clear of the
        // palm lines, so no trunk hides either of them.
        state.inCar = false;
        state.onFoot = true;
        state.cruise = false;
        state.carSpeed = 0;
        state.speedKmh = 0;
        state.carPos.set(-26, 0, -180);
        state.carHeading = Math.PI;
        state.playerPos.set(-29.5, 0, -176);
        state.playerHeading = Math.PI * 0.85;
        state.clockLabel = 'DUSK';
      }
      heroCar.sync();
      window.__suncoast.shot = name;
    },
  };
}

// Mission-shot camera: inside the yard, behind the player's gun side,
// looking north at the three enemies. The player stands left of frame
// with the pistol visible; the fence stays behind the camera.
export function missionCamera(camera, state, characters) {
  const px = state.playerPos.x, pz = state.playerPos.z;
  const h = state.playerHeading;
  const fx = Math.sin(h), fz = Math.cos(h);
  const rx = fz, rz = -fx;
  camera.position.set(px - fx * 7.0 + rx * 3.0, 3.0, pz - fz * 7.0 + rz * 3.0);
  let lx = px + fx * 8, lz = pz + fz * 8;
  if (characters && characters.enemies && characters.enemies.length) {
    let sx = 0, sz = 0;
    for (const e of characters.enemies) { sx += e.mesh.position.x; sz += e.mesh.position.z; }
    lx = sx / characters.enemies.length;
    lz = sz / characters.enemies.length;
  }
  camera.lookAt(lx, 1.2, lz);
}

// End-scene camera: HIGH three-quarter from behind the car, looking
// north-west down the beach road. Shot from 9 m up, the palm trunks
// are thin lines instead of a wall, the lighthouse stands clear above
// them, and the standing player + hero car are both in the frame.
export function endCamera(camera, state) {
  const cx = state.carPos.x, cz = state.carPos.z;
  // Pulled back and low, looking slightly up at the lighthouse: the
  // whole 34 m tower (red band at 24 m) fits in frame, and the player +
  // car sit at y ~420-520 — above the dialogue/speedometer cards that
  // hid them at the old (cx+2, 9, cz+14). LookAt east of the tower so
  // the sun disc reads clear of the tower, low beside it.
  camera.position.set(cx + 6, 4.0, cz + 26);
  camera.lookAt(-18, 8, -200);
}
