# Gary Tries It: daily episode run

This repo makes one vertical YouTube Short per day and one landscape long-form video per
week. See README.md for the pipeline. The scheduled runs follow these steps exactly.

## YouTube (both runs)

`pipeline/youtube.py` needs YT_CLIENT_ID, YT_CLIENT_SECRET and YT_REFRESH_TOKEN in the
environment. If `python3 pipeline/youtube.py check` says they are missing, skip every
YouTube step and just deliver the file. Never print or commit these values.
- Before writing: `python3 pipeline/youtube.py stats` and `python3 pipeline/youtube.py comments 5`.
  Read `episodes/analytics.json` (views, averageViewPercentage, retention curve per video,
  joined to each script's `experiment`) and say in the LOG which knobs correlate with
  better retention. Add good viewer suggestions from `episodes/comments.json` to `ideas.md`.
  Commit analytics.json and comments.json.
- After rendering: only if `YT_UPLOAD_ENABLED=1`, upload. Shorts: `--publish-at` the same
  day at 17:00 Europe/London (as UTC ISO). Long-form: Saturday 16:00 Europe/London. Commit the
  episode's `youtube.json`. Otherwise george uploads the file by hand; `stats` then links
  his upload to the episode (and writes its `youtube.json`) when the YouTube title contains
  every word of the episode slug, so suggest titles that do (e.g. `face-mask` -> "...face mask...").

## Daily episode procedure

**Shorts per day: 3** (george, 2026-11-24; may go to 5 if retention holds). Each run repeats
steps 2-7 once per Short: every one a different concept with its own episode number, its
own experiment knobs (vary them across the day's Shorts so each run tests several ideas),
and `deathsBefore` chained from the previous one. Then deliver them all in one post (step 8),
in the order george should upload them, with a suggested upload time for each, spread
across the day (e.g. 12:00, 17:00, 20:00 London).

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
   - No "times died" counter (george, 2026-11-24: clutter): set `"hud": {"counter": false}`.
   - Target 30-45 s of audio. `deathsBefore` = previous episode's total deaths.
   - Add an `"experiment"` object recording what is deliberately different this time
     (e.g. tempo/speed, voice, hook wording, setting, camera style, length). Change one
     or two knobs per episode; keep what the log says worked. Visual `style` (cartoon, noir,
     news, or a new one) is a knob too: follow the "Style test plan" in `episodes/LOG.md`, so
     each style gets several episodes before it is judged.
5. If the idea needs new props, rooms, accessories or fx, add them to `web/scene.js`
   (and list them in README's vocabulary). Keep Gary's design unchanged.
6. `python3 pipeline/tts.py EP && python3 pipeline/mix.py EP`, then render stills
   (`NODE_PATH=$(npm root -g) node pipeline/render.mjs EP --stills 1,8,15,...`) and look
   at them. Fix anything broken (overlaps, missing props, text off screen) before the
   full render: `NODE_PATH=$(npm root -g) node pipeline/render.mjs EP` (~8 min).
7. Append a row to `episodes/LOG.md`, commit the script and any code changes to `main`
   (never commit .mp4/.wav), push.
8. Deliver: copy the video to `/mnt/project-files/gary-tries-it/NNN-slug.mp4` and post it
   to george with a suggested YouTube title, description and 3-5 hashtags (and the
   YouTube link plus publish time if it was uploaded).

## Weekly long-form procedure

Format (from the long-form research doc https://claude.ai/artifact/JfZqN3nrHeE5yjaG4FtqZX):
landscape 16:9, more educational. Alternate weekly between:
- "What would happen if...": a big scenario told to "you" (e.g. we discover life on another
  planet) in time-jump chapters (DAY 1 ... YEAR 100), real science, Gary as you.
- Ranked countdown, "How fast would you die...": 8-12 entries ranked slowest to fastest,
  each a mini-scenario with its own label (`#10`, ... `#1`); `hud.counter: true` counts deaths.
Length is flexible, roughly 6-12 minutes; stop when the idea runs out, don't pad.

1. Same setup and YouTube stats as the daily run. Read `episodes/long/LOG.md` and `ideas-long.md`.
2. Create `episodes/long/NNN-slug/script.json` with `"format": "landscape"`. Rules:
   - First 15 seconds: hook beat (`"hook": true`) asking the viewer the big question and
     promising the payoff; then a quick preview of the craziest moment.
   - Chapter beats use `"card": {"title": "CHAPTER 2", "subtitle": "..."}` (a short beat that
     just reads the chapter name), then several beats with time labels.
   - Second person throughout; facts real; vary scenes and cameras every 2-3 beats
     (push, face, table, pan, wide, orbit, low).
   - End with a payoff, then "Subscribe, and comment what Gary should try next."
   - Add new rooms/props in `web/scene.js` as needed (expect 2-4 per video).
   - `experiment` object as for Shorts.
3. Voice locally (`tts.py`), render stills across the whole video and check them.
4. Render on GitHub Actions: write `episodes/long/NNN-slug` into `render-request.txt`,
   commit with the script and push; that push starts `.github/workflows/render.yml`.
   Find the run with `gh api repos/Haystax101/youtube-videos/actions/runs --jq '.workflow_runs[0]'`,
   wait for it in a background command (a 10-minute video takes roughly 2-3 hours), then
   download the video from the pre-release it creates (tag `render-NNN-slug-RUN_ID`):
   `curl -sSL -o EP/video.mp4 https://github.com/Haystax101/youtube-videos/releases/download/TAG/video.mp4`
   (`gh release download` uses GraphQL and fails here). The workflow keeps only the 3
   newest render pre-releases; Claude sessions cannot delete releases.
   Measured speed on Actions: about 16 s of render per second of 1080p video.
   (`gh workflow run` and GraphQL are not available from Claude sessions.)
   If Actions fails, render locally with `--workers 4` instead.
5. Log a row in `episodes/long/LOG.md`, deliver to `/mnt/project-files/gary-tries-it/long/`
   and post to george with title, description (with chapter timestamps from
   `timeline.json` card beats) and tags; upload if enabled.
