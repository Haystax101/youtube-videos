---
name: make-set-video
description: Make a "set" video in the one-continuous-camera three.js style (Archimedes claw is the approved template). Use for any Short or long-form told inside one big 3D set with 2D card characters, a moving camera and no cuts.
---

# Making a set video

george approved `prototypes/archimedes-claw/` (25 Nov 2026) after two rounds of notes. This skill
holds every note from those rounds, so the next video should match the look on the first render.
Copy that folder as the starting point. Don't start from an empty page.

## The look

**Quality bar (george, 26 Nov 18:31): quality over quantity.** The successful channels are high
fidelity, vibrant, and NEVER show an asset that looks unrealistic, only stylised. Every model,
character and effect must read instantly as what it is, in one consistent stylised look: no
placeholder primitives, lumpy blobs, mismatched photoreal pieces or odd proportions. Colours are
rich and saturated, lighting shapes every form. If a scene or prop can't reach this bar, cut it or
rebuild it; george would rather post fewer videos than weaker ones.

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
  - **Keep the pearly-white faces we already use** (george, 26 Nov: they "always tend to do well").
    This is not a new style: reuse the existing designs in `people2d.js` from Archimedes/Syracuse
    (`prototypes/archimedes-claw`) and walk-in-circles (Klaus and the hikers) as the reference for
    every new character.
- **Super-detailed, angular environments** (george, 26 Nov: "if we get our scene design super
  detailed and choose quite angular environments, i think that's how we will thrive"). Choose
  settings with strong shapes and hard edges (cliffs, castles, canyons, rooftops, ships, labs,
  stairwells, machinery) over soft open fields, and fill them with layered detail at every
  distance: foreground props, mid-ground structure, background silhouettes.
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
- **Detailed water and scenery.** george (26 Nov, rewatching Archimedes): "the sea could've been more
  detailed". Give water real surface detail (layered normal-mapped waves, foam at hulls and rocks,
  spray, light glints), and use the CC0 textures, HDRIs and plant models in release `assets-v1`
  (`EP/assets.txt` makes render-set.yml fetch them). Keep photoscans light: swiftshader renders on CPU,
  so use models under ~10k triangles and a few hundred instances.
- **Keep the camera clear.** Vegetation and props keep a clear band around the paths cameras fly
  along, and a clearing around close-up props, or low shots end up inside ferns and grass.
- **Time jumps clear the stage.** After "MONTHS LATER", anything that belonged to the earlier
  scene (wrecks, debris, oars, swimmers) sinks or fades away during the label change. v2's
  leftover floating oars at the end "looked a little silly".

## The vivid look (george approved 26 Nov 18:57: "yeah that's nice")

Reference: `prototypes/ref-look/` (tractor cab, stills via `node shot.cjs cab.html out.png 1080 1920 "?shot=A"`).
Comparison with the reference frame: `/mnt/project-files/gary-tries-it/ref-look/comparison.jpg`.
Use it for every new set video on both channels (darker stories can lower `sat` and exposure, but keep the rest).

- **Tone mapping:** `THREE.NeutralToneMapping`, exposure ~1.05. ACES greyed every colour.
- **Grade pass:** saturation ×1.18, contrast ×1.06, a light vignette, **no grain**. The reference is crisp.
- **Smooth shading** (`MeshStandardMaterial`, roughness 0.4-0.8, no `flatShading`) with rounded boxes
  (`RoundedBoxGeometry`) for man-made things. Painted canvas textures for fabric, leaves, wood and dials.
- **Interiors get fill light:** one or two `PointLight`s inside every room or cab, so the inside never goes black
  under the sun's shadow.
- **Plants are painted leaf cards**, never spheres: crossed alpha planes (`alphaTest`) with a leaf rosette or grass
  blades. Sphere crops read as "lumpy blobs" and fail the quality bar. Round tree canopies are fine if they carry a
  leaf texture.
