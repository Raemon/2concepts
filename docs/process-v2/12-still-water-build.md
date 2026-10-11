# 12 — Building STILL WATER

The design is in [11-redesign](11-redesign.md). This note covers what was built, what the solver and the tests
found, and what changed because of them.

## The rules, as built

Everything below is visible on screen. Nothing is a hidden counter.

| Thing | Rule |
|---|---|
| **Throw** | Tap the water. The ring arcs from the tower and lands where you tapped, 0.4–0.9 s later depending on distance. Anyone in trouble close enough grabs it and is hauled in, 0.7–2.2 s. Shifts have one or two rings. |
| **Struggling** | Waving, splashing, "HELP!", sound rings pouring off them. A struggler grabs a ring that lands fairly close. |
| **Drowning** | After the struggle runs out they go **quiet**: upright, head tipped back, no splashing, no sound. For 80% of the time they have left, they look like someone calmly treading water. Only then do they visibly go under. A drowning swimmer can't reach for rescue equipment (Vittone again), so the ring has to land almost on them. |
| **Silent drowners** | Some swimmers skip the struggle and go straight to quiet drowning. |
| **Decoys** | Treaders and floaters are quiet too, and fine. |
| **Whistle** | Every 2 s at most. The sound rolls out from the tower. Everyone fine answers "OK!", and strugglers keep yelling. Whoever doesn't answer gets a red marker that stays on them. |
| **The Captain** | Visits on a schedule, with a 4 s countdown, or comes in 1 s when you radio him. He looks for 1.6 s. While he looks you stand with him and can't throw, and the screen shows **only what he sees**: the noise. Someone yelling for his whole look is a strike. A clean look earns a star and 20 s of trust, during which he skips scheduled visits. You can't radio him while anyone is yelling; after a strike, not for 6 s. |
| **End of shift** | Anyone lost ends the shift. In Captain shifts, one strike and you're fired. Points are 100 per rescue, plus up to 50 for speed, plus 50 for a quiet save, plus 100 per clean inspection. Stars come from points. |

How each concept shows up:

- **Fold-back signal.**
  - The struggler's noise is produced by the strength they're losing, so it falls exactly when they get worse. On
    screen, their sound rings fade *without a rescue*.
  - The first time it happens the game slows down and says so: "Quiet is worse".
  - The whistle is the probe, and it's the real lifeguard technique: ask "are you all right?", because someone
    drowning can't answer (Vittone, *Drowning doesn't look like drowning*). That makes it the dilution test in
    physical form: give the system a small push and see whether the signal comes back.
- **Refractory-check capture.** He inspects, and a clean inspection buys immunity. So you invite the check at a calm
  moment and use the trust to cover the visit that would have landed in a rush. Occupying the checker shows up as
  its own cost: while he looks, you can't throw.
- **Certified collapse.**
  - He judges by noise, and you can only call him when nobody's yelling. So the only moments you can invite a check
    are the quiet ones, which is when silent drowners go unseen.
  - Captain vision shows the beach through his eyes: quiet swimmers vanish.
  - A clean look while someone is drowning stamps the beach **SAFE ✓** and tags the drowner "certified safe…".
  - If someone is lost within seconds of a certificate, the result card says so.

## Verification

### Solver ([solver-report](solver-report.md))

