---
name: make-set-video
description: Make a "set" video in the one-continuous-camera three.js style (Archimedes claw is the approved template). Use for any Short or long-form told inside one big 3D set with 2D card characters, a moving camera and no cuts.
---

# Making a set video

george approved `prototypes/archimedes-claw/` (25 Nov 2026) after two rounds of notes. This skill
holds every note from those rounds, so the next video should match the look on the first render.
Copy that folder as the starting point. Don't start from an empty page.

## The look

- **One big persistent world.** Build one set per video in three.js 0.170: a castle, a harbour, a
  lab, a body. Use one camera and no cuts. The camera is always moving, with eased pushes, slides
  and cranes between targets.
  - `SHOTS = [{at, to, f(w) → {p, l, fov}}]`. The camera blends from the previous shot over
    `at..to` with smootherstep.
  - Add a small shake on impacts.
- **Low-poly, warm and readable.**
  - `MeshStandardMaterial` with `flatShading` and roughness 0.9.
  - `NeutralToneMapping`, PCF soft shadows, distance fog.
  - A gradient sky dome (cross-fade it to a starry night dome when the story needs night).
  - Saturated but natural colours.
- **2D card characters** drawn per frame by `people2d.js` `drawPerson(ctx, W, H, kind, pose, expr, t, seed, opts)`.
  - Use your own designs: thick outline, big readable expressions, period outfits. Never copy
    another creator's characters.
  - Add new kinds and poses there. Cards more than 35 m from the camera redraw at 8 fps.
- **Dense, living set.**
  - Crowds on walls and crews on ships, background ships and gulls.
  - Defenders who cheer when something works.
  - Something moves in every frame.
  - Empty walls looked cheap in v1.
- **Physical honesty.** Nothing floats and nothing passes through meshes.
  - Machines sit on their mounts.
  - Beams pivot on posts that actually reach the pivot.
  - Projectiles leave from the arm tip.
  - george spotted the claw clipping the castle in v1. Check every moving part against what it
    swings past.
- **Time jumps clear the stage.** After "MONTHS LATER", anything that belonged to the earlier
  scene (wrecks, debris, oars, swimmers) sinks or fades away during the label change. v2's
  leftover floating oars at the end "looked a little silly".

## Story and script

- **Length is whatever fits.** Archimedes is 1:17 and george was happy with that. Don't pad, and
  don't cut a real arc to hit 30 s.
- **Cold open:**
  - Show the most extreme moment while the hook question is asked.
  - Then play exactly **one** rewind: a `◀◀ REWIND` overlay, a scanline effect and the camera flying back along its path for 1 s.
  - george loved it. It must never appear again later.
    - Pauses in the voice are **not** rewinds. v2 showed the overlay in the story pauses and it read as "going back in time" when time was going forward.
    - The overlay's visibility is tied to `HOOK_END <= t < HOOK_END + RW` only.
- **Ending framing:**
  - Don't use "You survived / You died" endings when the story is history or a fact rather than a
    Gary premise. george: "feels carried over from the previous videos".
  - End on the payoff line ("One old man held off the Roman army with maths."), then the CTA.
- **Pauses before big turns:**
  - Insert silences into the voice with `GAPS = [[voiceTime, seconds]]`, e.g. 1.2 s before "when the city finally falls".
  - Slower moments (night, a death) need room to land.
- **Labels:** escalate time or stakes ("RANGE: EVERYWHERE", "MONTHS LATER", "212 BC"), using `*word*` for red.
- **Facts:**
  - Facts are sourced in `experiment.facts` as for Shorts.
  - Use one "real or myth?" beat when the evidence is shaky.
- **Pronunciation:**
  - Kokoro gets some words wrong. "Bow" (of a ship) came out as in bow-and-arrow.
  - Add `"pronounce": {"bow": "bough"}` to script.json. The caption keeps the real word and only the spoken text changes.
  - Check with `k.tokenizer.phonemize(text, 'en-us')` (`/baʊ/` is right).
  - Add repeat offenders to `PRONOUNCE` in `pipeline/tts.py`.

