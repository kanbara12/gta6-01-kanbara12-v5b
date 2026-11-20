[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-blue.svg)](game/vendor/three.module.min.js)
[![make.fun](https://img.shields.io/badge/make.fun-gta6--01-orange.svg)](https://make.fun/)

# SUNCOAST: HEATLINE

An open-world crime game for the make.fun **gta6-01** competition. One sunset city, one red sports coupe, eight jobs, and $22,450 on the table.

Suncoast is yours tonight. Steal the HEATLINE GT, run the fixer Rae's contracts across the beachfront, lose the heat at the garage, and bring it home to the lighthouse. Police units hunt you by callsign, the SKY-1 helicopter sweeps the beach road with its spotlight, and the crew, Rae, Sable, and Marlo, talk you through every job.

## Play

Serve the game locally, then open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network. Three.js 0.160.0 is vendored under `game/vendor/`, all textures are painted at runtime, and all sound is synthesised live with WebAudio. The game runs identically with the network disconnected.

Controls: W A S D drive / walk, E enter / exit car, SPACE brake, SHIFT drift, 1–4 weapons, CLICK fire (on foot), Z / X / C crew calls, R radio, M mute, H hide HUD, P / ESC pause.

## The loop: 8 jobs, $22,450

| # | Job | Payout | Cash after |
|---|---|---|---|
| 1 | A FAVOR IN THE HEAT — meet Rae at the marker | $2,500 | $3,750 |
| 2 | LOOSE CARGO — pick up the sealed package | $2,500 | $6,250 |
| 3 | THE QUIET EXIT — deliver across town, low heat | $3,000 | $9,250 |
| 4 | STREET SWEEP — clear the yard crew (3 targets, $150 bounty each) | $3,500 + $450 | $13,200 |
| 5 | NO WITNESSES — reach the garage and lose the heat | $4,250 | $17,450 |
| 6 | LAST LIGHT — final run at dusk, roadblocks ahead | $2,000 | $19,450 |
| 7 | THE MARINA SWAP — case swap at the marina | $1,500 | $20,950 |
| 8 | NORTH LIGHT — north-beach run to the lighthouse | $1,500 | **$22,450** |

Story payouts total $19,750; plus $1,250 starting cash and $450 in yard bounties, the loop closes at $22,450 exactly. Street-cash stashes pay $250 each, drifts pay $150, near misses pay $50.

## Screenshots

Four staged frames from genuine gameplay at 1280x720, listed in `shots.json`:

| File | Scene | What it shows |
|---|---|---|
| `screenshots/1-start.jpg` | `?shot=start&seed=1` | Hero open-world: the HEATLINE GT large in a low rear three-quarter view on Beachfront Rd, ocean and palms left, boardwalk kiosks and the ferris wheel right |
| `screenshots/2-play.jpg` | `?shot=play&seed=1` | Full beachfront chase with SKY-1 overhead, police cars close behind, and the named police panel |
| `screenshots/3-chase.jpg` | `?shot=chase&seed=1` | Wanted-3 chase with the heli spotlight, a flanking unit, and a DRIFT x3 +$150 popup |
| `screenshots/4-mission.jpg` | `?shot=mission&seed=1` | On-foot yard sweep: pistol in hand, three enemies with health bars, Marlo on the radio |

A fifth scene, `?shot=end&seed=1` (the north beach road to the lighthouse after the final job, $22,450, REP 10, 8 jobs done), is prepared in-game but not submitted. The kit caps `screenshots/` at 4 files.

## Source outline

`game/README.md` carries the full technical outline: one line per directory, the economy table, and the screenshot list.

## Licence

MIT. See `LICENSE`. Three.js is vendored under its own MIT licence; see `game/THIRD-PARTY-NOTICES.md`.
