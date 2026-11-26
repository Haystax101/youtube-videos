
// =====================================================================================================
// SETS: the casino floor (hero Game King machine), the Las Vegas strip at night, the lab / security /
// FBI room, Nestor's house (the raid), the courtroom. Each set lives far apart; only the shot's set shows.
// =====================================================================================================
const CASINO = ROOT;
const STRIP = new THREE.Group(); STRIP.position.set(90, 0, 0); scene.add(STRIP);
const HQ = new THREE.Group(); HQ.position.set(240, 0, 0); scene.add(HQ);
const HOUSE = new THREE.Group(); HOUSE.position.set(330, 0, 0); scene.add(HOUSE);
const COURT = new THREE.Group(); COURT.position.set(420, 0, 0); scene.add(COURT);
const SETS = { casino: CASINO, strip: STRIP, hq: HQ, house: HOUSE, court: COURT };
const SCR = {};
const MAIN_STAGE = 0;
