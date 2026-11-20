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
          traffic.cars[0].mesh.position.set(-28.5, 0, z - 28);
          traffic.cars[1].mesh.position.set(-23.5, 0, z - 45);
          traffic.cars[10].mesh.position.set(-28.5, 0, z - 55);
          traffic.cars[11].mesh.position.set(-23.5, 0, z - 70);
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
        // On-foot yard sweep: player on the clear west apron of the lot,
        // facing the three yard enemies, pistol out, muzzle flash on a
        // slow rhythm (see combat). Sightline is clear of the containers.
        state.inCar = false;
        state.onFoot = true;
        state.cruise = false;
        state.carSpeed = 0;
        state.speedKmh = 0;
        state.carPos.set(116, 0, 130);
        state.playerPos.set(122, 0, 146);
        state.playerHeading = Math.atan2(134 - 122, 147 - 146);
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
        state.inCar = false;
        state.onFoot = true;
        state.cruise = false;
        state.carSpeed = 0;
        state.speedKmh = 0;
        state.carPos.set(-26, 0, -180);
        state.carHeading = Math.PI;
        state.playerPos.set(-22.5, 0, -175);
        state.playerHeading = Math.PI * 0.85;
        state.clockLabel = 'DUSK';
      }
      heroCar.sync();
      window.__suncoast.shot = name;
    },
  };
}

// Mission-shot camera: close over-the-shoulder from the player's right
// side, so the pistol in the player's right hand and all three enemies
// read in frame, with the yard's containers and fencing behind them.
export function missionCamera(camera, state) {
  const px = state.playerPos.x, pz = state.playerPos.z;
  const h = state.playerHeading;
  const fx = Math.sin(h), fz = Math.cos(h);
  const rx = fz, rz = -fx;
  camera.position.set(px - fx * 4.5 + rx * 3.2, 3.0, pz - fz * 4.5 + rz * 3.2);
  camera.lookAt(134, 1.0, 147);
}

// End-scene camera: 3/4 view with player, car, lighthouse and ocean.
export function endCamera(camera, state) {
  const cx = state.carPos.x, cz = state.carPos.z;
  camera.position.set(cx + 9, 3.4, cz + 10);
  camera.lookAt(-28, 4, -196);
}
