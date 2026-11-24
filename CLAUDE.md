# Gary Tries It: daily episode run

This repo makes one vertical YouTube Short per day. See README.md for the pipeline.
The scheduled daily run follows these steps exactly.

## Daily episode procedure

1. `./setup.sh` (idempotent; downloads the free Kokoro TTS model if missing).
2. Read `episodes/LOG.md` (what has been made, experiment knobs, results) and `ideas.md`.
   If YouTube analytics are available (not yet set up), read them first and note what
   retained viewers best.
3. Pick the next idea: a small life change with escalating consequences over time that
   usually ends in death. Never repeat a concept. Move it from `ideas.md` into the log.
4. Create `episodes/NNN-slug/script.json` (next number). Rules from george:
   - Beat 1 is a hook beat (`"hook": true`): a clickbait question to the VIEWER in the first
     2 seconds, e.g. "If you wore a face mask every single day, how long would it take for
     you to die?" On-screen label like `HOW LONG UNTIL YOU *DIE?*` (`*word*` turns red).
   - Narrate in second person ("you") throughout. Gary is the on-screen avatar of "you".
   - Time labels escalate: DAY 1, WEEK 1, MONTH 1, YEAR 1...
   - Facts must be real and plausible; one myth-bust beat is good.
   - The last beat is always the `void` scene with Gary as a ghost and exactly:
     "You died. Comment what stupid shenanigans Gary should try tomorrow."
   - Target 30-45 s of audio. `deathsBefore` = previous episode's total deaths.
   - Add an `"experiment"` object recording what is deliberately different this time
     (e.g. tempo/speed, voice, hook wording, setting, camera style, length). Change one
     or two knobs per episode; keep what the log says worked.
5. If the idea needs new props, rooms, accessories or fx, add them to `web/scene.js`
   (and list them in README's vocabulary). Keep Gary's design unchanged.
6. `python3 pipeline/tts.py EP && python3 pipeline/mix.py EP`, then render stills
   (`NODE_PATH=$(npm root -g) node pipeline/render.mjs EP --stills 1,8,15,...`) and look
   at them. Fix anything broken (overlaps, missing props, text off screen) before the
   full render: `NODE_PATH=$(npm root -g) node pipeline/render.mjs EP` (~8 min).
7. Append a row to `episodes/LOG.md`, commit the script and any code changes to `main`
   (never commit .mp4/.wav), push.
8. Deliver: copy the video to `/mnt/project-files/gary-tries-it/NNN-slug.mp4` and post it
   to george with a suggested YouTube title, description and 3-5 hashtags.
