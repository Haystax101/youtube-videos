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
  his upload to the episode (and writes its `youtube.json`) by slug words in the title or,
  failing that, by video length. If two episodes are ambiguous, link by hand:
  `python3 pipeline/youtube.py link EP VIDEO_ID`.

## Daily episode procedure

**Shorts per day: 3** (george, 2026-11-24; may go to 5 if retention holds). Each run repeats
steps 2-7 once per Short: every one a different concept with its own episode number, its
own experiment knobs (vary them across the day's Shorts so each run tests several ideas),
then deliver them all in one post (step 8),
in the order george should upload them, with a suggested upload time for each, spread
across the day (e.g. 12:00, 17:00, 20:00 London).

1. `./setup.sh` (idempotent; downloads the free Kokoro TTS model if missing).
2. Read `episodes/LOG.md` and `ideas.md`, then run the experiment loop (george, 2026-11-25:
   "everything should be experimented with until the data aligns on viral formats"):
   - `python3 pipeline/experiments.py report` (after `youtube.py stats`) writes
     `episodes/experiments-report.md`: every variable's arms scored on views, avg % viewed,
     subs and comments per 1k views, and early retention. Commit it.
   - Judge each active test in `writing/experiments.json` by its `rules` (enough videos, old
     enough, a clear margin). When one is decided, move it to `decided` with the winner, date
     and numbers, make the winner the default here or in the code, and start a new test from
     `backlog` (build what its `needs` says) or one you invent. Keep 3-6 tests active and keep
     adding ideas to the backlog: hooks, pacing, captions, music, sound, cameras, length,
     labels, titles, formats, character poly level (not the overall look: locked to lowpoly + cel). Write one line in the LOG on what changed and why.
   - After a winner is set, about 1 Short in 5 still tries a non-default arm (explore_share).
3. `python3 pipeline/experiments.py assign 3` gives each of today's Shorts its arms for every
   active test (balanced so the least-tested arms run first). Use them exactly; they vary
   several knobs at once on purpose, and the report compares each variable across many videos.
   Then pick the next idea. **Sole idea source (george, 2026-11-25): the No Such Thing As A Fish
   fan fact list**, `/mnt/project-files/gary-tries-it/research/fish-master-fact-list.csv`
   (~1,890 one-line facts by episode; if the file is missing, read Google Sheet
   `1f8ITcZz8DfrTDVwY5f1gOphq4wjEu3VJvVqZ1SSjSWU` with the Google Drive connector). Start with the
   unused rows of the shortlist in `writing/fact-catalogue.md`, then scan the list for facts
   that become a "you" premise (body, animals, space, science, survival, a real experiment).
   Each row is only a lead: find the original study or report and source every claim yourself;
   drop it if it doesn't hold up. Never copy their wording, transcribe episodes or use their
   audio, and keep the list itself out of this public repo. Log every fact you use (or reject
   and why) in `writing/fish-used.md` so none repeats. Gary does NOT have to die:
   at least one Short per day ends with him surviving or better off. Never repeat a concept.
   No poo/toilet topics. Move the idea into the log.
4. Write `episodes/NNN-slug/script.json` (next number) with the `write-short-script` skill
   (`.claude/skills/write-short-script/SKILL.md`; read `writing/competitors.md` once per run):
   research sourced facts first, choose the ending, five-move arc, 72-82 words, self-score.
   Rules from george:
   - Beat 1 is a hook beat (`"hook": true`): a clickbait question to the VIEWER in the first
     2 seconds, e.g. "If you wore a face mask every single day, how long would it take for
     you to die?" On-screen label like `HOW LONG UNTIL YOU *DIE?*` (`*word*` turns red).
   - Narrate in second person ("you") throughout. Gary is the on-screen avatar of "you".
     **Exception (george, 2026-11-25): Shorts don't have to be the Gary/"you" format.** When a
     fact isn't about something "you" do (an animal, a place, a historical event, an object),
     tell it straight without Gary: set `"noGary": true` in script.json (or `"gary": {"hide": true}`
     on single beats), keep the same lowpoly cel look, and build the new people, animals, props
     and sets the story needs in `web/lowpoly.js`. Still a hook to the viewer in the first 2 s,
     a cold open, sourced facts and an escalating arc; the ending skips the ghost/"You died"
     line and closes on the payoff plus the assigned CTA. Record `format` (gary_you / no_gary)
     in `experiment.vars`. Use it where it fits the fact, not as a quota.
   - Time labels escalate: DAY 1, WEEK 1, MONTH 1, YEAR 1...
   - Facts must be real, with sources in `experiment.facts`; one myth-bust beat is good.
   - Every Short needs a real "wait, what?" fact and a real arc with a turn (see the skill).
   - Last beat (Gary Shorts): if Gary dies, the `void`/heaven scene with Gary as a ghost and "You died. <CTA>";
     if he survives, Gary alive in the last scene and "You survived. <CTA>" (or "You're
     stronger than ever. <CTA>" for a beneficial habit).
   - **Ending CTA** (an active test, george 2026-11-25): use the assigned arm, exactly:
     `shenanigans` "Comment what stupid shenanigans Gary should try tomorrow." /
     `follow` "Follow for more interesting cartoons." /
     `comment_next` "Comment what you want to know next."
   - **Music** (active test): set `"music": {"mood": ARM}`. george (2026-11-25): these are
     high-stakes videos, so music is always upbeat or dramatic; the arms are epic, hype,
     suspense and chiptune (all synthesised in `pipeline/mix.py`, nothing to license). Don't
     use pluck, lofi, musicbox or none for Shorts.
     Narrator arms include female and softer voices (george, 2026-11-25): af_heart, af_bella,
     af_nicole (soft) and bf_emma alongside the male ones.
     **Narration stays on Kokoro (george, 2026-11-26 12:00):** the Qwen narrator test is dropped (he
     wasn't impressed); keep A/B testing Kokoro voices. Qwen may still voice short character lines. Likewise `voices.narrator`, `speed`, and the hook wording for `hook_form` (the hook still
     speaks to the viewer in the first 2 seconds).
   - Record `experiment.vars`: every assigned arm plus `ending` (dies / survives / better),
     `premise` (life_change / beneficial / absurd_event / true_history) and `style`, and fill
     the LOG's Ending / CTA column.
   - Target 25-31 s of audio (72-82 words) (george's best Veo Shorts were 24-31 s at 70-95% viewed; ours at
     43-48 s did worse). Cut slow early beats; every beat must escalate.
   - Cold open: beat 1 shows the most extreme/absurd moment (the death or the craziest image)
     while the hook question is asked, then the story rewinds to DAY 1.
   - Mix in single absurd-event premises ("What happens if you're bitten by 10,000 snakes",
     "you swallow a magnet") alongside life-change ones; at least one of each per day. For
     an absurd event, time labels run SECOND 1, MINUTE 1, HOUR 1, DAY 2. Hook label can name
     the premise (e.g. `1,000 BEE STINGS. *THEN WHAT?*`) instead of HOW LONG UNTIL YOU DIE.
     Episode 006-bee-stings is the template.
   - Suggested YouTube titles must name the premise in plain words ("What happens if you sit
     down all day?"), never vague ones like "would you actually survive this long?". No "times died" counter on screen (george: clutter); it is off
     by default, so don't set `hud.counter`.
   - The `"experiment"` object also notes anything else deliberately different (setting,
     camera style, a one-off idea) and the hypothesis behind it. **Style is locked to `"style": "lowpoly"`
     with `"look": "cel"`** (george, 2026-11-25: storybook Shorts got no views and a consistent look
     matters; at 17:16 he switched the daily look to cel: toon shading, ink outlines, rooms that
     run past the frame). Don't use storybook, paper, cartoon, noir or news for Shorts, or the old
     `"look": "flat"`, and don't start style tests; experiment inside it instead (music, hooks,
     voice, pacing, endings, rooms, props, cameras). Prefer the full sets (kitchen, street,
     studio) and moving cameras (crane, crane_up, dolly, orbit, truck, back) for at least a
     couple of beats per Short. Record `look` in `experiment.vars`.
   - **Faces and sets (george, 2026-11-26):** keep the pearly-white faces we already use (the
     characters in Archimedes/Syracuse and walk-in-circles are the reference; this is not a new
     style), and make scenes super detailed with angular environments (strong shapes and hard
     edges, layered detail at every distance). See the `make-set-video` skill.
   - **Character poly level** (active test `character_poly`, george 2026-11-25: "a/b different
     characters"): set `"character": {"poly": ARM}` (chunky, low, smooth) as assigned.
5. If the idea needs new props, rooms, accessories or fx, add them to the style's renderer
   (`web/lowpoly.js` for lowpoly, `web/scene.js` for cartoon) and list them in README's
   vocabulary. Build what the idea needs; don't force reuse of the same rooms every video.
6. `python3 pipeline/tts.py EP && python3 pipeline/mix.py EP`, then render stills
   (`NODE_PATH=$(npm root -g) node pipeline/render.mjs EP --stills 1,8,15,...`) and look
   at them. Fix anything broken (overlaps, missing props, text off screen) before the
   full render: `NODE_PATH=$(npm root -g) node pipeline/render.mjs EP` (~8 min).
7. Append a row to `episodes/LOG.md`, commit the script and any code changes to `main`
   (never commit .mp4/.wav), push.
8. Deliver: copy the video to `/mnt/project-files/gary-tries-it/NNN-slug.mp4` and post it
   to george with a suggested YouTube title, description and 3-5 hashtags (and the
   YouTube link plus publish time if it was uploaded). The description ends with the credit
   line "Fact rabbit-hole inspired by No Such Thing As A Fish (episode #N). Sources: ..." with
   the sources from `experiment.facts`. Never put the podcast's name in the title.

## Set videos (one-camera 3D sets)

For a video told inside one big three.js set (approved template: `prototypes/archimedes-claw`,
george 2026-11-25), follow the `make-set-video` skill (`.claude/skills/make-set-video/SKILL.md`).
Full renders go to 8 GitHub runners at once via `render-set-request.txt` (free on this public repo).

## Weekly long-form procedure

Format (from the long-form research doc https://claude.ai/artifact/JfZqN3nrHeE5yjaG4FtqZX):
landscape 16:9, more educational. Alternate weekly between:
- "What would happen if...": a big scenario told to "you" (e.g. we discover life on another
  planet) in time-jump chapters (DAY 1 ... YEAR 100), real science, Gary as you.
- Ranked countdown, "How fast would you die...": 8-12 entries ranked slowest to fastest,
  each a mini-scenario with its own label (`#10`, ... `#1`). No death counter on screen.
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
