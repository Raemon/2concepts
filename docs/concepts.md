# The concepts behind HUSH

There are two concepts, plus a third that appears when they meet. The process that produced them, including the
roughly 560 candidates that were killed along the way, is in [`process-v2/`](process-v2/).

---

## A. Fold-back signal

**In one sentence.** Some warning signals are *produced by the very capacity whose loss they report*. They rise
with trouble only until trouble disables their source, then fall back through "normal". So a quiet or falling
reading is ambiguous between *fine* and *collapsing*.

**Real cases.**
1. **Medicine: acute asthma.**
   - The wheeze and the low CO₂ of an asthma attack are produced by the patient's own work of breathing.
   - As exhaustion sets in, the wheeze disappears (the "silent chest") and blood CO₂ climbs back to "normal".
   - British asthma guidance lists both as *life-threatening* signs, not signs of improvement.
2. **Laboratory assays: the high-dose hook effect.**
   - In two-site immunoassays, an extreme concentration saturates both antibodies, so the test reads falsely
     *low*. Giant prolactinomas get reported as modest elevations.
   - The standard remedy is serial dilution: make the sample milder, and if the reading goes *up*, you were past
     the fold.
3. **Aviation: Air France 447 (2009).**
   - Deep in the stall, the measured airspeed dropped below about 60 kt. The data was flagged invalid and the
     stall warning went silent.
   - When the pilot briefly pushed the nose down (the correct recovery input), speeds became valid again and the
     warning *sounded again*. Helping made the alarm louder.
4. **Public statistics: Hurricane Maria (2017).** The official count was 64 deaths; the later excess-mortality
   estimate was about 2,975. The worst-hit areas were exactly the ones that had lost the infrastructure that
   produces death reports.
5. **Organizations.**
   - Units with the fewest incident reports are often not the safest. A UK study found more reporting where safety
     culture was better.
   - Hirschman's customers stop complaining once they've left.

