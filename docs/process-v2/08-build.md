# 08 — Building HUSH

## Architecture

| File | Role |
|---|---|
| `src/logic.js` | Rules: thirst, bloom, gusts, the Owl, glass. Discrete breaths, shared by game and solver. |
| `src/levels.js` | 13 levels in 3 threads, as plain data. |
| `src/solver.js` | Exhaustive full-information search, a partial-observation (belief) search for fogged levels, and a fast depth-first feasibility check used by the endless mode. |
| `src/render.js` | Canvas renderer: sky, smoke-threads, flowers, glass, Owl, effects. |
| `src/audio.js` | Synthesized sounds (WebAudio, unlocked on the first gesture). |
| `src/game.js` | Flow, input, animation, menus, endless "night" mode. |
| `src/shell.js` | Widget plumbing: safe storage, height reporting, touch gating. |
| `tools/build.js` | Inlines everything into `dist/hush.html`, a single file of about 80 KB. |
| `tools/check-levels.js` | Writes `solver-report.md`. |
| `tools/e2e.js` | Plays every level in the real page by following the solver's plan. |
| `tools/harness.html`, `tools/harness-test.js` | Load the widget in a sandboxed iframe (`allow-scripts` only) at 340/500/700 px. |

## Rules, in brief

- **Thirst.** Each flower's thirst rises one point every few breaths; at 10 it dies.
- **Two kinds of bloom.**
  - Fold flowers (lotus): bloom = `[0,1,2,3,4,5,6,4,2,1]`. They open with thirst, peak at 6, then close as they
    wilt.
  - Daisies, used only in the Owl thread so it stands alone: bloom = thirst.
- **Water** removes 4 thirst. Water is scarce and regenerates slowly.
- **Gusts** add 4 thirst, and can push a flower straight past its peak.
- **The Owl.**
  - It patrols on a telegraphed schedule. A dotted sightline appears up to 3 breaths ahead.
  - On inspection, a bloom at or above 60% open is "neglected": a catch, which fails the level.
  - Otherwise the flower is "certified": +1 certificate, and 6 breaths of **glass**. Glass blocks gusts, blocks
    water and traps the smoke.
  - You can call the Owl to any flower when it's idle. After each inspection it rests 2 breaths, and rounds that
    fall in that time are missed.
- **Win:** every flower alive at dawn and no catches. **Stars:** water left over (Thirst) or certificates earned
  (Owl, Glass).

## Things the rules produced that I didn't design

- **"Getting better looks worse."** Watering a wilting flower re-opens it, so an Owl arriving right after a rescue
  sees distress. The only clean way through is to keep the Owl busy elsewhere during the recovery. That is
  remedy–signature collision, a runner-up concept from note 04, emerging from the two chosen concepts. It became
  level g2.
- **"Occupying the checker."** Calling the Owl to a healthy flower makes it miss its next round. It's the "Italian
  torpedo" tactic from the refractory-capture research, rediscovered by the solver in o1.
- **The dilution test as a spectacle.** Watering a closed bud that springs *open* ("it was wilting") is the most
  satisfying moment in the game. It's the hook-effect remedy, turned into juice.

## Verification

- `node tools/check-levels.js` produces `solver-report.md`. Every level is solvable; every non-tutorial level is
  unsolvable under its "ordinary" restriction.
- *Listen* (t4) has a fogged past. The game secretly picks which bud is dying, and the belief solver proves one
  policy wins in both worlds: water one bud, and if it opens, it was the dying one. A monotonic reader can't win
  either world.
- `node tools/naive.js` shows how a player without the concepts loses. On every Glass level, naive play
  (certify the calm-looking flowers, water the most open) ends in a **death under glass**, which is certified
  collapse.
- `tools/e2e.js` drives the real page through every level using the solver's plans, confirming that the browser
  game and the solver agree breath for breath.
- Real bug found this way: a stale "level finished" timer could pop the previous result over a freshly started
  level and swallow input. Fixed.

## Widget requirements

- **Sandboxed iframe (`allow-scripts`, no same-origin):** every storage call is wrapped, with an in-memory
  fallback, and there are no network requests.
- **Width 340–700 px:** the canvas is 1.04 × the width. Overlays that need more room stretch the stage, rather
  than spilling over the buttons.
- **Height:** reported from `document.body.offsetHeight` via a ResizeObserver, plus an `iframe-widget-resize`
  postMessage backstop.
- **No scroll trapping:**
  - On touch devices the canvas keeps `touch-action: pan-y` until the reader taps the game. Before that, swipes
    over the garden scroll the page and taps do nothing to the flowers.
  - Tapping anywhere outside the widget releases it again.
  - Calling the Owl works by tap-Owl-then-tap-flower, so no drag is ever required. Drag also works once the
    game is active.
- **Pauses** when scrolled out of view or when the tab is hidden.
