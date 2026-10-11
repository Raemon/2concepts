# 03 — Helper results (domain-seeded concept mining)

Each helper got one narrow domain and the same four tests. They were told to search the nearest expert field's
vocabulary and to report kills honestly. Below is a condensed record of each report: how many structures it
considered, what survived, and my first reaction. Their full kill lists are summarized rather than copied.

---

## Operations & logistics (33 structures; 31 killed, 2 survivors)

**Representative kills:**
- Expediter timing → backward scheduling / time-on-target.
- "In the weeds" → failure demand / metastable failures (Bronson et al. 2021).
- Unsolicited donations → material convergence (Fritz & Mathewson 1957).
- Shared slack eaten first → protection levels / CCPM.
- Automation skill fade → Bainbridge's "Ironies of automation".
- Quiet downstream fixes stop upstream learning → Tucker & Edmondson.
- Periodic gate rounds lead times up → PESP / integrated periodic timetable. Borderline.

**Survivor: Recall-cost floor.** If you announce a wait to people who then scatter, your estimate becomes a minimum.
Recalling them early costs more than it gains, so uncertainty gets converted into guaranteed idle capacity.
- *Cases:* airlines rarely leave before a posted delay; incident comms give "next update by 11:30" rather than an
  ETA; restaurant over-quoting plus pagers; hospital discharge waiting on transport; "NET" launch dates.
- *Moves:*
  - When recall is costly, announce the time of the next update, not an ETA.
  - Buy recall channels before improving estimates; their value grows with variance.
- *Surplus:*
  - "Under-promise, over-deliver" is only safe when recall is cheap.
  - Delay data is censored from below by the announcements, which biases future quotes upward.
- *Nearest:* delay-announcement queueing (Armony, Shimkin & Whitt 2009); appointment scheduling; Odyssean vs
  Delphic forward guidance.
- *Helper's estimate:* about 50/50.

**Survivor: OR-in / AND-out gates.** When any one sponsor can admit an item but release needs every stakeholder to
clear, the stock grows and nobody owns the exit.
- *Cases:* hospital discharge vs admission; foster-care drift; orphaned cloud resources; regulatory accumulation;
  museum deaccessioning.
- *Moves:*
  - Count exit veto points before adding exit capacity.
  - Attach exit terms at entry (criteria-led discharge, TTL tags, sunsets).
- *Surplus:* exit staff workload rises with the stock, which gives a load-dependent tipping point into gridlock.
- *Nearest:* veto players (Tsebelis) applied to exit; ratchet; sunset clauses.
- *Helper's estimate:* about 40%.

**My reaction.**
- *Recall-cost floor:* crisp, real and action-guiding, but narrow, and a queueing theorist would call it
  appointment-vs-walk-in conversion.
- *OR-in / AND-out:* a clean diagnosis, but "veto players on exit" will be the requester's first sentence.
- Both are medium.

---

## Maritime & aviation (44 structures; 42 killed, 2 survivors)

The helper reported that the shared web-search budget ran out on its last query. I'll need to ration searches
during vetting.

**Representative kills:**
- SCOPIC → Holmström–Milgrom multitask.
- Pennsylvania Rule → negligence per se.
- Mirror conventions (IALA A/B) → negative transfer.
- Ghost flights for slots → use-it-or-lose-it.
- Certification by similarity (737 MAX, 510(k)) → predicate creep.
- V1 → point of no return.
- Aiming off → Hanson's "useful bias", directed rounding. Narrowly killed.

**Survivor: The open top bracket.** A requirement that scales by a table whose last row reads "X and above"
quietly becomes a fixed cap. The newest and largest units pile into that row, so the requirement stops growing
exactly where the hazard grows fastest.
- *Cases:*
  - Board of Trade lifeboat table: "10,000 tons and upwards: 16 boats". Titanic was compliant.
  - ICAO "Heavy" wake category: the A380 forced a new "Super" class.
  - FMC cruise-line coverage ceiling: frozen at $15M from 1990.
  - Chemo dosing capped at BSA 2.0 m², underdosing obese patients.
  - Counter-design: Basel keeps the top G-SIB bucket deliberately empty.
- *Moves:*
  - Measure the share of current exposure sitting in the top row.
  - Re-index to the hazard variable itself.
  - Keep an empty top bucket.
