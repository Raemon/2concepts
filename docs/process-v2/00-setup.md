# 00 — Setup and plan

**Date:** 2026-10-11

## What the repo contained

Nothing. `origin` (Raemon/2concepts) has no branches, and the local branch has no commits.
The brief refers to `game/`, `docs/process/` and `dist/what-must-be.html` from the first attempt. None of them
are reachable from this session, so:

- I can't read the first attempt's process log. Everything I know about it comes from the brief: the smear
  mechanic, "Earned Selfhood" and "Stale Here".
- I'll rebuild the widget pattern from the LessWrong widget docs (`/api/SKILL.md`): iframe at 100% column width
  (340–700 px), height measured from `document.body.offsetHeight`, clamped to 50–5000 px, `html,body{margin:0}`,
  and `parent.postMessage({type:'iframe-widget-resize',height})` as a backstop.

## Plan, in order

1. **Concept search.** No games, fun or playability at this stage. Look in real practices: law, insurance,
   surveying, crafts, institutions, and patterns that recur across fields.
2. **Vetting.** For every candidate: three real cases from different fields, a search of the nearest expert
   field's vocabulary, and the strongest case against its novelty, written as the requester would put it.
3. **Game-space search,** kept separate from step 1: what makes a browser game enjoyable within 30 seconds, and
   which genres are crowded.
4. **Prototype the top 3–4 concept pairs** briefly before committing.
5. **Choose,** ranking each concept on its own first. Then check that the emergent third concept passes the
   four tests too.
6. **Build** one self-contained HTML widget. Use a solver to show each level is solvable, and that it is not
   solvable without the concept.
7. **Write-ups** for each concept, and this log.

Each step leaves a file here.
