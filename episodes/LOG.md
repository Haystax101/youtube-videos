# Episode log

| # | Date | Concept | Deaths after | Experiment | Result (views / avg % viewed) | Ending / CTA |
|---|------|---------|--------------|------------|-------------------------------|---|
| 001 | 2026-11-24 | Wearing a face mask 24/7 | 1 | Baseline: cartoon style, speed 1.12, narrator am_michael, "how long until you die" hook | 184 views (24 Nov, analytics pending) | dies / shenanigans |
| 002 | 2026-11-24 | Never sleeping again | 2 | STYLE TEST noir: b&w film + grain + blinds, typewriter captions, am_onyx, speed 1.06, slow minor music. Hook unchanged | | dies / shenanigans |
| 003 | 2026-11-24 | Drinking 10 litres of water a day | 3 | STYLE TEST news: BREAKING lower third + fact ticker, karaoke captions (Anton), af_heart, speed 1.15, urgent music. Hook unchanged | | dies / shenanigans |
| 004 | 2026-11-24 | Sitting down all day, every day | 4 | STYLE TEST lowpoly: faceted 3D low-poly people (Gary rebuilt as a jointed 3D human, plus a voiced doctor bf_emma), floating diorama rooms, real poses + death collapse, Poppins extruded captions, NO deaths counter, speed 1.16, F-Am-Dm-G 96 bpm. Hook unchanged | | dies / shenanigans |
| 006 | 2026-11-24 | Stung by 1,000 bees (absurd single event) | - | NEW RULES DEMO: 29 s, cold open on the swarm, premise label "1,000 BEE STINGS. THEN WHAT?", SECOND/MINUTE/HOUR labels, plain premise title, lowpoly, speed 1.18 | | dies / shenanigans |
| 007 | 2026-11-24 | Groom of the Stool: you wipe Henry VIII's bottom (true history story) | - | STYLE TEST storybook: AI painted backgrounds (free Cloudflare FLUX) + 2D costumed cast with dialogue (MiloQ-inspired, our own look); funny true-history format; 34 s | | dies / shenanigans |
| 008 | 2026-11-25 | Swallowing two magnets (absurd single event) | - | lowpoly, cold open on the X-ray in hospital, premise label "SWALLOW 2 MAGNETS. THEN WHAT?", SECOND/HOUR/DAY labels, myth-bust beat, 29.6 s, speed 1.18 | | dies / shenanigans |
| 009 | 2026-11-25 | Drinking only energy drinks | - | lowpoly life change, cold open slumped in a sea of cans, hook label "ONLY ENERGY DRINKS? HOW LONG?", 29.5 s, speed 1.2 | | dies / shenanigans |
| 010 | 2026-11-25 | Testing your own parachute off the Eiffel Tower (true story, Franz Reichelt 1912) | - | STYLE TEST storybook #2: true-history story, hook "WOULD YOU JUMP?", policeman dialogue, 28.2 s (fixed length vs 007's 34 s) | | dies / shenanigans |
| 011 | 2026-11-25 | Eiffel Tower parachute v2 (rewrite of 010 with the new script skill) | - | STYLE TEST storybook #3 + SCRIPT TEST: goal (prize), joke, death, turn (Kotelnikov's backpack parachute stops a car); sourced facts; 30.6 s. Post instead of 010 | | dies / follow |

## Style locked to low-poly (george, 2026-11-25)

Both storybook Shorts got ~0 views and were deleted (007 Groom of the Stool, then the Eiffel Tower
parachute). Style tests are on hold; every Short is low-poly so the channel has one consistent look.
Experiments continue inside low-poly (writing/experiments.json).

## Style test plan (george, 2026-11-24; superseded above)

george wants to try different visual styles, formats and caption treatments and see what works.
One video can't separate idea, hook and style, so run each style on several episodes (aim for 3+
each) before judging, keep the hook template fixed while styles are being compared, and compare
average % viewed and the retention curve's first 3 seconds per style. Styles so far: `cartoon`
(001), `noir` (002), `news` (003), `lowpoly` (004, its own renderer web/lowpoly.js), `paper` (005, own
renderer web/paper.js, on its branch until merged).

2026-11-24 update: george felt noir/news were "just a filter" on the same character. Don't add more
filter-only styles. Real style changes mean new characters/art direction; don't force every video in a
style to reuse the same assets. No on-screen "times died" counter from now on.
**lowpoly is the default style from 2026-11-25** (best early views); use other styles only as deliberate tests.

## 2026-11-24 evening analytics take

Early views/hour: sat down (low-poly) ~175/h, "would you actually survive this long?" ~125/h, face
mask ~70/h, never sleeping (noir) ~50/h. Old Veo Shorts: 10,000 grass snakes 18k views 95% viewed
24 s; sneeze 2.8k 82%; sweat 2.5k 70%; lava 1.4k 72%. Take: length (24-31 s vs 45 s), a single vivid
absurd premise, and titles that name it matter more than style. Rules updated in CLAUDE.md step 4.

## 2026-11-25 analytics take

Retention still null from the API (lag). Public views: 006 bees 1177 and 004 sitting 1095 (both
lowpoly, short, vivid premise) lead; 001 643; 005 paper 237; 002 noir 195. Keep lowpoly + absurd
premise as the base; storybook gets a second test (010) at the 25-30 s length before judging it.