- *Surplus:*
  - Above the top row the marginal requirement is zero, so the table pulls units *through* the top. That's
    anti-bunching.
  - Compliance becomes a credential exactly where it carries the least information.
  - Prediction: the first disaster in a new size class will happen under full compliance.
- *Nearest:* regulatory lag / pacing problem; ceiling effect; bunching at notches; fixed nominal thresholds.
- *Helper's estimate:* about 50/50 ("a sharp special case of lag").

**Survivor: Identity-bound exceptions to role-bound rules.** Role-based defaults need no identification. A private
bilateral exception makes success depend on identifying the counterpart, while bystanders keep acting on the
default.
- *Cases:* VHF-assisted collisions (MGN 324, Lykes Voyager); wave-on traffic cases; the 2025 Potomac midair
  (visual separation); secret liens / ostensible ownership.
- *Surplus:* better communication channels can *reduce* safety, because they cut the cost of making exceptions
  faster than the cost of broadcasting them.
- *Helper's estimate:* 35–40%.

**My reaction.**
- *Open top bracket:* the best so far. It's vivid and real, with Titanic as its emblem, and has a clear
  prediction and moves. The risk is that "failure to index / regulatory lag" absorbs it. But the structural point
  stands on its own: the top row is a cap, so units migrate into it. That point is about table design, not about
  lag.
- *Identity-bound exceptions:* a conjunction (authentication plus externality on non-parties), as the helper
  admits. Its communications-paradox surplus is good.

---

## Living systems (31 structures; 30 killed, 1 survivor)

This helper also ran out of shared search budget, after about 25 searches. Some kills rest on its prior knowledge.

**Representative kills:**
- Fire suppression → fire paradox / levee effect.
- Badger-cull perturbation → perturbation / vacuum effect.
- Penicillin-allergy label never tested → hot stove effect (Denrell & March); selective labels.
- Reserve populations adapt to captivity → adaptation to captivity / G×E.
- "3 feet or 3 miles" hive moves → negative transfer.
- Lapsed stressor: the old dose becomes an overdose (unburned forests; post-prison overdose; refeeding;
  SVB 2022) → loss of tolerance + acute:chronic ratio. Narrowly killed.
- Serial depletion → roving bandits.

**Survivor: Remedy–signature collision.** When a monitor responds to a marker that the remedy itself produces
(physically or by inference), the regime penalizes the remedy. People switch to substitutes that keep the marker
clean, which are often more destructive, until someone builds a discriminator.
- *Cases:*
  - Foot-and-mouth 2001: culling chosen over vaccination to keep "free without vaccination" trade status.
  - US bird flu: about 175M birds culled while vaccination is resisted for export status.
  - BCG confounds the tuberculin skin test, in humans and in cattle.
  - Prescribed-burn smoke counts against air quality while wildfire smoke is excused.
  - Evidence law: FRE 407 (subsequent repairs), apology laws.
  - Discount-window stigma.
  - Credit-inquiry de-duplication when shopping for a rate.
- *Moves:*
  - When a good remedy is underused, ask which monitor reads its footprint as the problem; the lever is the
    monitor.
  - Four fix types: discriminate (DIVA marker vaccines), blind (privilege, inadmissibility), reclassify with
    checks, aggregate.
