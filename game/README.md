# SUNCOAST: HEATLINE technical outline

An open-world crime game in plain static files under `game/`. No build step and no bundler; the only framework is Three.js 0.160.0, vendored locally at `game/vendor/three.module.min.js` with its MIT licence at `game/vendor/LICENSE-threejs.txt`. Entry point `main.ts` selects node22. Serve locally with `node serve.ts` from the repo root.

## Source outline

- `core/`: constants, seeds and economy (`config.js`); keyboard and mouse (`input.js`); boot and main loop (`main.js`); renderer, camera, sunset sky, clouds and light (`rendering.js`); quality presets (`settings.js`).
- `world/`: the city, ocean, beach, palms, ferris wheel, lighthouse and pier (`world.js`); streets, districts and landmark positions (`constants.js`); procedural canvas textures (`textures.js`); boardwalk kiosks (`boardwalk.js`); garage repaint and refuel (`garage.js`); safehouse healing (`safehouse.js`); street-cash stashes (`stash.js`).
- `vehicles/`: hero car, traffic, police and helicopter models (`models.js`); hero-car spawn, enter and exit (`vehicles.js`); arcade driving, drift and near-miss payouts (`driving.js`); 18 looping traffic cars (`traffic.js`).
- `AI/`: police pursuit, ramming, flanking, roadblocks and line-of-sight (`police.js`); the SKY-1 helicopter orbit and spotlight (`helicopter.js`); 20 pedestrians with walking paths and scatter reactions (`pedestrians.js`).
- `combat/`: four weapons, yard enemies, damage, bounties and muzzle flash (`combat.js`).
- `characters/`: the player on foot with a visible pistol, the crew, and the yard enemies with health bars (`characters.js`).
- `missions/`: eight contracts, the economy, and the loop reset (`missions.js`).
- `UI/`: mission panel, money and status, named police panel, radio, weapons, crew abilities, speedometer, round minimap, dialogue and popups (`hud.js`); crew dialogue (`dialog.js`); pause menu and stats (`pause.js`); the five `?shot=` scenes (`shots.js`); crew calls Z / X / C (`abilities.js`).
- `audio/`: synthesised sound effects through WebAudio (`audio.js`); three original synth radio stations (`radio.js`).
- `save/`: localStorage save and load (`save.js`).

## Economy

Eight jobs pay $2,500, $2,500, $3,000, $3,500, $4,250, $2,000, $1,500 and $1,500 — $19,750 in story payouts. The yard sweep adds three $150 bounties ($450). With $1,250 starting cash the loop closes at $22,450 exactly. Street-cash stashes pay $250 each, drifts pay $150, near misses pay $50. REP rises +1 per finished job, +1 extra for the yard sweep, +1 more when the loop closes, ending at REP 10.

## Screenshots

Four staged frames from genuine gameplay at 1280x720, listed in `shots.json`: `1-start.jpg` (`?shot=start&seed=1`), `2-play.jpg` (`?shot=play&seed=1`), `3-chase.jpg` (`?shot=chase&seed=1`), `4-mission.jpg` (`?shot=mission&seed=1`). A fifth scene, `?shot=end&seed=1` (the north beach road to the lighthouse after the final job), is prepared in-game but not submitted. The kit caps `screenshots/` at 4 files.

## Offline

Zero external requests during gameplay. No CDN, no fonts, no images, no fetch, XHR or WebSocket in the game code. All textures are procedural canvas textures generated at runtime, all audio is synthesised live with WebAudio, and the favicon is a local file (`game/favicon.ico`, linked from `game/index.html`).