- **Sky:** bright gradient dome, crisp puffy cloud sprites far away (1-1.7 km), two layers of blue hills on the horizon.
- **Characters:** `drawPill()` in `prototypes/ref-look/people2d.js` adds a chunky capsule body (buttons, plaid,
  dungarees, thin ink arms, round hands) under the same pearly-white head; `drawPerson()` (Syracuse stick limbs)
  still works. The card material uses `toneMapped: false` so the ink and whites stay pure.

### No glitching in motion (george rejected the beet-juice Short for "environment glitching throughout", 26 Nov)

Stills can look perfect while the moving video shimmers, so every set page needs these:
- **MSAA through the composer.** `antialias: true` does nothing once an EffectComposer is used; pass it a
  multisampled target: `new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType }))`.
  Leaf/grass cards with `alphaTest` also get `alphaToCoverage: true`.
- **`logarithmicDepthBuffer: true`** on the renderer and near >= 0.05. With near 0.03 / far 3000 the layered
  ground planes (soil over grass, a cm apart) and distant facades z-fought: whole fields vanished for a frame
  and window stripes flashed in the sky.
- **Shadow camera that follows the action moves in whole texels** (snap the focus in light space to
  `2*half/mapSize`), or shadow edges swim every frame.
- **No per-frame jitter.** Camera shake and bobbing under ~20 rad/s; anything faster aliases into noise at 30 fps.
  Spinning wheels with repeated bolts/lugs stay under ~0.25 rad per frame or they strobe.
- **Check motion, not just stills:** run `python3 tools/check_flicker.py VIDEO` (one-frame pops) and look at
  6 consecutive frames from a few shots before delivering.

### Characters move like 3D (george, 26 Nov: "even though the characters are technically 2d... they should still act like they're 3d")

