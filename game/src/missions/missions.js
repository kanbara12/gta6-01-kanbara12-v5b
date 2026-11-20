// Missions: 8 contracts end to end, one consistent economy. Advancing a
// mission sets cash, REP, jobs done, wanted and the next marker TOGETHER.
import * as THREE from 'three';
import { MISSIONS, ECONOMY, repFor, cashAtJobStart } from '../core/config.js';

export function createMissions(scene, state) {
  // Mission marker: a small glowing disc + ring on the ground and a
  // modest vertical beam — never a giant pillar. The old 7 m beam read
  // as a translucent skyscraper in every driving shot (m4).
  const marker = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.7, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.75, depthWrite: false }),
  );
  disc.rotation.x = -Math.PI / 2;
  marker.add(disc);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.7, 2.1, 28),
    new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  marker.add(ring);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.32, 3.2, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.y = 1.6;
  marker.add(beam);
  scene.add(marker);
  let pulse = 0;
  // Title screen reads this before the first mission update runs:
  // player spawn (-18, 66) to the mission-1 marker (-26, 20) is ~47 m.
  state.markerDist = 47;

  function currentPoint() {
    if (state.missionIndex >= 8) return null;
    const [x, z] = MISSIONS[state.missionIndex].point;
    return new THREE.Vector3(x, 0, z);
  }

  function payMission() {
    const m = MISSIONS[state.missionIndex];
    state.money += m.payout;
    state.missionIndex += 1;
    state.jobsDone = state.missionIndex;
    if (state.missionIndex >= 8) {
      state.loopComplete = true;
      state.mode = 'end';
      state.wanted = 0;
      document.getElementById('endCard').style.display = 'flex';
    } else {
      const next = MISSIONS[state.missionIndex];
      state.wanted = next.wanted;
      state.toast = `JOB ${state.missionIndex + 1}/8 • ${next.title} • $${m.payout.toLocaleString('en-US')}`;
      state.toastTtl = 3.5;
    }
    state.stageElapsed = 0;
  }

  return {
    marker,
    update(dt, t) {
      pulse += dt;
      const pt = currentPoint();
      marker.visible = !!pt;
      if (pt) {
        marker.position.set(pt.x, 0.06, pt.z);
        ring.scale.setScalar(1 + Math.sin(pulse * 3) * 0.12);
        beam.material.opacity = 0.11 + Math.sin(pulse * 2) * 0.04;
      }
      if (state.mode === 'shot' || !pt) {
        // Staged scenes never advance, but the marker distance still
        // reads live from the staged position.
        if (pt) {
          const tgt = state.inCar ? state.carPos : state.playerPos;
          state.markerDist = Math.round(Math.hypot(tgt.x - pt.x, tgt.z - pt.z));
        }
        return;
      }
      const target = state.inCar ? state.carPos : state.playerPos;
      const d = Math.hypot(target.x - pt.x, target.z - pt.z);
      state.markerDist = Math.round(d);
      if (state.missionIndex === 3) {
        // STREET SWEEP pays only when the yard crew is cleared.
        if (state.targetsDown >= ECONOMY.yardTargets) payMission();
        return;
      }
      if (d < 5) payMission();
    },
    // Exact live payout for the play test: mission 1 pays $2,500 and the
    // HUD advances to JOB 2/8 with $3,750.
    payMission,
    reset() {
      state.money = ECONOMY.startCash;
      state.missionIndex = 0;
      state.jobsDone = 0;
      state.wanted = 0;
      state.loopComplete = false;
      state.stageElapsed = 0;
      state.targetsDown = 0;
    },
  };
}
