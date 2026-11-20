// World layout constants. One source of truth for streets, districts and
// landmark positions; missions, traffic, pedestrians and shots all read it.
export const WORLD = {
  // Beachfront Rd runs north (-Z) to south (+Z) at x = -26. Ocean is west.
  beachRoadX: -26,
  roadHalf: 5,
  oceanWest: -260,
  shoreX: -64,
  sandEast: -34,
  boardwalkX: -10,
  cityEast: 200,
  northZ: -220,
  southZ: 220,
  // Spawns: >5 m from the mission-1 marker at (-26, 20), ~45 m away.
  playerSpawn: [-18, 66],
  carSpawn: [-26, 63],
  marker1: [-26, 20],
  garage: [20, 40],
  safehouse: [30, -60],
  yard: [140, 150],
  marina: [-40, 180],
  lighthouse: [-30, -210],
  ferrisWheel: [-8, -110],
  pier: [-70, 60],
};

export const DISTRICTS = [
  { name: 'DOWNTOWN • Beachfront Rd', x0: -70, x1: 20, z0: -220, z1: 220 },
  { name: 'MIDTOWN • Sunset Ave', x0: 20, x1: 110, z0: -220, z1: 220 },
  { name: 'NORTH BEACH • Lighthouse Rd', x0: -70, x1: 200, z0: -220, z1: -140 },
  { name: 'MARINA • Dockside', x0: -70, x1: 40, z0: 140, z1: 220 },
  { name: 'INDUSTRIAL • Yard Row', x0: 40, x1: 200, z0: 80, z1: 220 },
];

export function districtAt(x, z) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x < d.x1 && z >= d.z0 && z < d.z1) return d.name;
  }
  return 'DOWNTOWN • Beachfront Rd';
}

// Building footprints for collision avoidance: {x, z, hw, hd} half-extents.
export const BUILDINGS = [];
