# Solo Deck Catalogue — COMPLETE

Catalogued 2026-07-03 from photos of the physical cards (`docs/images/`, local only) and
cross-checked against the Rulebook (pp. 22–23) and its component list ("12 Solo cards").

> ✅ **The PRD's blocking data dependency is resolved.** An earlier version of this file
> mistook the 12 teal "A/B" cards for the solo deck — those are actually the **First
> Colonist cards** (beginner variant, see `card-database.md`). The real solo card faces
> match the rulebook exactly.

## Card anatomy

Each solo card front shows three fields:

1. **Mission letter** (red circle: A, B, or C) — after the first reshuffle of the deck,
   move this Mission's tracker cube down one space (Lacerda gains Crystals as usual).
2. **Travel marker** — a cube with either an arrow (Lacerda travels with the Shuttle in
   the Shuttle phase) or a red **✗** (he does not travel). Rulebook: "Lacerda always
   chooses to travel with the Shuttle unless the most recent solo card depicts an X next
   to the cube."
3. **Astronaut action number** (1–3) — which numbered action Lacerda takes on his turn
   (Orbit side: 1 Obtain Blueprint, 2 Learn New Technology, 3 R&D; Colony side:
   1 Construct a Building, 2 Upgrade a Building, 3 Hire Scientist / Take Contract).

## The 12 cards

| # | Mission | Travel | Action |
|---|---------|--------|--------|
| 1 | A | yes | 2 |
| 2 | A | **✗ no** | 2 |
| 3 | A | yes | 1 |
| 4 | A | yes | 3 |
| 5 | B | yes | 1 |
| 6 | B | **✗ no** | 3 |
| 7 | B | yes | 1 |
| 8 | B | yes | 2 |
| 9 | C | **✗ no** | 1 |
| 10 | C | yes | 2 |
| 11 | C | yes | 1 |
| 12 | C | yes | 3 |

*(Numbering is arbitrary — cards within the deck are distinguished only by their field values.)*

## Distribution properties (useful for the app's RNG and for verification)

- 4 cards per Mission letter (A, B, C).
- Exactly one "no travel" (✗) card per Mission letter — 3 of 12 cards overall.
- Action distribution: five 1s, four 2s, three 3s.
- Per-letter action spread: A = {1, 2, 2, 3}; B = {1, 1, 2, 3}; C = {1, 1, 2, 3}.

## Engine notes

- Deck: 12 cards, drawn without replacement; reshuffle discards when empty. From the
  second pass onward, each reveal also moves the card's Mission cube down one space.
- The "most recent solo card" governs the Shuttle-phase travel decision — the app must
  retain the last revealed card across phases.
- Ambiguity resolution ("number the options, draw until a number shows, then reshuffle")
  uses this same deck; the app can simulate it with correct odds without disturbing the
  main deck sequence, since the procedure ends with a full reshuffle.
