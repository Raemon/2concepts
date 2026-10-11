# HUSH: a night garden

A small game built around two concepts, and the third concept that appears when they combine:

- **Fold-back signal.** Some warning signals are produced by the very capacity whose loss they report. They rise
  with trouble, then go quiet when trouble disables their source. In the game, a flower opens as it gets thirsty,
  then *closes* as it wilts.
- **Refractory-check capture.** When passing a check buys immunity from the next one, the checked party gains by
  calling the check itself. In the game, you summon the Owl to a flower that looks fine and earn a glass cloche
  that the Owl can't see past.
- **Certified collapse (emergent).** Put the two together and the check is easiest to pass *past the fold*. The
  quiet, wilting flower gets certified, sealed under glass, and dies there.

**Play it:** open [`dist/hush.html`](dist/hush.html). It's one self-contained file and works as a LessWrong post
widget: sandboxed iframe, 340–700 px wide, auto height, no scroll trapping.

**Read about it:**
- [`docs/concepts.md`](docs/concepts.md): the concept write-ups (real cases, moves, nearest known ideas, honest
  novelty estimates).
- [`docs/process-v2/`](docs/process-v2/): the process log (about 560 candidates searched, vetting, ranking,
  prototypes, the decision, the build).
- [`docs/process-v2/solver-report.md`](docs/process-v2/solver-report.md): proof that each level is solvable with the
  concepts and unsolvable without them.

## Develop

```bash
node tools/build.js          # src/ -> dist/hush.html
node tools/check-levels.js   # solver: every level solvable, and unsolvable under "ordinary" rules
node tools/naive.js          # how a player without the concepts loses each level
python3 -m http.server 8765 &
node tools/e2e.js            # drive the real page through every level with the solver's plans (needs Playwright)
node tools/harness-test.js . # load the widget in a sandboxed iframe at 340/500/700 px
```

Sources are in `src/`. `logic.js` holds the rules shared by the game and the solver.
