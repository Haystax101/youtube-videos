# Gary Tries It: video pipeline

Daily 25-45 s vertical Shorts. Gary changes one small thing about his life and the
consequences escalate over days, months and years, usually until he dies (the
"times died" counter carries across episodes).

## Pipeline

1. `episodes/<NNN-slug>/script.json`: written by Claude. Beats with a time label,
   scene, Gary's expression and accessories, props, camera move and narration.
2. `pipeline/tts.py`: Kokoro TTS (local, free). Writes `voice.wav` and `timeline.json`
   (beat times, per-word timings, death time).
3. `pipeline/mix.py`: procedural music bed (plucked chords) and SFX, ducked under the voice.
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
- death: true on the beat where Gary dies; increments the counter after the last word

New ideas usually need one or two new props, accessories or scenes added to scene.js.

## Hook and voice rules (from george)

- Narrate in second person: it's a simulation of the viewer ("you"), Gary is just the avatar.
- Beat 1 is always a hook beat (`"hook": true`, label like `HOW LONG UNTIL YOU *DIE?*`, `*word*` turns red)
  that asks a clickbait question in the first 2 seconds, e.g. "If you wore a face mask every single day,
  how long would it take for you to die?"
- Every video ends with: "You died. Comment what stupid shenanigans Gary should try tomorrow."

## Landscape / long-form

`"format": "landscape"` in script.json renders 1920x1080. Extra script fields:
`"hud": {"counter": false}` hides the death counter; `"card": {"title", "subtitle"}` shows a
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
