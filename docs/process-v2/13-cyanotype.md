# 13 — The look: a cyanotype whose sea is a live engraving

The first STILL WATER build used a generic flat cartoon beach. The requester asked for one more pass: beautiful, with
a novel aesthetic. I wanted the look to come from the game's own idea, sound made visible and silence as the
warning, rather than from a new coat of paint.

## The idea

- **The scene is a cyanotype.** Cyanotype is the Prussian-blue sun print from 1842, the process Anna Atkins used for
  the first photographically illustrated book.
  - It's printed on cool white paper, with the ragged edges a coating brush leaves.
  - The blue is the sea, uneven where the chemistry pooled.
  - Paper-white is everything that blocked the sun.
- **The sea is an engraving that listens.**
  - The water is drawn as fine paper-white lines, like a copperplate sea on a nautical chart.
  - A real-time wave simulation (a 2D ripple field) bends the lines. Every splash and shout sends ripples through
    them, and a ring landing makes a burst.
  - Line weight follows the light on the water, so the swell shades itself the way an engraver's lines swell and
    thin.
  - A yelling swimmer sits in a ring of disturbed lines. A swimmer drowning silently sits in **perfectly still
    lines**. The title becomes the warning: still water is where to look.
- **Beach things are photograms**, the white silhouettes left where objects lay on the paper in the sun:
  umbrellas with half-transparent panels, striped towels, a starfish, a shell, footprints, the lifeguard hut.
- **Colour is rationed.**
  - Only the lifeguard's red and yellow (the surf-lifesaving flag, the cap, the lifebuoys) and the Captain's violet
    rubber-stamp ink cut through the blue.
  - Red always means trouble: HELP, no answer, a strike.
  - Violet always means the Captain: his badge, his hat, his seal, "certified safe…".
- **Captain vision is the negative.**
  - When he inspects, the print flips to blue lines on white paper, with a quick shutter flash, and the swimmers
    vanish.
  - What's left is exactly what he judges by, the disturbance in the lines.
  - Silent drowners leave none, so in his picture they aren't there.
- **Certified collapse is a paper seal**: violet ink on a round paper certificate he slaps onto the print, "CERTIFIED
  · SAFE · BY THE CAPTAIN", while someone drowns a few lines away.
- **Type and labels.**
  - The type is IM Fell (a revival of 17th-century letterpress) for names and plates, with Archivo for controls and
    numbers.
  - In-world labels are set like specimen tags: paper rectangles with a hairline border.
  - The shift timer is an exposure: a small sun travels along a rule.

## Why I think it's new

Each ingredient has precedent: cyanotype prints, line-displacement art, photograms, wave-equation ripple effects.
What I haven't seen is the combination as a playable medium, where the engraving *is* a sound field and its
stillness is the information the player has to read. The negative-print inspection is the same move applied to the
check. Honest odds: high that a player hasn't seen a game like it; moderate that a designer couldn't point to
neighbours.

## Engineering notes

- The game rules, levels and solver are untouched. Only `render.js`, the page CSS and the colours in `game.js`
  changed.
- **Static plates are built once per size:** the sea with mottling and brush streaks, the sand stipple with the
  photograms, a negative copy for Captain vision, and the paper margin.
- **Per frame:** step the ripple field at 40 Hz, fill one compound path of variable-width line ribbons, draw soft
  blue pools around the figures so the lines fade before them, then the figures, labels and effects.
- **Speed.** In headless software rendering (no GPU), a busy Endless beach runs at about 58 fps at 380 px wide and
  40–48 fps at 700 px. If frames come slowly, the renderer caches the engraving and redraws it every second or third
  frame instead.
  - Profiling found two hot spots, both fixed:
    - An offscreen line layer with soft cut-outs cost about 18 ms per frame. The engraving is now drawn directly,
      with soft pools on top.
    - Dashed foam strokes cost about 9 ms. They're now filled pieces.
  - Pixel ratio is capped at 2.
- **Fonts.** The fonts come from Google Fonts. In a LessWrong post the sandboxed frame loads them fine (the site sends
  no CSP). If they're blocked, the page falls back to Georgia and Helvetica.
- **Tests.** The UI playthrough of all nine levels, the sandboxed-iframe harness (including the stray-paste case),
  the touch test and the LessWrong pipeline simulation all still pass.
