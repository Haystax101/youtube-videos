# Script review and sample rewrites (2026-11-25)

## Where the current script process is weak

1. **No writing method, only format rules.** CLAUDE.md says what a script must contain (hook,
   "you", labels, 25-30 s, void ending) but nothing about what makes it good. The daily run writes
   one draft in one pass with no research step, no fact check and no self-review.
2. **Every video is the same shape and the ending is known.** Hook → timeline → myth → death →
   "You died". Ten of ten end in death, so after the hook the viewer already knows the answer.
   There is rarely a turn after the midpoint.
3. **Facts are thin and unsourced.** Lines like "the venom shreds your muscles" or "your heart is
   doing a drum solo" carry no number or mechanism a viewer would repeat. Nothing records where a
   fact came from, so we can't check accuracy.
4. **The history stories have events, not arcs.** 010 Eiffel Tower: he makes a parachute, dummies
   fail, he jumps, he dies. No goal, no stake, no turn. The most interesting true parts (a prize for
   saving pilots, he hesitated 40 s on camera, a Russian actor cracked the problem months later) are
   missing.
5. **The idea list is a list of titles.** `ideas.md` has 19 one-liners, all death-shaped, with no
   seed fact, so each run starts from zero and picks whatever is next.
6. **No competitor input.** Nothing in the repo describes what winning channels do.
7. **We don't learn from script choices.** The `experiment` object records style/speed/hook but not
   the script's arc, ending or fact quality, so analytics can't tell us whether better writing pays.

## What's new (this branch)

- `.claude/skills/write-short-script/SKILL.md`: the writing method: research 4 facts with sources,
  choose the ending first (dies / survives / better off), a five-move arc in 72-82 words, line rules,
  and a 5-point self-score saved in `experiment.scores`.
- `writing/competitors.md`: what Zack D. Films, What If 3D Science, Life Noggin, MiloQ, History
  Matters and george's old Veo Shorts do, how sure we are, and our twist.
- `writing/idea-bank.md`: ~35 ideas with seed facts and endings, including beneficial habits
  (ice bath, sauna, 10k steps), survivable absurd events and true-history stories. No poo topics.

## The three samples, old vs new

### Storybook: Eiffel Tower parachute (010 → eiffel-tower-v2)

| Old 010 (69 words) | New (81 words) |
|---|---|
| WOULD YOU JUMP? What if you tested your own parachute by jumping off the Eiffel Tower? | same hook |
| PARIS, 1911: You're a tailor, and you've invented a parachute you can wear. | PARIS, 1911 (crashed biplane): Pilots keep dying. There's a prize for a parachute that saves them. You sew one. |
| TEST 1: Every dummy you throw drops straight down. Splat. / Not high enough. | TEST 1 (courtyard, broken dummy): Every dummy you throw drops like a rock. / Not high enough! |
| You told us you'd use a dummy! / I am the dummy. | You said you'd use a dummy! / I am the dummy. |
| 8:22 AM: Cameras roll. You hesitate for forty seconds. Then you jump. It never opens. | Cameras roll. You wait forty seconds, jump, and it never opens. |
| (ends) | **JUNE 1912 (new turn):** Months later, a Russian actor's backpack parachute stops a speeding car dead. |
| You died... | You died... |

What changed: a goal and stake (the prize, dying pilots), and a real turn that answers "so did
anyone crack it?" with a surprising true image. Needs 3 new backgrounds (airfield, courtyard,
russia: the car and parachute are in the painted background) and one costume (`russian_actor`).

### Lowpoly, beneficial: ice bath every day (new, compare with 004 sitting all day)

ICE BATH EVERY DAY. WHAT HAPPENS? → DAY 1 the gasp (and it drowns more people than the cold) →
DAY 5 halved → MONTH 1 noradrenaline ×5 → MYTH: after the gym it blunts muscle growth → YEAR 1 you
fall through ice and know to float → "You survived."
First non-death ending, and the payoff is something a viewer could use to save their life.
Needs: `icebath` and `frozenlake` rooms, `gym` room, poses `bath` and `float`, fx `frost`, `gasp`.

### Lowpoly, absurd event: struck by lightning (compare with 006 bees, 008 magnets)

Bolt hotter than the sun's surface blows your shoes off → most current skims your skin, enough stops
your heart → MYTH: you're not electric, people should touch you → a stranger's CPR saves you → you
live with a fern scar, like 9 in 10 → Roy Sullivan was struck 7 times and survived all seven →
"You survived."
Absurd premise, but the turn is survival plus a fact that tells viewers what to do.
Needs: `field` room with storm, fx `lightning`, `rain`; gary `fern`, `barefoot`, hat `ranger`;
pose `collapse`; cast `stranger` with pose `cpr`.

All facts are listed with sources in each script's `experiment.facts`.

## Proposed changes to the daily run (not applied yet)

1. CLAUDE.md step 4: write every Short with the `write-short-script` skill; pick from
   `writing/idea-bank.md` first.
2. Endings: Gary may survive or end better off. Survival ends on Gary alive in the last scene with
   "You survived. Comment what stupid shenanigans Gary should try tomorrow."; death keeps the void
   ghost line. Daily mix: at least one non-death ending per day.
3. Every script logs `experiment.facts` (with sources), `experiment.ending` and `experiment.scores`,
   and the LOG gets an "ending" column so analytics can compare death vs survival vs beneficial.
4. Ban poo/toilet topics.
5. Storybook gets these rewrites as its next test, so its result reflects a strong script.
