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
| 012 | 2026-11-26 | Sheltering under a manchineel tree in the rain (Fish #313) | - | new beach set + manchineel tree, rain fx, apple; dare hook, chiptune, bf_emma, speed 1.28, chunky Gary | | survives / comment_next |
| 013 | 2026-11-26 | A fish swallows an eel and it escapes through the gills (Fish #574) | - | FIRST no-Gary Short: underwater set, predator fish with X-ray, segmented eel; question hook, hype, af_bella, speed 1.12 | | survives / follow |
| 014 | 2026-11-26 | Never getting out of bed (Dallas bed-rest study; Fish #443 lead) | - | new bedroom set, lie + jog poses; number-first hook, epic, am_fenrir, speed 1.2, low poly | | better / shenanigans |
| 015 | 2026-11-27 | Roosevelt shot in the chest, then gave his speech anyway (Fish #342) | - | Smol look daily (World of How style): street + 1912 car, rally hall with 40-seat audience, pocket close-up (bullet through 50 pages + steel case), hospital x-ray; statement hook, suspense score, am_michael (re-voiced: george found af_nicole whispery), speed 1.28, 32 s; v2 pearly faces + DoF fix | | survives / comment_next |
| 016 | 2026-11-27 | Ride a bike into space off Mars's smallest moon, Deimos (Fish #264) | - | Smol look, 'you' as a big-head astronaut: Deimos surface set with lander, balance and bread, Mars backdrop, orbit diagram; number-first hook, hype score, bm_george 1.12, 40 s, absurd single event | | better / follow |
| 017 | 2026-11-28 | Doctors in Vietnam saved a man from methanol poisoning by pumping 15 cans of beer into him (Fish #280) | - | Smol look, told straight (no Gary): courtyard party, inside-the-liver set with enzyme chomper and molecule characters, hospital ward with funnel drip and can stack, hospital front; short statement hook 'Doctors saved his life by pouring in beer.', doctor's line in its own voice (bm_lewis) with a moving mouth, suspense score, af_bella 1.28, 30 s, true history | | survives / comment_next |
| shiratori | 2026-11-27 | Yoshie Shiratori, the man no prison could hold (Fish #608) | - | FIRST smol-look Short (george's reference style): 3D big-head characters with ink outlines, bright 3D sets, 31 quick cuts with whip pans and DOF, koto/taiko score; bold claim hook, am_michael 1.2, 48 s (prototypes/shiratori) | | better / follow |

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

## 2026-11-26 analytics take

Retention/avg % viewed still null from the Analytics API, so no test can be judged yet. Public views: 006 bees 1,208, 004
sitting 1,120, 001 face mask 1,106, 009 energy drinks 784 (in ~1 day), 005 sun 627, 002 noir 503. Every lowpoly
Short is in the top four; 009 is the fastest riser. Today: first no-Gary Short (013), first female narrators on lowpoly.


27 Nov: analytics so far: 006 bee stings holds 69% avg viewed on 1,195 views, the best by far (short, absurd single event); 001 55.9%, 002 52.6%, 004 47.4%, 005 46.6%. Shorter, single-event Shorts keep people watching longest, so 015 is cut to 39 s (Shiratori was 48 s). Today's only Short is the Roosevelt one: quality first, one finished through the gate.
28 Nov: analytics: 006 bee stings still leads at 69% avg viewed (1,216 views), 009 energy drinks 64%; short single-event Shorts with about 20 s average watch hold best, and the faster 1.18-1.2 speed arms lead so far. No test has enough videos to decide yet. One Short today (017 beer), quality first; the other two arm sets were held back.