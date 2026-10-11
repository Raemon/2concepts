# 06 — Prototypes (brief, before committing)

Four concept threads were prototyped, each judged on two questions:

- **(a) Fun in isolation:** would an ordinary person enjoy it in the first 30 s, and does it have depth after that?
- **(b) Concept-necessity:** is there a situation that can't be handled without thinking in the concept?

Two were coded (`proto/p1-foldback.html`, `proto/p2-refractory.html`). Two were paper prototypes: a written
play-through of the first minute. Code would have added little, because their problems showed up on paper.

## Prototype 1: Fold-back signal as triage (coded)

Flowers on a night pond. Thirst rises, and the bloom (the signal) opens with thirst up to a peak, then *closes*
as the flower wilts. Tap to water; water is limited.

**Simulation, 300 seeded nights, 9 flowers.**

| Policy | Survivors, base | Survivors, frequent shocks |
|---|---|---|
| "Water the most open bloom" (naive, monotonic reading) | 6.79 | 5.14 |
| Belief tracker (watches for sudden closings, uses the "water and see if it opens" test) | 7.68 | 5.99 |
| Oracle (sees true thirst) | 7.97 | 6.13 |

- **Finding:** without shocks the naive policy is nearly as good (8.9 vs 9.0), because you catch flowers on the
  way up. The concept only matters when something can pass the fold unseen. Sudden shocks do that (a gust pushes a
  flower straight past its peak), and so do flowers that start past it.
- **Real-world parallel:** sudden severity (AF447, Hurricane Maria) is exactly when fold-back bites.
- **Design consequence:** shocks are a core mechanic, not decoration.
- **Gotcha found:** my first "aware" policy was *worse* than naive. It misread a shock that lands near the peak:
  the bloom opens further, yet the flower is past the fold. Inference needs the shape of the change, not just its
  sign.

**(a) Fun:** yes. Tap-to-help is instant, the twist ("it closed suddenly — it's dying, not calm") lands within a
minute, and the "water it and it *opens*" test is a small magic trick.
**(b) Necessity:** yes, demonstrably, with scripted shocks.

## Prototype 2: Refractory-check capture as stealth (coded)

A fox with hens and hounds. A hound that sniffs you while you carry nothing "clears" you for 4 s, and cleared
foxes are ignored. You get sniffed on purpose while clean, then raid during the window.

**(a) Fun:** yes. It's mischievous and immediately legible; Pac-Man's power pellet is the nearest feel.
**(b) Necessity:** yes. Hounds are faster than the fox, so without capturing a check you can't deliver a hen.

**Problem:** the *mechanic* is close to speedrunners' **damage boosting** (taking a hit deliberately to use the
invincibility frames). The concept differs, since it's about accountability checks and their immunity, but a
gamer will recognize the move. I prefer a framing where the check is an **inspection** (an evaluator reading a
signal), because that is what makes the concept institutional, and what lets it combine with the fold-back signal.

## Prototype 3: Placeholder activation (paper)

Best framing found: a night market where every stall must post a price for every item. You post absurd prices on
items you don't want to sell. When a rush strips the real stock, automated buyers execute your absurd prices.

- *Minute 1:* set prices with sliders, watch a crowd. Nothing interesting happens until the crash, and the crash
  outcome is decided by slider positions set a minute earlier.
- **(a) Fun:** weak. There's no moment-to-moment verb; it's a spreadsheet with a payoff.
- **(b) Necessity:** fine.
- **Verdict:** the concept is strong, but as a game thread it's a system to configure, not a thing to play.

## Prototype 4: Settledness trap / open top bracket (paper)

- *Settledness trap:* a gate where residents arrive and papers are suddenly required. Old residents have none and
  forgers have perfect ones. This is Papers, Please: reading-heavy and slow to start, which is exactly the "what
  fails" list from the game survey.
- *Open top bracket:* you write a lifeboat table while ships keep growing. It's a design-the-rules toy, and the
  player never touches the ships.
- **(a) Fun:** weak for both.
- **Verdict:** both are dropped as game threads. They remain good concepts and may appear in the write-up as
  neighbours.

## Combination check: can P1's parents share one world?

Yes. **A night garden with an Owl inspector.**

- **Thread A (fold-back):** flowers open as thirst rises and close as they wilt. Gusts push a flower straight past
  its peak. Water is scarce.
- **Thread B (refractory capture):** an Owl inspects flowers. If it finds a flower in visible distress, your
  rating drops. A flower that passes gets a **glass cloche**: no re-inspection for a while. The glass also blocks
  your water and traps the flower's signal inside.
  - You can summon the Owl to a flower of your choosing, which is the capture.
  - Summoning it to a just-watered flower buys a cloche, and keeps the Owl busy so it can't wander onto your
    thirsty flowers. Both are real refractory-capture tactics: the self-timed check, and the "Italian torpedo"
    move of occupying the forum.
  - Thread B can be played with simple flowers whose bloom only rises, so it stands alone.
- **Thread C (both → certified collapse):** a wilting flower past its fold looks calm. Inspected, it *passes*, and
  the glass then seals it away from water. It dies under a pristine cloche and the rating crashes.
  - The player learns that a pass on a quiet flower can be the worst outcome on the board.
  - The Owl is most dangerous to the quietest flowers.
  - Your best rating comes just before your scandal, which is the parable of Mid Staffordshire in a teacup.

That is one world and one aesthetic: two verbs (tap to water, drag the Owl) across three threads.
