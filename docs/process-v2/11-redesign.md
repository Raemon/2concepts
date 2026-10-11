# 11 — Redesign after feedback: "neither fun nor comprehensible"

The requester played HUSH and judged it neither fun nor comprehensible. The concepts stay. The game design restarts.

## Why HUSH failed (my diagnosis)

**Comprehension**
- **The fiction fought intuition.** "A flower opens when it's thirsty" isn't true of real flowers (they wilt), so
  every rule had to be learned from scratch.
- **Too many invisible rules:** thirst rates, the peak at 6, water regeneration, the Owl's 60% threshold, glass
  blocking water, Owl rest. None of them could be guessed from the picture.
- **The smoke-thread chart was novel but had to be read like a graph.** That's a cognitive tax before any fun
  starts.
- **The concept arrived as a puzzle rule, not a recognizable truth.** Nobody already knows that thirsty lotuses
  close.

**Fun**
- **The core verb (tap a flower) had no physicality and almost no skill.** Water was scarce, so most of the time
  was spent waiting for breaths.
- **The levels were tight solver-designed puzzles.** For ordinary players that means trial and error.
- **The second verb (tap the Owl, then a flower) was abstract,** and its payoff (glass) had three side effects.

## What the redesign must do

1. **A fiction where the fold-back signal is a known, real, surprising truth.** The player should recognize it,
   not memorize it.
2. **A physical, skill-based core verb that's fun in five seconds,** before any concept appears.
3. **Every rule visible on screen;** no hidden counters.
4. **Each concept arrives as a twist on something the player is already doing** ("BUT…").
5. **Keep the guarantees:** solver-checked levels, a 340–700 px widget, no scroll trapping.

## Game-space search, round 2: fictions for a fold-back signal

| Fiction | Real fold-back? | Core verb | Verdict |
|---|---|---|---|
| **Lifeguard.** "Drowning doesn't look like drowning": real drowning is silent; the splashing, shouting swimmer still has strength | Yes. Textbook lifeguard training (the instinctive drowning response); widely shared (Vittone, 2010) | Throw a ring buoy | **Chosen.** Iconic, visual, physical, and a real life-saving lesson |
| Firefighter: fires melt their own smoke alarms | Partly. Big fires are still visibly on fire | Spray a hose | Weak ambiguity |
| ER triage: the quiet patient is crashing | Yes | Taps | Grim; no physical verb |
| Sheepdog: a "cast" sheep on its back goes quiet | Yes, but obscure | Steer a dog | Too obscure |
| Daycare: choking is silent | Yes | Taps | Too grim |
| Server room: alerts die with the logging system | Yes | Taps | Only for nerds |

## STILL WATER: the design

- **Core verb: tap the water to throw a ring buoy.**
  - The ring arcs out from the lifeguard tower and splashes down where you tapped.
  - A swimmer in trouble near the splash grabs it, and the lifeguard hauls them in.
  - There's skill in leading drifting swimmers and in landing close.
- **Swimmers are visibly in one of three states:**
  - *Swimming:* fine.
  - *Struggling:* waving, splashing, shouting "HELP!". Loud, but they still have strength.
  - *Drowning:* upright, head tipped back, mouth at the waterline, no splashing, no sound, slowly sinking.
- **The rules that carry fold-back:**
  - A struggling swimmer who isn't rescued goes quiet. **That's worse, not better.**
  - Some swimmers go straight to silent.
  - A drowning swimmer can't reach for a ring, so it has to land almost on top of them.
- **The probe (the dilution test):** blow the whistle. Every swimmer who can wave back or shout does. The ones who
  can't are the ones in danger. Decoys (people treading water calmly, floaters) are quiet too, but they wave
  back.
- **The Captain (refractory-check capture):**
  - He drives up to inspect. Anyone splashing and shouting when he looks is a strike.
  - If the water looks calm, he awards a star and won't be back for a while.
  - You can radio him to come *now*, at a moment you choose.
  - While he's inspecting you're standing with him and can't throw.
- **Certified collapse:**
  - The Captain only sees noise, so a silent drowner passes his inspection.
  - Calling him in while someone is quietly drowning costs you the seconds you needed.
  - **"Captain vision":** during an inspection the screen shows only what he can see, the splash rings. Silent
    swimmers vanish from the picture until it switches back.
- **Graphics that carry the concept: sound made visible.**
  - Every splash and shout sends rings across the water, so the beach is a map of noise.
  - Silence shows up as a hole in that map, and a struggling swimmer's rings fading out *without a rescue* is the
    fold-back, visible.
  - Captain vision shows the world through the check's eyes.