## Time model (claw.html)

`video t → voice v → world w`:

- **Hook:** `t < HOOK_END` shows world `HOOK_W0 + t`, the climax.
- **Rewind:** for `RW = 1 s`, world eases back to `HOOK_END`.
- **Story:** after that, `w = t − RW`, and the camera, people and events run on world time.
- **GAPS:** `voiceT()` returns null inside a gap. World events after a gap at voice time g must add the gap length.

Key words in `timeline.json` give the exact seconds to hit, such as the grab or the splash.

## Captions

- Show one word at a time in big type with a stroke. Key words are red.
- Captions **lead** the voice by 0.14 s, with a 0.06 s pop-in. Without the lead they read as lagging (george, v1).

## Music and sound

- **Music** comes from `score.py`, using `pipeline/sf2.py` and the GeneralUser GS soundfont (`setup.sh` downloads it). These are real orchestral samples, free and offline.
  - **Use one orchestra for the whole video:** strings, brass, horns, timpani, taiko, choir and woodwinds.
  - **Give each scene its own cue**, varying tempo and emotion. For example: a tense cold open, a march with a theme for the hero, stabs and a choir climax on the big moment, a lighter pizzicato cue for comedy, slow strings and cello for loss, and the theme resolving at the end.
  - Synth music "doesn't make sense" for history and war (george). Never mix styles.
  - Accent the big moments with a hit placed on the exact world time.
- **Mix** (`mixclaw.py`) puts the narration on top:
  - Music at 0.36 of peak, ducked 55% under the voice.
  - Sound effects ×0.18 through a `0.15·tanh` soft limit. In v1 they were "WAY too loud".
  - Then `loudnorm I=-14 TP=-1.5`.
  - Ambience (waves, crickets at night) stays quiet.
- **The rewind** gets a reversed, pitched slice of the music plus a tape squeal, and nothing else.

## Workflow

1. Write script.json, then `python3 pipeline/tts.py EP` (check pronunciations).
2. Build the set and the SHOTS. Render stills at every shot and transition:
   `node rend.cjs stills 1,5,9,...` (about 1 s each).
   - Look for the camera inside walls or houses, behind sails, or too close to ships.
   - Look for floating or clipping props, empty areas, and text off screen.
3. Run `python3 score.py EP && python3 mixclaw.py EP`, then loudnorm.
4. Render with the chunked, cached renderer:
   `NODE_PATH=$(npm root -g) node pipeline/render_set.cjs EP --page claw.html --workers 4`
   - It renders 2 s chunks into `EP/chunks/` and joins them into `EP/silent.mp4`.
   - After a fix, re-render only what changed with `--redo 54-80` (seconds).
   - Audio-only changes need no re-render at all, just a re-mux.
   - `--part k/n` splits one video across machines or CI jobs.
   - Speed is about 0.55 s per frame on a 4-core box (2 s takes about 35 s), so a 75 s video takes about 20 minutes.
5. Mux: `ffmpeg -i silent.mp4 -i audio.norm.wav -c:v copy -c:a aac -b:a 192k -shortest video.mp4`.
   Deliver to `/mnt/project-files/gary-tries-it/<slug>/`.

## Pre-delivery checklist (every note george has given)

- [ ] The rewind appears once, after the hook, and nowhere else.
- [ ] The ending is a payoff and a CTA, with no carried-over "you survived".
- [ ] The narration is clearly on top. No sound effect is louder than the voice.
- [ ] The music is all orchestral, with a cue per scene.
- [ ] Captions are on time or slightly early.
- [ ] Nothing clips through or floats. Every machine is mounted.
- [ ] Earlier-scene debris is gone after a time jump.
- [ ] Odd words are pronounced right (listen for ship/period terms).
- [ ] The set is busy in every shot, and the camera is never still.
