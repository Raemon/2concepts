# 07 — Decision

## The two concepts

**Concept A: Fold-back signal** (rank 1 on standalone strength). Some warning signals are *produced by the very
capacity whose loss they report*. So they rise with severity only until severity disables their producer, then
they fall back through "normal". A quiet or falling reading is ambiguous between "fine" and "collapsing".

**Concept B: Refractory-check capture** (rank 2). Where passing an accountability check buys immunity from the next
one, the checked party gains by *running the check on itself*, at a moment and forum it chooses. The check turns
into a shield.

**Emergent concept C: Certified collapse.** When the check reads a fold-back signal, the easiest time to pass it
is past the fold. The immunity then seals the collapsed state away from the next look, or from help. In that regime
a clean pass is anti-informative, and a quiet target that *volunteers* for inspection is showing a symptom.

## Why this pair, against the alternatives

- **It is the top two on standalone strength, from different families.** A is instrument physics; B is strategic
  timing. That obeys the attractor rule from note 04.
- **C passed the four tests in note 05** and has surplus that neither parent has: certificates cluster just
  before scandals, and the volunteered check is a symptom.
- **Both A and B carried a thread that was fun in isolation** in note 06. Placeholder activation, the settledness
  trap and the open top bracket didn't, and they also scored lower as concepts. The game constraint didn't
  overturn the concept ranking; it confirmed it.
- **What I'm giving up:**
  - Placeholder activation has the most vivid single case: the penny Accenture print.
  - The settledness trap has the most morally serious one: Windrush.
  - Both will be mentioned in the write-up as near neighbours.

## Momentum check

The brief warns that the first-prototyped idea tends to win. Fold-back was prototyped first, so I checked whether
it is winning on momentum. It isn't:
- It was ranked first *before* any prototype existed (note 04, written before the game survey was opened).
- Its prototype result was mixed: naive play was nearly as good until shocks were added. I kept it because the
  shock result matches the real-world mechanism (sudden severity), not because it was already built.

## The game, in one paragraph

**HUSH: a night garden.**
- Flowers open as they grow thirsty and close as they wilt; a gust can push one straight past its peak. Tap to
  water, with water scarce.
- An Owl inspects. Catching a flower in visible distress costs you rating. A flower that passes gets a glass
  cloche: no inspection, no water, signal trapped inside. You can drag the Owl to any flower, which is the
  capture.
- Three threads of levels follow:
  1. **Thirst** teaches fold-back.
  2. **The Owl** teaches capture, using simple flowers whose bloom only rises.
  3. **Glass** combines them into certified collapse: the quiet flower that passes inspection and dies under
     glass.
- An endless "Night" mode with a daily seed gives the 30-second arcade loop and a shareable score.

## How the graphics express the concepts

**Each flower's signal history rises from it as a luminous smoke-thread.** The thread's width and brightness at
each height is the bloom at that past moment, and watering leaves a blue bead on it. Three things follow:

- The picture shows signals as *shapes over time*, not levels. The fold-back tell is a thread thinning *with no
  bead* on it: a signal falling with no one having helped.
- A cloche traps the thread, so the certificate visibly blinds you.
- Certified collapse becomes one image: a wilted flower under pristine glass, its smoke coiled and hidden.

The palette is ink-wash indigo with a single accent hue, so the only colour on screen is distress.

## Puzzle verification plan

Breaths are discrete ticks of about 0.6 s, which makes levels deterministic and searchable. A shared logic module
serves both the game and a Node solver. For each level the solver must show three things:

1. **Solvable:** a winning action sequence exists.
2. **Not solvable under ordinary rules.**
   - *Thirst levels:* ordinary = "the more open, the more urgent". Water only among the most-open flowers.
   - *Owl levels:* ordinary = never summon the Owl, since inspections are something that happens to you.
   - *Glass levels:* fails under either restriction, and also fails if every quiet-looking flower is treated as
     safe to certify.
3. **Recorded:** each claim is written to `docs/process-v2/solver-report.md`.
