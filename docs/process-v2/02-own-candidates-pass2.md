# 02 — My own candidates, pass 2 (deeper, before helper results)

Written while the eight domain-seeded helpers were still running, so these weren't influenced by their output.

## C-ALLCLEAR: errors that silence their own check (working name: "the all-clear trap")

**Statement.** When checking is triggered by what the record says, an error that makes the record read "fine"
(in stock, resolved, alive, inspected, OK) suppresses its own detection. So the errors still standing in a mature
system are dominated by the ones hiding under all-clear states.

**Real cases.**
- Retail phantom inventory. The system says an item is in stock, so it never reorders, and the shelf stays empty
  ("inventory freeze"; DeHoratius & Raman 2008).
- Civil registers. Sogen Kato's family collected his pension for about 30 years after his death; the 2010 audit
  found 230,000+ "missing" Japanese centenarians. In the opposite direction, Lal Bihari was registered as dead and
  spent 18 years proving he was alive. His case shows that an error which *triggers* scrutiny gets fixed only if
  the subject can force the check.
- EHR copy-forward errors: "no known allergies", once wrong, is never re-asked.
- "Closed" bug tickets, inspection tags, health checks returning 200.

**Moves.**
- Audit the all-clear states, not the alarms.
- Trigger checks from signals in reality (a drop in sales velocity) rather than from the record's state.

**Surplus.**
- The most trusted records get less reliable as a system matures.
- Random audits of "OK" items out-yield investigation of alarms.
- More "check only on flag" automation makes the problem worse.

**Against.** "It's the inspection paradox (length-biased sampling) applied to errors, plus latent conditions
(Reason), self-sealing beliefs and silent failures. Auditors already sample the green." Partly known. The general
selection argument may be unnamed, but it's a combination of two known things.
**Provisional rating:** medium-weak.

## C-PRACTICAL-OBSCURITY family: killed (named)

## C-DISAPPEARING-POLYMORPH generalised ("irreversible seeding")

**Statement.** Once a more stable configuration has appeared, it seeds every later attempt, so the earlier
configuration can no longer be reproduced.

**Cases.**
- Ritonavir form II.
- Pejoration of words: a word with a vulgar sense can't go back to its innocent one.
- Exploits: once an exploit is known, the naive equilibrium is gone.

**Against.** "Genie out of the bottle; Gresham's law; evolutionary stability." Only the chemistry is crisp.
**Killed:** a metaphor transfer.

## Other quick ones, killed

- Exposure-weighted Lindy: survival evidence is the integral of scrutiny, not of time. Killed: "proven in use" /
  fleet hours in reliability engineering.
- Orphan defaults (defaults nobody chose). Killed: conventions (Lewis), path dependence.
- Social isomers. Killed: network structure.
- Stress risers / crack-stop holes. Killed: benefit cliffs, firebreaks.
- Ordering rent (MEV generalized). Killed: front-running, agenda control, ballot-order effects.
- Transparency penalty (enforcement attaches to the compliant). Killed: "just culture", the transparency paradox
  literature, legibility (Scott).
- Turn-ownership deadlock in relationships. Killed: deadlock, Alphonse–Gaston.

## Observation

Composing familiar primitives (agent, record, kind, time, frame, copy, permission) mostly yields named things.
What survives tends to be a *selection effect over a population of things* (errors, claims, records), where each
field has a local name and the general mechanism has none. I'm flagging this so I don't over-trust it: it's
possibly my own attractor.