**Moves it licenses.**
- **Sort every indicator you rely on** into *load-generated* (it measures the trouble) and *capacity-generated*
  (it's produced by whoever is coping with the trouble).
  - For each capacity-generated one, name a partner variable on the load side.
  - Pre-commit to treating "the indicator normalizes while its partner worsens" as an alarm. Examples: cases down
    while test positivity is up; complaints down while churn is up; CO₂ normal while the breathing rate is still
    high.
- **Run the dilution test.** Push the system slightly toward milder conditions: dilute the sample, relieve some
  load, give a small amount of help. If the signal *rises*, you were past the fold.
- **Never de-escalate on a capacity-generated signal's return to normal** without an identified cause.
- **In triage, check the silent units first** when silence can mean collapse.

**What falls out of it (surplus).**
- **There is a runaway region.**
  - Past the fold, whatever deepens the crisis makes the reading "improve", so it gets rewarded.
  - Whatever helps makes the reading look worse, so it gets punished (AF447's nose-down input brought the alarm
    back).
- **More sensitivity can't fix a fold-back.** A finer instrument reads the same falling signal more precisely.
  Only an independent channel helps.
- **False reassurance isn't random.** It clusters just before collapse. The signal's peak marks maximum
  *compensation*, not maximum danger.
- **Those with the least capacity to respond read "normal" from the start.** The indicator is least sensitive
  exactly where people are most vulnerable.

**Nearest known ideas, and why it isn't them.**
- **Hook / prozone effect** (immunoassay) and **pseudonormalization** (ECG, blood gas). These are field-specific
  names for one mechanism each. No cross-field concept with a test and dynamics is attached.
- **Ceiling effect / saturation / clipping**, e.g. Chernobyl's dosimeters stuck at their maximum. A saturated
  reading *stays* at the top and looks off-scale. A fold-back reading *falls* and looks like recovery. That
  difference is why it's dangerous.
- **Dunning–Kruger and anosognosia.** These are the cognitive cousins: the faculty that would notice the deficit
  is the deficient one. Fold-back covers any signal produced by the threatened capacity, physical or
  institutional, and adds the dilution test and the runaway region.
- **Survivorship bias / missing-not-at-random.** These are about which units appear in a sample. Fold-back is
  about one unit's reading as its severity changes.

**Honest estimate.** About **35–45%** that the requester judges it new. The likely objection is "that's the hook
effect, generalized" or "Dunning–Kruger for instruments". My searches found no cross-field name; "pseudonormalization"
appears only in clinical literature. Two of my research helpers reached it independently from different seeds
(lab science, clinical practice), which suggests the pattern is real and recurrent. It doesn't prove the concept is
new.

---

## B. Refractory-check capture

**In one sentence.** When passing an accountability check buys immunity from the next one, the party being checked
gains by *running the check on itself*, at a moment, forum or opponent of its choosing, and the check becomes a
shield.

**Real cases.**
1. **UK party politics.**
   - In 1995 John Major resigned the Conservative leadership ("put up or shut up") to force a contest on his own
     timing, against a challenger of his choosing. He won 218–89.
   - Under rules in force since 1998, a leader who survives a confidence vote is immune from another for 12
     months.
     - Theresa May survived one in December 2018 (200–117). Rebels then spent months trying to get the
       1922 Committee to shorten her immunity. It refused, so she was eventually pushed out by other means.
     - Boris Johnson survived one in June 2022 and fell a month later to mass resignations, a channel the
       immunity didn't cover.
2. **Corporate governance.**
   - SEC Rule 14a-8(i)(9) let companies exclude a shareholder proposal that conflicted with management's own. In
     2014 Whole Foods put up its own weaker proxy-access proposal to exclude a stronger one, and the SEC
     suspended that use of the rule in 2015.
   - Wirecard commissioned its own "independent" special audit in 2019 to end speculation. (It backfired.)
3. **International criminal law.**
   - After the First World War, Germany held its own Leipzig trials (1921) of a handful of accused, with lenient
     results, instead of extraditing them.
   - The Rome Statute now carves out proceedings undertaken "for the purpose of shielding the person"
     (arts. 17(2)(a), 20(3)(a)).
4. **Litigation and patents.**
   - In a class-action "reverse auction", a defendant settles with the weakest plaintiffs' lawyers to buy
     class-wide preclusion (*Reynolds v. Beneficial National Bank*, 7th Cir. 2002).
   - US supplemental examination (35 U.S.C. §257) lets a patent owner put damaging information to the patent
     office, with no opponent present, to cleanse later inequitable-conduct defenses.

**Moves it licenses.**
- **Designer:**
  - Scale immunity to how adversarial the check was. A self-triggered or narrowly passed check should buy less
    immunity, or none.
  - Key immunity windows to triggers the target doesn't control.
- **Challenger:**
  - A failed weak challenge is a gift to the target. Don't fire until the winning coalition is committed.
  - Read the target's "bring it on" as its own estimate that conditions favour it.
- **Anyone evaluating a clean record:** ask who chose the timing, the forum and the opponent of the check that
  produced it.

**What falls out of it.**
- **Bimodal accountability.** Long quiet spells punctuated by overwhelming strikes, with opposition displaced into
  channels the bar doesn't cover.
- **Anti-sham doctrine grows with the length of the bar:**

  | Length of bar | Anti-sham doctrine it has produced |
  |---|---|
  | Permanent preclusion | Collusion and adequacy doctrines |
  | Twelve months | Timing rules |
  | One session (a motion to reconsider) | Nothing |

- **Occupying the checker.** The game surfaced this: an inspector busy with a check you invited can't be where you
  look bad. It's the "torpedo" tactic of filing first in a slow court.

**Nearest known ideas, and why it isn't them.**
- **Sham-litigation and collusive-suit doctrines** (the *Noerr–Pennington* sham exception, *Lord v. Veazie*).
  These police specific abuses inside law, without a general concept linking party rules, labour bars,
  preclusion and patent cleansing.
- **Election timing ("surfing")** and the **stalking horse.** Each is one tactic of the pattern.
- **Inoculation theory** (McGuire) has the same shape for beliefs (weak exposure confers resistance), but says
  nothing about institutional checks.
- **Damage boosting** in speedrunning is the game-mechanical analogue.

**Honest estimate.** About **40–50%** new. The likely objection: "known in pieces: collusion doctrine plus election
timing."

---

## C. Emergent: Certified collapse

**In one sentence.** When a check reads a fold-back signal *and* grants immunity, it is easiest to pass past the
fold. So certificates cluster on collapsing systems and seal them away from further scrutiny or help, and a quiet
system that *volunteers* for inspection is showing a symptom.

**Why it's emergent rather than additive.** Neither parent predicts it.
- Fold-back alone says silence is ambiguous. It says nothing about checks being *sought*.
- Capture alone says targets pick favourable moments. It doesn't say the most favourable moment is collapse.

**Real cases.**
1. **Mid Staffordshire NHS Foundation Trust.** It was authorised as a Foundation Trust on 1 February 2008, in the
   middle of the 2005–09 care failures, while appearing largely compliant with the regulator's standards. The
   alarm came from mortality statistics, an external load signal. Patients' and staff's complaints had been
   ignored or silenced.
2. **Wirecard.**
   - In 2019 the regulator banned short-selling of the stock and filed a criminal complaint against Financial
     Times journalists, attacking the producers of the warning signal.
   - The firm then commissioned its own special audit to "end speculation". In June 2020, €1.9 billion turned out
     not to exist.
3. **Intensive care.** A "normal" CO₂ in a tiring asthmatic, read as improvement, is how patients get stepped down
   just before arrest. The clinical rule "don't de-escalate on normalization" exists to block certified collapse.

**Moves.**
- A pass on a capacity-generated signal must never buy immunity or reduced monitoring.
- When a quiet target asks to be inspected, answer with an external probe, not the usual one.
- Schedule checks on external triggers, and shorten immunity after quiet passes.

**What falls out of it.**
- **A testable prediction:** clean certificates should cluster shortly before scandals, more than the inspection
  interval would predict.
- **The longest immunity windows produce the largest collapses.**
- **"Getting better looks worse."** Help re-opens the signal, so a regime that inspects the signal punishes
  recovery. The rational response is to keep the inspector busy while a system recovers. This came out of the
  game's rules; I didn't design it in.

**Nearest known ideas.** "False reassurance", "the calm before the storm", Minsky's "stability is destabilizing",
"watermelon" status reports (green outside, red inside). None of them contains the mechanism: a non-monotonic
signal combined with a self-timed, immunity-granting check.

**Honest estimate.** About **30–40%** new. It inherits its parents' weaknesses, but the "volunteered inspection is a
symptom" corollary is, as far as I can find, unstated anywhere.

---

## Near neighbours that were not chosen

These were strong runners-up, documented in [`process-v2/04-pre-ranking.md`](process-v2/04-pre-ranking.md):

- **Placeholder activation:** the stub quotes in the 2010 flash crash, and the paper candidates in Canada's 2011
  election.
- **Settledness trap:** Windrush.
- **Open top bracket:** Titanic's lifeboat table.
- **Remedy–signature collision:** vaccinated herds that test positive.
