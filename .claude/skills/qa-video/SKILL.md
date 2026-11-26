---
name: qa-video
description: Quality gate for a finished video. Run before any video (daily Short, set video, long-form, dark story) is delivered to george or copied to the project folder; it runs the automatic checks and then the Claude review of the contact sheet.
---

# Quality gate before delivery

george should never be the one to spot a black frame, static, a quiet mix, a character walking through a
chair or a blob of a prop. Nothing goes to `/mnt/project-files/` until this passes.

## 1. Automatic checks

```
python3 tools/qa.py EP_DIR [--page EP_DIR/page.html] [--stems EP_DIR/music.wav,EP_DIR/sfx.wav] [--fix]
```

- `EP_DIR` is the episode or prototype folder; the video defaults to `EP_DIR/video.mp4` (`--video FILE` for another).
- `--page` for set videos whose page has `window.SETCHECK` (continuity: clipping through furniture,
  chairs seen from behind, pops). Always pass it when the page supports it.
- `--stems` for any separate music/SFX stems: static in a stem is a FAIL even when the mix hides it.
- `--fix` patches one-frame black tiles into `video.fixed.mp4` (original audio kept). Deliver that file.

It prints PASS / WARN / FAIL per check and writes `EP_DIR/qa/qa.json` and `EP_DIR/qa/contact.jpg`.
Set-video renders on GitHub run it in the join job and attach `qa.json`, `contact.jpg` and
`frame_guard.json` to the render release: download those with the video and read them.

**Every FAIL must be fixed** (or the video dropped, per the quality bar). Usual fixes:

| Check | Fix |
|---|---|
| black | `--fix`, or re-render the chunk (`render_set.cjs --redo a-b`) |
| loudness | two-pass `loudnorm=I=-14:TP=-1.5` on the mix (`pipeline/mix.py` does this for daily Shorts) |
| clipping | lower the peak / soft-limit before loudnorm |
| hiss | find the SFX or Qwen line at those times; swap noise-based SFX for a recorded CC0 one, low-pass Qwen lines at 6 kHz |
| balance | music/SFX too loud under narration: duck harder or lower the bed |
| continuity | move the walk path / seat anchor, re-run until 0 on-screen problems |
| flicker | a big one-frame pop = a surface vanishing (z-fighting) or a character jumping: apply "No glitching in motion" in make-set-video (MSAA composer target, near >= 0.05 / tighter far or log depth, texel-snapped shadow camera, slower shake and wheel spin) and re-render those chunks |

**Every WARN gets a look**: open `EP_DIR/qa/flicker.jpg` (before / pop / after, pops in magenta) and decide
each one: a blink, snow or sparks are fine; a flashing facade, ground vanishing, shadow swimming or a prop
jumping is a FAIL. Also: a `dark` stretch must be a dark shot on purpose (not the camera inside a
wall); a `freeze` must be a held end card; `guard` frames are ones the renderer could not get clean.
Check those times with frames from `ffmpeg -ss T -i video.mp4 -frames:v 1 -update 1 f.jpg`.

## 2. Claude review of the contact sheet

Open `EP_DIR/qa/contact.jpg` with the Read tool (about one frame per 1.5 s of every beat, labelled with
its time). Grade every frame against the quality bar in CLAUDE.md step 6 and the make-set-video skill:

- Anything unrealistic or unreadable: blobs, placeholder boxes, broken proportions, mismatched styles.
- Characters floating, sinking into the floor, cut by walls/furniture, sitting on nothing, seen from behind.
- Text off screen, captions covering faces, labels overlapping.
- The camera inside geometry, empty or flat-looking frames, dull washed-out colour.
- Continuity: props or characters popping in/out between neighbouring frames that shouldn't.

Zoom in on anything doubtful by pulling the full-size frame at that time. Then add your verdict to
`EP_DIR/qa/qa.json` as `"review": {"result": "PASS" | "FAIL", "notes": [...]}`. FAIL means fix and re-run.

## 3. Deliver

Only when `qa.json` has `"result": "PASS"` and a PASS review: deliver as usual, and mention any WARN you
judged fine in one line of the post if george might notice it.
