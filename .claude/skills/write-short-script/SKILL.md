---
name: write-short-script
description: Write or rewrite a Gary Tries It Short script (script.json) with a real story arc, a real surprising fact and a useful payoff. Use whenever a daily run picks an idea and writes episodes/NNN-slug/script.json, or when asked to improve a script.
---

# Writing a Gary Tries It Short

The script is the main lever (george). Style and render only carry what the script gives them.
Read `writing/competitors.md` once per run and pick the idea from the No Such Thing As A Fish
fan fact list (see CLAUDE.md step 3; george 2026-11-25: sole source for now). A row there is a
lead, never a source: research the original study yourself and write it in your own words. CLAUDE.md's format rules (hook beat, "you", 25-30 s, cold open,
labels, `experiment` object, no counter, plain titles) still apply; this skill is how to make
the words good.

## 1. Research before writing (5 minutes, not optional)

Write these down in the `experiment.facts` array of script.json, each with a source:
- **The "wait, what?" fact**: one true thing most viewers don't know, ideally with a number
  ("the gasp drowns more people in icy water than the cold does").
- **The mechanism**: *how* the thing happens, in one plain sentence. This is the spine.
- **The turn**: a reversal, irony, survival, or the real-world twist (who else did it, what
  happened next, what it changed).
- **The useful bit** (if there is one): what the viewer should actually do.
If you can't find a "wait, what?" fact that is true, drop the idea. Don't pad with vague
lines like "your body starts to suffer".

## 2. Choose the ending first

Gary does **not** have to die. Pick the ending that the true facts support:
- **Dies**: only if death is the real, interesting outcome and the route there has a turn.
- **Survives**: most absurd events are survivable (90% of lightning strikes). Surviving with a
  weird consequence is often the better surprise.
- **Better off**: beneficial habits (ice baths, sauna, walking 10k steps, quitting sugar).
  Show the cost AND the pay-off honestly, including a myth or a catch.
Endings: death keeps the void ghost and "You died. <CTA>"; otherwise end on Gary alive in
the last scene with "You survived. <CTA>" or "You're stronger than ever. <CTA>". The CTA is the
one CLAUDE.md's ending A/B test assigns to this Short; record it in `experiment.ending_cta`.

## 3. Arc: five moves in ~78 words

| Move | Beats | Job |
|---|---|---|
| Hook (cold open) | 1 | The most extreme image + the plain question. ≤ 12 words. |
| Setup | 1 | Why you're doing it / what triggers it. One line. Skip if the hook says it. |
| Escalation | 2-3 | Each beat is worse (or better) AND teaches the mechanism. A number per beat if possible. |
| Turn | 1 | The myth-bust, reversal, irony or twist. The moment a viewer says "huh". |
| Payoff + outro | 1-2 | Outcome, the useful takeaway, then the fixed comment line. |

Word budget: our past episodes ran ~2.6 words/s including pauses (76 words = 29.4 s), so
**72-82 words total** including the 10-word outro = 28-31 s. Count them. Beats are 8-15 words
(3-6 s on screen).

## 4. Line rules

- Second person, present tense, short sentences. Concrete nouns, numbers, body parts.
- Every line opens a loop or answers the last one. Use "But", "Then", "So" to chain.
- One idea per line; the label carries the time (DAY 1, MINUTE 2, 8:22 AM, PARIS 1911).
- Dialogue (2-4 words) only when it's a joke or a turn ("I am the dummy.").
- Ban: "your body starts to suffer", "things get worse", "little did you know", rhetorical filler,
  any fact you couldn't source. No poo/toilet/gross-scatological topics.
- Titles: the plain premise ("What happens if you take an ice bath every day?").
- Loop: when it fits, make the last image or line echo the hook.

## 5. Self-check before saving (score honestly; rewrite anything under 4/5)

1. Would a stranger learn one true thing they'd repeat to a friend? (fact)
2. Is there a turn after the midpoint, or is it a straight line to the obvious end? (arc)
3. Is the first frame the strangest image in the video? (hook)
4. Does every beat change something on screen and in the story? (pace)
5. 72-82 words, every fact sourced in `experiment.facts`? (craft)
Record the five scores in `experiment.scores`. Log them so we can later check whether high
scores predict retention.

## 6. True-history extras (storybook style is paused; write these for low-poly)

- Real people, real dates, real quotes where they exist. Give the hero a goal and a stake
  (a prize, a rival, a deadline), not just an accident.
- One funny dialogue exchange, then the turn: what history did next (who succeeded, what it
  changed, what survives today). That turn is the "useful/interesting" payoff.
- Background prompts can carry props (a 1912 car with a parachute behind it) so you don't need
  new 2D props. New costumes go in `web/storybook.js` WARDROBE.
