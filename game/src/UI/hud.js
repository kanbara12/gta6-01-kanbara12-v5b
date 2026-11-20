// HUD: mission panel, money/status, named police panel, radio + weapons
// + crew abilities, speedometer, round minimap, dialogue, popups.
// Every value is read live from state — one source of truth.
import { MISSIONS, fmtMoney, fmtTime, repFor } from '../core/config.js';
import { WEAPONS } from '../combat/combat.js';
import { districtAt } from '../world/constants.js';

const $ = (id) => document.getElementById(id);

const STATIONS = [
  { name: 'SHORELINE 96.7', track: 'Sunset Run' },
  { name: 'PIER 102.5', track: 'Boardwalk Lights' },
  { name: 'DUNE 89.9', track: 'Night Mirage' },
];

const ABILITIES = [
  { key: 'Z', who: 'Rae', name: 'CLEAN SLATE', color: '#7a4a8a' },
  { key: 'X', who: 'Sable', name: 'EYES UP', color: '#2a6a8a' },
  { key: 'C', who: 'Marlo', name: 'PIT STOP', color: '#8a5a2a' },
];

export function createHud(state, police, heli) {
  const minimap = $('minimap');
  const mctx = minimap.getContext('2d');

  function renderWeapons() {
    $('weapons').innerHTML = WEAPONS.map((w, i) =>
      `<div class="wslot${i === state.weapon ? ' on' : ''}">${i + 1} ${w.name}</div>`).join('');
  }
  function renderAbilities() {
    $('abilities').innerHTML = ABILITIES.map((a) =>
      `<div class="abil"><div class="port" style="background:${a.color}">${a.who[0]}</div><span class="key">${a.key}</span> ${a.who} ${a.name}<span class="st">READY</span></div>`).join('');
  }
  renderWeapons();
  renderAbilities();

  function drawMinimap() {
    const W = 180, C = 90;
    mctx.clearRect(0, 0, W, W);
    // Sea west, sand, roads.
    mctx.fillStyle = '#16283f';
    mctx.fillRect(0, 0, 34, W);
    mctx.fillStyle = '#8a6f45';
    mctx.fillRect(34, 0, 10, W);
    mctx.fillStyle = '#23202a';
    mctx.fillRect(48, 0, 8, W);
    mctx.fillStyle = '#23202a';
    mctx.fillRect(60, 20, 110, 6);
    mctx.fillRect(60, 90, 110, 6);
    mctx.fillStyle = '#2c4a6a';
    mctx.beginPath();
    mctx.arc(58, 26, 9, 0, Math.PI * 2);
    mctx.fill();
    const toMap = (x, z) => [C + (x / 240) * 150, C + (z / 240) * 150];
    // Mission marker: pulsing gold dot.
    const mi = state.missionIndex;
    if (mi < 8) {
      const [mx, mz] = MISSIONS[mi].point;
      const [px, py] = toMap(mx, mz);
      mctx.fillStyle = '#ffd76a';
      mctx.beginPath();
      mctx.arc(px, py, 4 + Math.sin(state.time * 4) * 1.5, 0, Math.PI * 2);
      mctx.fill();
    }
    // Police: red dots. Player: gold diamond.
    for (const u of police.units) {
      if (!u.active) continue;
      const [px, py] = toMap(u.mesh.position.x, u.mesh.position.z);
      mctx.fillStyle = '#ff4040';
      mctx.beginPath();
      mctx.arc(px, py, 3.5, 0, Math.PI * 2);
      mctx.fill();
    }
    const pp = state.inCar ? state.carPos : state.playerPos;
    if (pp) {
      const [px, py] = toMap(pp.x, pp.z);
      mctx.fillStyle = '#ffd76a';
      mctx.save();
      mctx.translate(px, py);
      mctx.rotate(state.inCar ? state.carHeading : state.playerHeading);
      mctx.fillRect(-3, -3, 6, 6);
      mctx.restore();
    }
  }

  function renderPopups() {
    const box = $('popups');
    const html = state.popups.map((p) => `<div class="pop">${p.text}</div>`).join('');
    if (box.innerHTML !== html) box.innerHTML = html;
  }

  return {
    update(dt) {
      const mi = state.missionIndex;
      const rep = repFor(state.jobsDone, state.loopComplete);
      // Mission panel.
      if (state.loopComplete) {
        $('jobTitle').textContent = 'STORY LOOP COMPLETE';
        $('objective').textContent = 'Eight jobs done — the loop closes at the lighthouse';
        $('nextMission').textContent = 'NEXT: RUN IT AGAIN';
        $('timer').textContent = 'LOOP COMPLETE • $22,450';
        $('markerLine').textContent = 'LIGHTHOUSE 0 m';
      } else {
        const m = MISSIONS[mi];
        $('jobTitle').textContent = `JOB ${mi + 1}/8 • ${m.title}`;
        $('objective').textContent = m.objective;
        $('nextMission').textContent = `NEXT: ${m.next}`;
        $('timer').textContent = `${fmtTime(state.stageElapsed)} / PAR ${fmtTime(m.par)}`;
        $('markerLine').textContent = state.missionIndex === 3
          ? `TARGETS ${state.targetsDown}/3`
          : `MARKER ${state.markerDist} m`;
      }
      // Money / status.
      $('cash').textContent = fmtMoney(state.money);
      $('hpLine').textContent = `HP ${Math.round(state.hp)}  •  REP ${rep}`;
      $('repBar').style.width = `${(rep / 10) * 100}%`;
      let stars = '';
      for (let i = 0; i < 5; i++) stars += i < state.wanted ? '★' : '<span class="off">☆</span>';
      $('stars').innerHTML = stars;
      const activeUnits = police.units.filter((u) => u.active);
      const heliActive = heli && heli.mesh.visible;
      // The yard shot stages no police in frame: units are searching the
      // streets, so the named panel stays hidden and the line reads
      // SEARCHING instead.
      const showPanel = (activeUnits.length > 0 || heliActive) && state.shot !== 'mission';
      if (showPanel) {
        $('policePanel').classList.remove('hidden');
        let rows = activeUnits.map((u) =>
          `<div class="row"><span>${u.callsign} &nbsp;${u.dist}m</span><span class="st">${u.status}</span></div>`).join('');
        if (heliActive) rows += `<div class="row"><span>AIR-1 SKY-1 &nbsp;${heli.dist}m</span><span class="st">SPOTLIGHT</span></div>`;
        $('policeRows').innerHTML = rows;
        $('policeLine').textContent = state.wanted >= 3 ? 'POLICE: IN SIGHT' : 'POLICE: RESPONDING';
      } else {
        $('policePanel').classList.add('hidden');
        $('policeLine').textContent = state.shot === 'mission' && state.wanted > 0 ? 'POLICE: SEARCHING' : 'POLICE: CLEAR';
      }
      // Radio + weapons + abilities.
      const st = STATIONS[state.station];
      $('station').textContent = `${st.name} • ${st.track}`;
      renderWeapons();
      // Speedometer.
      $('speed').textContent = String(state.speedKmh);
      $('fuelBar').style.width = `${state.fuel}%`;
      $('condBar').style.width = `${state.cond}%`;
      $('fuelLbl').textContent = `FUEL ${Math.round(state.fuel)}%`;
      $('condLbl').textContent = `HEATLINE GT — COND ${Math.round(state.cond)}%`;
      // Minimap labels.
      const pp = state.inCar ? state.carPos : state.playerPos;
      if (pp) state.district = districtAt(pp.x, pp.z);
      $('district').textContent = state.district;
      $('jobsDone').textContent = `${state.jobsDone} JOBS DONE • ${state.clockLabel}`;
      drawMinimap();
      // Dialogue card.
      const dlg = $('dialogCard');
      if (state.dialog) {
        dlg.classList.remove('hidden');
        const c = state.dialog;
        $('dlgPort').textContent = c.name[0];
        $('dlgPort').style.background = c.color;
        $('dlgWho').textContent = `${c.name} — ${c.role}`;
        $('dlgTxt').textContent = c.text;
      } else {
        dlg.classList.add('hidden');
      }
      // Popups.
      renderPopups();
      // Crosshair only on foot in combat: live play, or the staged
      // mission shot. Never on the title screen, never driving, and
      // never in the end scene (it floated over the lighthouse frame).
      $('crosshair').style.display = state.onFoot && !state.inCar && state.mode !== 'title' && state.shot !== 'end' ? 'block' : 'none';
      // Toast.
      const toast = $('toast');
      if (state.toastTtl > 0) {
        toast.style.display = 'block';
        toast.textContent = state.toast;
        state.toastTtl -= dt;
      } else {
        toast.style.display = 'none';
      }
      // HUD toggle.
      $('hud').style.visibility = state.hudHidden ? 'hidden' : 'visible';
    },
  };
}