Use `web/lib/stage2d.js` in every set page (import it; don't copy it):
- **Walking:** `walkAlong(route, k, step)` gives the position and `walk` = steps taken, driven by distance, so
  feet don't slide when the walk eases in or out and the legs stop when the card stops. Pass it as `pose.walk`.
  Route walks round furniture; never a straight line through it.
- **Sitting:** `anchorSeat(chair, { seatY, front })` once per chair, then `seatOn(card, chair, camera)` with
  `pose.sit = 1` (bent legs over the seat edge) and `chair.rotation.y = faceCam(chair, camera, wobble)`: a flat
  card can't be seen from behind, so the chair faces the camera. Get up to the front of the seat first, then walk.
- **Self-check:** `window.SETCHECK = makeSetCheck({ sets, cards, movers, camera, render, shotSet })`, then
  `python3 tools/qa.py EP --page EP/page.html` (or `node tools/set_check.cjs EP/page.html 0.05`) must report 0
  on-screen problems: cards inside furniture, chairs seen from behind with someone in them, props hitting
  things, teleports. `tools/tests/stage2d.html` is a worked example that shows each failure once.
- Every character and camera starts inside the room's walls; entrances come through an opened door.
- **Overlap check for 3D characters (george, 26 Nov, on Xbox Underground: "quite a few inconsistencies with
  the objects overlapping"):** every set page with 3D characters (smol-look big heads included) sets
  `window.QA = { scene, camera, actors: () => [{ name, root, head, seat }] }` (seat = the chair someone sits
  on right now) and adds `if (window.NODRAW) return` before drawing. `tools/check_overlap.cjs PAGE` (also run
  by `tools/qa.py`, which now finds the page itself) tests a head sphere and three body spheres per character
  against each other and against every prop's own rotated box, for whatever the camera films. It runs a
  2-minute video in about 10 s. It must report 0 before the full render. What it caught on Xbox Underground
  that stills and the frame checks missed: two walkers' heads merged while walking side by side, heads through
  a door edge and a glass mullion, a head inside a desk top, a judge's head inside his chair back, defendants'
  bodies through their table, an officer's head inside a canopy pillar, a man standing half inside a car, and
  two people "talking" with their heads 20 cm inside each other. Big heads need about 1 m between two people.

## Story and script

- **Length is whatever fits.** Archimedes is 1:17 and george was happy with that. Don't pad, and
  don't cut a real arc to hit 30 s.
- **Hook strength (george, 26 Nov):** our facts are the edge, and the visuals and hook must be
  strong enough to carry them. Use a bold claim to "you" that states the surprising fact or stakes,
  not a soft question; Darwin's "Did Darwin invent the office chair?" was too weak. See the rules
  in the `write-short-script` skill, under "Hook strength".
- **Cold open:**
  - Show the most striking moment while the hook claim is spoken.
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
- **Recorded effects, not synthesised.** george found the synthesised sfx "crude". Use recorded CC0
  sounds from release `sfx-v1` (`tools/fetch_sfx.py`; add keywords to `sfx-keywords.txt`) through
  `pipeline/sfxlib.py`: ambience beds, footsteps, fire, whooshes on whip pans, impacts on turns.
- **Character voices.** Let characters say a line or two in their own voice: Qwen3-TTS via
  `tools/qwen_voice.py` (`"qwen_speakers"` in script.json, GitHub job voice.yml), then
  `tools/retime_voice.py` to bring Qwen's slow read up to pace.
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
   **Faster, free: render on 8 GitHub machines at once.**
   - Give the episode an `audio.sh` (see the claw's), write its folder into `render-set-request.txt`, commit and push (any branch).
   - `.github/workflows/render-set.yml` renders the chunks across 8 runners, joins them, builds the audio and publishes `video.mp4` to the pre-release `render-<slug>-<run id>`.
   - Find the run with `gh api repos/Haystax101/youtube-videos/actions/runs --jq '.workflow_runs[0]'`.
   - Download with `curl -sSL -o EP/video.mp4 https://github.com/Haystax101/youtube-videos/releases/download/TAG/video.mp4`.
   - Use local `--redo` for small fixes and the workflow for full renders.
5. Mux (local renders): `ffmpeg -i silent.mp4 -i audio.norm.wav -c:v copy -c:a aac -b:a 192k -shortest video.mp4`.
   Deliver to `/mnt/project-files/gary-tries-it/<slug>/`.

## Pre-delivery checklist (every note george has given)

- [ ] `python3 tools/lint_voice.py EP` passes before any voicing (Kokoro or Qwen): no "Mt."-style abbreviations, digits, symbols or unexplained acronyms; names have phonetic spellings in `pronounce`.

- [ ] Quality bar: high fidelity and vibrant, and no asset anywhere looks unrealistic or unfinished, only stylised. Otherwise fix or cut it before delivery.

- [ ] `python3 tools/qa.py EP --page EP/page.html --fix` has no FAIL and every WARN is explained, and the contact-sheet review passed (the `qa-video` skill). It covers dark patches and one-frame black tiles (george spotted one at 13 s; the renderers now retry those frames as they render, and `--fix` patches any left), loudness, clipping, static, dead air, voice-over-music balance and continuity. Move cameras that sit inside geometry and re-render with `--redo`.
- [ ] Characters use the same pearly-white faces as Syracuse and walk-in-circles, and the set is detailed and angular.

- [ ] The rewind appears once, after the hook, and nowhere else.
- [ ] The ending is a payoff and a CTA, with no carried-over "you survived".
- [ ] The narration is clearly on top. No sound effect is louder than the voice.
- [ ] The music is all orchestral, with a cue per scene.
- [ ] Captions are on time or slightly early.
- [ ] Nothing clips through or floats. Every machine is mounted.
- [ ] Earlier-scene debris is gone after a time jump.
- [ ] Odd words are pronounced right (listen for ship/period terms).
- [ ] The set is busy in every shot, and the camera is never still.
