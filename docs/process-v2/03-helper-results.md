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