`src/solver.js` shares `logic.js` with the game.
- It plays with perfect aim, decides every 0.25 s and reacts 0.3 s after something becomes visible.
- It searches exhaustively over that grid, depth-first with memoization, so "no plan" is a proof at that grain.
- A **policy** says which ideas the player has:
  - **ordinary**: only someone yelling gets a ring (the Captain's own rule).
  - **noWhistle**: spots a quiet drowner only once they visibly sink, or if it saw them yell first.
  - **noCall**: never radios the Captain.

Every level is won by the full policy. Every concept level has **no plan** under the policies its thread must need:
- *Quiet* fails under ordinary.
- *Not waving* and *Rush hour* fail under ordinary and noWhistle.
- *Your timing* and *Twice* fail under noCall.
- *Clean bill* fails under ordinary and noCall.
- *Last light* fails under all three.

*First shift* and *Inspection* are tutorials and are exempt.

Two fairness problems the solver exposed, and what I changed:

1. **The first solver was clairvoyant about the whistle.**
   - It whistled exactly when a hidden state changed: someone had just started drowning silently. No human can do
     that.
   - Now the whistle runs as a *routine* (whenever it's ready), never timed by hidden information.
   - A missed answer leaves a persistent marker, so the player doesn't have to remember who failed to answer.
2. **Solvable by a machine isn't solvable by a person.**
   - I added a **relaxed human** model: 0.9 s reactions, whistling only every 4 s. Every level must be won by it
     too.
   - With 2 s whistling, *Not waving*, *Rush hour* and *Clean bill* first failed this test. I retuned them by
     search (a small tuner over drowning times) until the relaxed human wins and the restricted policies still
     have no plan.
   - At a 0.3 s reaction time, every level also tolerates up to 1.5 s.

The search also found a refractory-capture exploit:
- Radio the Captain at second 0, while the water is still calm, and his trust covers the first scheduled visit.
- That's the concept working, so it stays.
- But it let *Clean bill* skip its point. Two fixes:
  - The visit moved later.
  - You can no longer call while someone is yelling. That is also simply truer to the concept: the target invites
    the check when it *looks* good.
- Now the solver's winning line in *Clean bill* is the intended story:
  1. Clear the water and call in the calm.
  2. The Captain stamps the beach safe just as a silent swimmer starts drowning.
  3. Whistle, flag her, save her.

### Endless summer (`tools/endless-bots.js`)

Endless is a seeded day: trouble comes faster as it goes on, the Captain drops by every 35–50 s, and three
swimmers lost or three strikes ends it. Simple greedy bots, 12 seeds:

| Bot | Lasts (average) | Saves |
|---|---|---|
| Knows all the ideas | 295 s | 91 |
| No whistle | 121 s | 19 |
| Ordinary (only yelling counts) | 98 s | 14 |
| Never calls the Captain | 308 s | 98 |

The fold-back ideas dominate. Calling the Captain is roughly neutral for a naive bot in Endless. Its value is
proved in the levels, not here.

The first balance pass was worse: the full bot was fired in 12 of 12 runs. Two causes:
- A failed self-called inspection could be retried instantly, so strikes chained.
- Anyone who *started* yelling during the 1.6 s look counted, which made late-game inspections a coin flip.

Fixes:
- A 6 s cooldown after a strike.
- A strike now needs someone yelling for his whole look.

### Widget and UI tests

- `tools/e2e.js` plays every level through the real page with real mouse clicks (throws on the canvas, Whistle
  and Call buttons), following the solver's plan with the clock held in lockstep. All nine levels are won and
  each result card appears.
- `tools/harness-test.js` loads the build in a `sandbox="allow-scripts"` iframe via `srcdoc`, as LessWrong does.
  - At 340, 500 and 700 px: no errors, no horizontal overflow, and `localStorage` throws but is handled.
  - Reported heights are 480, 559 and 743 px. A level starts and runs inside the sandbox.
- `tools/touch-test.js` (Pixel 5 profile, inside the sandbox):
  - Before the reader taps, the board has `touch-action: pan-y`, so swipes scroll the post.
  - The first tap only activates the board; the second throws.
  - The test found a bug: tapping the post *outside* the iframe never deactivated the board, because a sandboxed
    frame can't see the parent's events. Fixed with the frame's `blur` event, which also pauses the game.
  - The game also pauses when scrolled out of view or when the tab hides.

### Changes from looking at screenshots

- Swimmers were too small to read on a phone: radius 7 px at 380 px wide, now 9.5 px.
- Banners covered the swimmer they described. They now sit at the opposite end of the water.
- Strugglers showed two stacked HELP bubbles after a whistle. Now one.
- The Captain's jeep parked on an umbrella.
- The whistle button showed in shifts before it's introduced. It's now hidden in the first two.

## What I can't verify from here

- **Fun.** The design targets "fun in 30 seconds": the first rescue is about 2 seconds into shift 1, with a "tap
  near me!" pointer, and every rescue gets a splash, a chime, points and confetti. But nobody has played it but me
  through scripts. The biggest risks:
  - The whistle could become a button you mash every 2 s. It's free, by design: lifeguards scan constantly.
  - The Captain thread is more abstract than the swimming.
- **The noWhistle model is conservative.** A sharp-eyed player can spot a quiet drowner before the whistle: they
  don't make the faint ripples a treader does, a hole in the noise map. That's the same idea (silence as signal)
  read by eye, so I count it as using the concept, not as a way around it.
- **Sound** was only checked for errors, not listened to.
