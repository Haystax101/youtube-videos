# Gary Tries It: video pipeline

Daily 25-45 s vertical Shorts. Gary changes one small thing about his life and the
consequences escalate over days, months and years, sometimes until he dies, sometimes he survives or ends up better off (the
no on-screen death counter: george removed it as clutter).

## Pipeline

1. `episodes/<NNN-slug>/script.json`: written by Claude. Beats with a time label,
   scene, Gary's expression and accessories, props, camera move and narration.
2. `pipeline/tts.py`: Kokoro TTS (local, free). Writes `voice.wav` and `timeline.json`
   (beat times, per-word timings, death time).
3. `pipeline/mix.py`: procedural music bed and SFX, ducked under the voice. `"music": {"mood": M}`
   picks pluck (the style's original loop), suspense, epic, lofi, chiptune, musicbox or none.
   Experiments: `pipeline/experiments.py assign|report` with the registry `writing/experiments.json`.
4. `pipeline/render.mjs`: headless Chromium renders `web/index.html` (three.js) frame by
   frame at 1080x1920, 30 fps, piped into ffmpeg -> `video.mp4`.

Run: `./make.sh episodes/001-face-mask` (about 8 minutes for 40 s on 4 CPUs).
Preview stills: `node pipeline/render.mjs episodes/<slug> --stills 2,10,20`.

## Script vocabulary (see web/scene.js)

- scene: bedroom, bathroom, kitchen (round table), dentist, nightstreet (road, brick wall, street lamp), void (heaven, for the ending)
- gary.expr: happy, neutral, worried, shocked, sick, dead
- gary.acc: mask, mask_dirty, spots, flies; gary.pose: ghost
- props: soup, sandwich (needs a scene with a table: kitchen), water (a glass by Gary's hand)
- fx: co2
- camera: push, face, table, pan, wide
- lines[].speaker: narrator (am_michael) or gary (am_puck)
- style (top level): cartoon (default); noir (b&w film, grain, window-blind shadows, typewriter
  captions, slow minor music, typewriter clacks); news (BREAKING lower third shows the label, `ticker`
  text scrolls under it, LIVE bug, karaoke word captions, urgent music). `voices` overrides the
  narrator/gary voices, `music: {"bpm": N}` overrides the tempo.
- death: true on the beat where Gary dies; triggers the death animation after the last word

New ideas usually need one or two new props, accessories or scenes added to scene.js.

## Hook and voice rules (from george)

- Narrate in second person: it's a simulation of the viewer ("you"), Gary is just the avatar.
- Beat 1 is always a hook beat (`"hook": true`, label like `HOW LONG UNTIL YOU *DIE?*`, `*word*` turns red)
  that asks a clickbait question in the first 2 seconds, e.g. "If you wore a face mask every single day,
  how long would it take for you to die?"
- Every video ends with "You died." or "You survived." plus the ending CTA under test (see CLAUDE.md).
- Script method: `.claude/skills/write-short-script/SKILL.md`; ideas in `writing/idea-bank.md`; competitor notes in `writing/competitors.md`.

## Landscape / long-form

`"format": "landscape"` in script.json renders 1920x1080. Extra script fields:
The death counter is off by default (`"hud": {"counter": true}` shows it, but george doesn't want it); `"card": {"title", "subtitle"}` shows a
chapter title card over the scene. Extra scenes: outdoor (park), space (alien planet).
Extra cameras: orbit, low. Long renders: `--workers N` splits frames across N browsers;
`.github/workflows/render.yml` renders an episode on GitHub Actions
(`gh workflow run render.yml -f episode=episodes/long/NNN-slug`).

## YouTube setup (one-time, done by george)

`pipeline/youtube.py` uploads, reads analytics (views, average % viewed, retention curve)
and reads comments. It needs three environment variables in the Claude cloud environment:
`YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` (scopes: youtube.upload,
youtube.readonly, yt-analytics.readonly, youtube.force-ssl). Set `YT_UPLOAD_ENABLED=1` only
after the Google Cloud project passes YouTube's API audit; until then API uploads are
locked to private.

## Style: lowpoly (web/lowpoly.html + web/lowpoly.js)

A separate renderer: faceted, flat-shaded 3D people with real joints in floating diorama rooms.
`pipeline/render.mjs` loads `web/<style>.html` when it exists, else `web/index.html`. No deaths counter.
- scene: livingroom, office, car (convertible on a moving road), hospital, gaming, garden (lawn, fence, beehive), void
- gary: `pose` (stand, sit, type, hunch, sofa, slouch, drive, bedsit, game, clipboard, ghost),
  `expr` (happy, neutral, worried, tired, shocked, sick, dead), `build` 0..1 (weight gain)
- cast: `[{"who": "doctor", "pose": "clipboard"}]`; a line with `"speaker": "doctor"` moves the doctor's mouth
  (give the voice in `voices`, e.g. `"doctor": "bf_emma"`)
- gary.welts: true (red sting bumps on the face); script `keywords`: extra caption words to highlight
- props: pizza, can (energy drink in hand), cans (pile of empties at Gary's feet), magnets (pair in hand);
  fx: clot, clot_move, bees (full swarm), bees_few, xray (lightbox X-ray beside Gary); camera: push, face, wide, side, low, front, two, legs
- death: clutches chest, then slumps; red pulse
New rooms, people (PEOPLE) and poses (POSES) are plain data in web/lowpoly.js.

## Style: storybook (web/storybook.html + web/storybook.js) — PAUSED for Shorts (george, 2026-11-25)

Generated painted backgrounds with hand-drawn 2D costumed characters acting in front of them.
- `backgrounds`: {"key": "prompt"} in script.json; `python3 pipeline/backgrounds.py EP` writes `EP/bg/key.jpg`
  with Cloudflare Workers AI (FLUX.2 klein 4B, free daily allowance ~60 images; needs CF_ACCOUNT_ID and
  CF_API_TOKEN). `bgStyle` overrides the shared style suffix. Commit the bg images (small) with the script.
- beat: `bg`, `cast` [{id, who, x, s, pose, expr, flip, hold, enter, ghost, jump}] (jump: true drops that character off-screen with a spin just before `deathAt`), `props` [{type: stool|block|throne, x, s}],
  `fx`: coins|shake, `camera`: wide|push|close (on `focus`)|pan, `death` + `deathOf`: cast id
- who: WARDROBE entries in web/storybook.js (gary, gary_tudor, king_henry, lord, anne, executioner, gary_tailor,
  gary_chute (parachute-suit cape), gendarme, reporter; hats incl. flat_cap, leather_cap, kepi); add
  new costumes per idea. pose: idle, hold, point, shrug, panic, hips, whisper, wave, bow, axe.
  expr: happy, neutral, worried, shocked, smug, angry, sick, dead. hold: cloth, purse, axe, scroll, goblet, camera.
- `names`: {"speakerId": "ON-SCREEN NAME"} shows who is talking above the caption; give every speaker a voice in `voices`.