- *Surplus:*
  - The substitution improves the monitor's own numbers. Culled flocks test negative and unburned land makes no
    smoke this year, so the regime looks most successful while the hazard grows.
  - Remedy uptake jumps discontinuously when a discriminator arrives (Aujeszky's).
  - Underuse tracks monitoring intensity, not need.
- *Nearest:* DIVA (van Oirschot 1999); public-policy evidence exclusions; stigma; signaling; confounding by
  indication.
- *Helper's estimate:* about 40% (more likely to be judged "good synthesis").

**My reaction.**
- A genuinely good find. The physical-marker branch (the vaccine makes you test positive) is concrete and
  surprising. The self-hiding prediction is real surplus.
- Risk: the inference branch is plain signaling and stigma. The concept is strongest if restricted to the
  physical, mechanical branch: the remedy's trace is indistinguishable from the malady's trace *to the
  instrument*.

---

## Property, water & probate law (50 structures; 48 killed, 2 weak survivors)

There is a shared search limit (about 200 calls per turn, across all agents). This helper exhausted it, so
several of its kills are from prior knowledge.

**Representative kills:**
- Wild deeds → practical obscurity.
- Shelter rule → laundering.
- Schodde (the incumbent's claim grows with its inefficiency) → hypersensitive-plaintiff rule (§821F).
- Dwell-time thresholds → mere-conduit doctrine.
- Specificatio → accession.
- Accretion vs avulsion → salami tactics / chain drift.
- Monuments control → Kripke's causal reference; nomenclatural types.
- Crummey powers → Schelling.
- Making rights tradable wakes dormant licences → "hot air" (provisional).

**Survivor (weak): Re-utterance rebinding.** Reaffirming a document (re-executing, re-enacting, renewing,
reinstalling) counts as saying it again. Every time-indexed term ("now", "my property", "current law", "latest")
silently moves to the new date, so an act meant to change nothing changes substance.
- *Cases:*
  - Republication by codicil.
  - The re-enactment canon (*Lorillard v. Pons*), with savings statutes enacted to block it.
  - M&A bring-down conditions.
  - English insurance renewal re-attaching the disclosure duty.
  - Reinstalling without a lockfile re-resolves version ranges.
- *Surplus:* undebated change concentrates in frequent, low-attention formalities, and anti-rebinding devices
  spread (lockfiles, "as of" anchors).
- *Nearest:* Kaplan's character/content; ratification; republication.
- *Helper's estimate:* 35–40%.

**Survivor (weak): Interests that live in the gap between two holders.** Some interests exist only while two
layers are held by different parties; a merger silently kills them.
- *Cases:* contingent remainders; anti-merger clauses; confusio; reverse triangular mergers.
- *Nearest:* merger doctrine and confusio, which already state it generally.
- *Helper's estimate:* 25–30%.

**My reaction.**
- *Re-utterance rebinding:* the mirror image of the first attempt's "Stale Here". There, labels freeze at coining;
  here, reaffirming re-coins them. It's interesting that two independent searches keep finding time-indexed
  reference. But that may be a shared attractor, and it's Kaplan plus ratification. Medium-weak.
- *Gap interests:* killed as named.

---

## Record- and name-keeping institutions (34 structures; 32 killed, 2 survivors)

This helper made only 15 searches before the shared budget ran out. Survivor 1 is unverified by search.

**Representative kills:**
- Ghost entries → ghost words / paper towns.
- Identifiers parsed as data → Hyrum / protocol ossification.
- Default values as phantom hotspots (Null Island) → disguised missing data.
- A better test looks worse than the reference → imperfect-reference-standard bias / Chang's epistemic iteration.
- Redefinition moves uncertainty → Tal's "economies of uncertainty".
- In a split, the name follows the anchor → closest continuer / state succession.
- Weeding by usage → selective labels.
- Hedges stripped in aggregation → modality deletion (Latour & Woolgar).

**Survivor: The settledness trap.** Proof of a status is mostly produced when the status is contested. The most
settled statuses therefore carry the least proof, so any shift to documentary proof, or to inactivity-means-
abandonment rules, hits the most legitimate holders hardest.
- *Cases:*
  - Windrush: pre-1973 arrivals with full right of abode were detained and deported after landing cards were
    destroyed in 2010.
  - Assam NRC 2019: 1.9M excluded.
  - Voter ID and home births.
  - Credit invisibles, including stale files of people who paid off their debts.
  - The most stable code has the fewest tests (Feathers).
  - *Husted v. APRI* voter purges for inactivity.
  - Edward I's quo warranto, resolved by possession since 1189.
- *Moves:*
  - Before imposing a proof requirement, profile exposure by tenure cohort.
  - Pre-issue papers or presumptions by tenure.
  - Keep records of uncontested statuses because nobody requests them.
  - Write characterization tests for the most stable modules first.
- *Surplus:*
  - Inverted targeting: a regime aimed at recent irregular entrants concentrates its false positives at the
    opposite end of the tenure distribution.
  - The victims are invisible in error statistics until the regime shift happens.
- *Nearest:* the rationale for prescription; lost modern grant; documentary citizenship (Sadiq); administrative
  burden.
- *Helper's estimate:* 40–50%.

**Survivor (weak): Authority migrates to the most accessible realization.**
- *Cases:* the kilogram artifact → Planck constant; print → electronic OJ; monuments → GNSS cadastre; Airy →
  IERS meridian; culture → genome type; Preah Vihear map beats treaty line.
- *Nearest:* estoppel/acquiescence + convention theory.
- *Helper's estimate:* 30–35%.

**My reaction.**
- *Settledness trap:* strong. Windrush is a perfect emblem, and the inverted-targeting corollary is real surplus.
  The weakness: prescription law is literally the institutional answer to it, so a lawyer would say "that's why we
  have prescription". But the *general* point is that evidence density is anti-correlated with legitimacy, because
  evidence is a by-product of contest. That is broader than prescription and drives non-legal cases (code tests,
  credit files).
- **Convergence warning.** The settledness trap, my own "all-clear trap", remedy–signature collision and the open
  top bracket all share a shape: *an instrument or record is structurally blind exactly where things are fine,
  settled or largest, and the blindness hides itself.* Four helpers working from different seeds converged here.
  That's partly real (these are distinct mechanisms with distinct cases). It may also be a shared attractor of the
  model, the "selection effect over records" territory I flagged in note 02. I'll treat the family as one
  territory when ranking, so it doesn't win just by having many entries.

---

## Insurance & actuarial practice (51 structures; 49 killed, 2 borderline survivors)

This helper ran about 16 searches before the budget ran out. Survivor B was not searched.

**Representative kills:**
- Hours clause → modifiable temporal unit problem.
- WTC one or two occurrences → sortal-relative counting.
- LMX spiral → named.
- Mutually repugnant other-insurance clauses → renvoi / battle of the forms.
- Franchise deductible → notches.
- Fixing the damage destroys the evidence → order of volatility (RFC 3227).
- Successful prevention erases proof of the threat → preparedness paradox.
- Title washing / reflagging → cheap pseudonyms.
- Too-perfect documentation → "too good to be true".

**Survivor (borderline): Outcome-gated contestability.** An agreement can be voided for defects at formation, but
checking only pays after a bad outcome. That gives the checker a free option, exercised exactly when the other side
is most exposed.
- *Cases:* post-claims underwriting / rescission; mortgage putbacks only on defaulted loans; after-acquired
  evidence in employment; denaturalization (Maslenjak); sovereign "odious debt" audits.
- *Moves:*
  - Treat no-verification products as a written put.
  - Use seasoning clauses: release after a run of good performance, plus estoppel for anything checkable at
    inception.
- *Nearest:* Townsend's costly state verification; Picard on verification without commitment.
- *Helper's estimate:* about 30%.

**Survivor (weak, unsearched): Mixture-status (taint) rule shapes and their exploits.**
- *Shapes and the exploit each invites:* absorbing → contamination attacks; proportional → dilution; threshold →
  dilute to just under the line.
- *Drift:* every shape drifts toward the same hybrid, a threshold for innocent mixing plus forfeiture for
  deliberate mixing.
- *Cases:* anti-concurrent causation; trust tracing (Clayton's Case, Re Hallett, Barlow Clowes); crypto taint
  (dusting); the OFAC 50% rule (Rusal); kashrut 1/60 with a ban on deliberate nullification; fruit of the
  poisonous tree; the EU GMO 0.9% threshold.
- *Helper's estimate:* 30–35% as a typology.

**My reaction.**
- *Outcome-gated contestability:* real, but it's an option-value restatement of costly state verification.
  Medium-weak.
- *Taint typology:* a nice catalogue, but a typology isn't a new way of seeing. Weak as a concept.

---

## Crafts & restoration (42 structures; 41 killed, 1 provisional)

This helper got only 2 searches before the budget ran out, so most kills are from background knowledge.

**Its meta-finding:** "most of what masters know turns out to be a local rediscovery of a concept already named in
mechanics, control or statistics."
- Pitch-raise overpull → successive over-relaxation.
- Wolf interval → error budgeting.
- Closer brick → compensator.
- Batten fairing → splines/regularization.
- Three-plate method → three-cornered hat.
- Pyrometric cones → witness coupons (with an explicit theory of matched kinetics).
- Sourdough convergence → Baas Becking.
- Cradling warped panels → Hyrum / integral windup.

**Provisional survivor: Drift cover.** When a whole system drifts one way, the relative changes its parts need can
happen as unequal amounts of the same-direction move. When the drift stops, relative change needs opposite-
direction moves. Those meet more resistance, and the hidden misalignment surfaces at once.
- *Cases:*
  - Inflation lets real wages diverge without nominal cuts (Tobin's "grease the wheels").
  - Moore's law hid software inefficiency until 2005 ("The free lunch is over").
  - Yellowed varnish hid unequal pigment ageing.
  - Growing firms shrink units by not backfilling, then ZIRP's end forced layoffs.
  - Pulling a flat piano up to A440.
- *Surplus:*
  - The shock scales with the spread of misalignment times the drift's duration.
  - The capacity for negative moves withers while it's unneeded.
- *Helper's estimate:* 15–20% ("grease the wheels, generalized").

**My reaction.** Better than its own rating, I think. The economics instance is named, but the general lens is
"common drift as a solvent for relative adjustment, and its withdrawal as a revealer". It has clean cases in
computing, firms and painting. It's still a generalization of one known concept. Medium-weak.

---

## Lab science & measurement (38 structures; 36 killed, 2 survivors)

This helper got zero searches (the budget was exhausted), so all its precedent checks are from memory.

**Representative kills:**
- Constants drift toward the accepted value → bandwagon effect.
- Time-of-observation bias → TOBS.
- Network-wide instrument change → common-mode.
- Blanks dominating low-biomass samples → kitome / Lizardman's constant.
- A correction outlives its defect → second best / compensatory mutation.
- Recalibration erases the drift record → as-found/as-left.
- Auto-zero absorbs a real change → shifting baselines.
- Pull of the Recent → named.

**Survivor: Fold-back indicator.** Some indicators are produced by the very capacity whose loss they report. The
reading rises with severity until the severity disables its producer, then falls, so a low or silent reading is
ambiguous between "mild" and "catastrophic".
- *Cases:*
  - The high-dose hook effect (giant prolactinomas, molar-pregnancy hCG).
  - "Silent chest" in near-fatal asthma.
  - Neutropenic patients with no pus.
  - AF447: the stall warning was inhibited below 60 kt and returned when the pilots made the correct
    nose-down input.
  - Hurricane Maria's official toll of 64 vs about 2,975.
  - SRE: error rates read zero when the front end is fully down.
  - Paralyzable detectors.
  - Wards with the fewest incident reports.
- *Moves:*
  - A general "dilution test": push the system milder; if the reading rises, you're past the fold.
  - Pair every self-generated indicator with an external probe.
  - Triage silent units first.
- *Surplus:*
  - Feedback loops on fold-back indicators have a runaway region: past the fold, deepening the crisis improves
    the reading and is reinforced.
  - More sensitivity can't fix it; only an independent channel can.
  - Fewer extreme readings alongside rising outside evidence is itself diagnostic.
- *Nearest:* hook/prozone effect; paralyzable dead time; Dunning–Kruger / anosognosia; self-masking MNAR; white-box
  vs black-box monitoring; live-zero 4–20 mA.
- *Helper's estimate:* about 50%.

**Survivor (weak): Sensitivity ratchet.** "Any detectable amount" rules delegate their strictness to instrument
progress (Delaney Clause, clenbuterol, cocaine on banknotes, per-se THC laws). The helper believes it's probably
named as "the vanishing zero" in 1970s food law. Weak.

**My reaction.**
- *Fold-back:* the strongest *mechanism* so far. It's crisp ("the signal is made by the thing being destroyed"),
  vivid (silent chest, AF447) and has real formal surplus (the runaway region).
- Biggest risk: Dunning–Kruger and anosognosia are the same structure in cognition. A LessWronger will say "that's
  Dunning–Kruger for instruments". Also, the hook effect is literally named.
- It belongs to the same "blind where it matters" family as the settledness trap, all-clear, remedy–signature and
  open top bracket.

---

## Procedure of old institutions (about 40 structures; 1 survivor)

This helper got zero searches, so everything is from memory.

**Representative kills:**
- Only a winner may move to reconsider → "Nixon goes to China".
- Tabling → negative agenda control.
- Conclave fallback → reversion point.
- Juniors vote first → cascades.
- Lechatchila/bedieved → conduct vs decision rules.
- Doubt-shield (kim li, probabilism, qualified immunity's "clearly established") → laxism / manufactured doubt.
  A near-miss.
- Conditional re-performance → ex abundanti cautela. A near-miss.
- Walking quorum, constructive abstention, Sybil resistance, structuring, grandfathering, IIA: all named.

**Survivor: Refractory-check capture.** Some accountability checks grant immunity once survived (a cooldown, bar or
preclusion). The checked party then gains by *running the check on itself*, choosing timing, challenger or forum,
and the check becomes a shield.
- *Cases:*
  - John Major's 1995 "put up or shut up" leadership contest.
  - Tory rules since 1998: a survived confidence vote buys 12 months, so May was protected in Dec 2018.
  - NLRA 12-month election bar and sweetheart contract bars.
  - Class-action reverse auctions buying class-wide preclusion.
  - Leipzig trials of 1921 forestalling extradition; Rome Statute art. 17 "shielding".
  - USPTO supplemental examination cleansing inequitable conduct.
  - Tabling the motion to reconsider immediately.
  - Whole Foods' weak proxy-access proposal used to exclude a stronger one.
- *Moves:*
  - Designers should scale immunity to how adversarial the test was.
  - Challengers should treat a failed weak challenge as a gift to the target, and hold allies until a winning
    coalition is committed.
  - Read "bring it on" as the target's own estimate that conditions favour it.
- *Surplus:*
  - Accountability becomes bimodal: long quiet spells, then overwhelming strikes through channels the bar doesn't
    cover. Johnson survived June 2022 and fell in July to mass cabinet resignations.
  - Anti-sham doctrine elaborates in proportion to bar length.
- *Nearest:* collusive-suit doctrine; sham-prosecution exception; election "surfing"; stealing thunder;
  inoculation theory; controlled burns as a physical analogue.
- *Helper's estimate:* about 50/50.

**My reaction.**
- Important because it's *outside* the "blind instrument" attractor. It's a strategic concept about timing and
  self-administered tests, with excellent cases and real surplus (bimodality).
- It has the shape of *self-vaccination against accountability*: a controlled exposure on your own terms buys
  immunity from the uncontrolled one. That's also the logic of controlled burns, the 2018 vote, and patent
  cleansing.
- Medium-strong.

---

## Markets, accounting & auctions (35 structures; 1 survivor, 1 borderline)

This helper got zero searches, but fetched two pages directly to check case facts.

**Representative kills:**
- Marking the close → banging the close.
- Cheapest-to-deliver; queue rationing; notches.
- Adjusting vs non-adjusting events → bitemporal data.
- Circuit-breaker magnet → magnet effect / green paradox.
- Dark pools drain discovery → Grossman–Stiglitz.
- Treasury fails at zero rates → latent structural constraints.
- Suspense accounts as hiding places → residual categories.
- Stable NAV → peg crises.
- Wrong-way risk.
- Brent / Dow constituents → Ship of Theseus.

**Survivor: Placeholder activation.** A mandate forces a slot to be filled by someone who doesn't want it used, so
they fill it with a valid-looking value chosen to be *never used*. Genuine fillers vanish in exactly the failure
states, so in those states automated systems execute the placeholder as if it were real.
- *Cases:*
  - May 2010 flash crash: Accenture at $0.01 and Sotheby's at about $100,000, both stub quotes posted to meet
    market-maker obligations.
  - Canada's 2011 Orange Wave: NDP paper candidates elected in Quebec; Brosseau was in Las Vegas.
  - MaxMind's default IP location (a Kansas farm); the "NULL" licence plate collecting tickets. Both from memory.
  - Ticket-balancing VPs who succeeded (Tyler, A. Johnson, Arthur).
- *Moves:*
  - List placeholders and test them in the state where genuine values disappear.
  - Bound the allowed values, or provide an explicit decline channel.
- *Surplus:*
  - *Extreme by design:* "minimize the chance of use" pushes placeholders to the edge of the valid range, so the
    damage on activation is the designed optimum.
  - Activation is correlated (59 seats; eight S&P names at a penny).
  - Automation raises the hazard.
  - Stricter presence mandates produce more placeholders, raising measured robustness while lowering real
    robustness.
- *Nearest:* semipredicate problem / sentinel values / Null Island (CS); ceremonial decoupling; hidden failures.
- *Helper's estimate:* 35–45%.

**Borderline (probably killed): Fallback mismatch when a referent dies.** LIBOR, gold clauses, the euro,
left-pad. Killed as common-cause failure.

**My reaction.**
- *Placeholder activation:* very good. It's vivid, with the flash crash and an absent MP. "Extreme by design" is
  genuine surplus. And it's a different mechanism from the blind-instrument family: here the slot-filler is
  *strategic*, choosing a value that maximizes the chance of non-use.
- Risk: "sentinel values and in-band signalling" is the CS name for the mechanism. Medium-strong.

---

## Invented formal structures (43 structures; 2 survivors, unsearched)

This helper got zero searches. Its kills cite named precedents from memory.

**Representative kills:**
- Window-transitive relation → temporal networks / tolerance relations.
- Per-observer conservation → Chandy–Lamport channel state / float.
- Obligation to the last observer → last clear chance.
- Referent fixed by first query → binding time / lazy evaluation.
- Evidence consumed by reuse → reusable holdout.
- Can-prove-to-B-not-C → designated-verifier signatures.
- Blame goes to the role-holder at discovery → claims-made.
- Too-perfect corroboration → Gunn et al. 2016.

**Survivor: Non-exposure certificate.** Third-party-checkable evidence that a judgment had no causal path from some
information. There are three routes: Time (fixed before access), Cut (a monitored barrier) and Trace (exposure
would leave a mark: a canary, a fake town, a decoy).
- *Cases:* 10b5-1 plans; Phoenix's clean-room BIOS; A/B samples; Agloe / Mountweazels; the BIG-bench canary
  string; post-cutoff benchmarks; sequential unmasking; preregistration; the Concealed Information Test.
- *Surplus:*
  - Cooling-off law: a Time certificate leaks unless the cooling-off period is at least the payoff horizon (the
    SEC's 2022 amendments).
  - Canaries don't survive transformative copying, which predicts a shift to Time certificates (as LLM eval is
    doing).
  - Probes self-contaminate, so they need decoys.
- *Helper's estimate:* 30–40% ("a review-article taxonomy of blinding").

**Survivor (weak): Appreciating evidence.** A stored record's evidential yield rises with analytic progress.
- *Cases:* IOC retests; the Golden State Killer; the Vesuvius Challenge.
- *Surplus:* the incentive to destroy peaks just before better analysis arrives (the Moscow lab destroying
  samples in 2014).
- *Nearest:* quasi-option value + spoliation.
- *Helper's estimate:* 15–25%.

**My reaction.**
- *Non-exposure certificate:* useful, and timely for AI evals, but it's a taxonomy. Medium-weak as a "new way of
  thinking".
- *Appreciating evidence:* weak.

---

## Military, intelligence & security tradecraft (44 structures; 1 qualified survivor)

This helper got zero searches. It notes "the seed domain is unusually well theorized".

**Representative kills:**
- Rationing Ultra → Aumann–Maschler / DP budget.
- Mincemeat → Deception Maxim 10.
- Glomar → pooling.
- Rare privacy tools identify users → "Anonymity loves company".
- Monitors attract infiltrators → quis custodiet.
- Evasion becomes the signal → zig-zag model (plant immunity).
- Covert production bottlenecked by waste (Great Escape spoil, Kr-85) → mass balance / MASINT. The closest
  runner-up.
- FUSAG → Beau Geste hypothesis.
- Too-coherent stories → CBCA.
- Pocket litter → Barthes' reality effect.

**Survivor (qualified): Upkeep-dependent ("held-open") concealment.** Some hidden states are processes, held away
from their natural visible state by an operator's continuous work. So the decisive test is to interrupt the
operator, across the whole upkeep group, rather than inspect the output.
- *Cases:* Rita Crundwell ($53M, exposed during her vacation); Kerviel took no leave; Olympus tobashi broken by an
  outsider CEO; Greece's deficit revised after the 2009 change of government; 1MDB after Najib fell; rootkits vs
  offline-boot detection; Clever Hans; HIV "shock and kill".
- *Moves:*
  - Match the interruption to the suspected group: solo → enforced absence; coalition → replace everyone at once.
  - Treat involuntary breaks (deaths, elections, reboots) as expiring audit windows.
- *Surplus:*
  - Concealers face a tradeoff between solo upkeep (breaks on interruption) and shared upkeep (breaks on
    defection).
  - So durable concealments are small-group, inside bodies that never turn over all at once.
  - Rational concealers migrate to passive, built-in concealment (defeat devices).
- *Nearest:* mandatory vacation; "big bath" after CEO change; Grimes 2016 on conspiracy leakage.
- *Helper's estimate:* about 35%.

**My reaction.** The core is "mandatory vacation, generalized". The more general lens, *held-open states* (states
that exist only while someone keeps doing work), reaches beyond concealment: polders and pumps, abandoned mines
flooding, Ponzi schemes, the "Bob does X every day" system. But in physics that general version is dissipative
structure / homeostasis. Medium-weak.
