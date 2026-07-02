# Product Requirements Document: On Mars Solo Companion App

**Status:** Draft v1
**Date:** 2026-07-03
**Owner:** Ian Dela Cruz (@ianpogi5)

---

## 1. Problem Statement

*On Mars* (Vital Lacerda, Eagle-Gryphon Games) ships with a solo mode in which the player competes against an automa opponent named **"Lacerda"**, driven by a 12-card solo deck. Reviews consistently describe the mode as *exhausting to run*: the player is effectively playing two games at once — their own strategic game, plus manually executing a rules-dense bot whose every turn involves card draws, multi-branch decision trees, tie-breaker procedures, and state tracking.

The bot's logic is almost entirely **deterministic** (see §3). That makes it a strong candidate for automation: a companion app can *be* Lacerda's brain, leaving the player to make only the physical moves on the table and focus on their own game.

### Goal

Reduce the overhead of running the Lacerda bot so that a solo game of On Mars feels like playing **one** game, not two — without modifying the game's rules or outcomes.

### Non-Goals

- Not a full digital implementation of On Mars (no replacement for the physical board).
- No rules changes, difficulty rebalancing, or house rules in v1 (difficulty options may come later).
- No multiplayer/2-player assistant features in v1.
- Does not teach the base game; assumes the player knows how to play On Mars.

---

## 2. Target User

Solo board gamers who own On Mars, enjoy heavy euros, and either:

- avoid the solo mode because of bot-upkeep fatigue, or
- play it but spend excessive time consulting the rulebook's solo pages (pp. 22–23) mid-game.

---

## 3. Pain Point Analysis (mapped to the official solo rules)

Everything below is taken from the Rulebook (`docs/On Mars Rulebook EN Preview.pdf`, pp. 22–23). Each pain point is tagged with how automatable it is:

| # | Pain point (rule) | Manual burden today | Automatable? |
|---|---|---|---|
| P1 | **Solo deck management** — reveal a card each Lacerda turn, discard, reshuffle when empty | Physical deck handling, remembering discard state | ✅ Fully (digital deck) |
| P2 | **Second-pass Mission rule** — after the first reshuffle, every card *also* moves the indicated Mission tracker cube down and awards Crystals | Very easy to forget; changes mid-game | ✅ Fully (app knows deck cycle count) |
| P3 | **Action decision trees** — each card maps to an Orbit action (Obtain Blueprint / Learn Tech / R&D / Resupply) or Colony action (Construct / Upgrade / Hire Scientist–Take Contract), each with its own priority rules ("cheapest, leftmost", "most-developed then least-developed, bottom if tied", "Blueprint type that scores his Scientists"…) | Constant rulebook lookups | ✅ Mostly — app renders the exact instruction; player answers short prompts where table state is needed |
| P4 | **Resolving Ambiguities** — number the tied options, draw solo cards until a number matches, reshuffle the deck | The single fiddliest procedure in the mode | ✅ Fully (app resolves instantly with correct odds) |
| P5 | **Shuttle phase logic** — Lacerda travels unless the most recent card shows an X; random turn-order space; skip steps depending on destination; turn-order benefit rules ("most of, leftmost, Crystals first") | Multi-step conditional every phase | ✅ Fully |
| P6 | **Lacerda's state** — Crystals (capped by Depot spaces), Blueprints, Scientists, auto-completed Contracts, Tech tiles and Lab placement, Shelters, Ships, Bots (kept on player board), LSS-sequence position of his Bot (Mine > Generator > Water Extractor > Greenhouse > Oxygen Condenser > loop) | Tokens and memory | ✅ Fully (app is source of truth for Lacerda's state) |
| P7 | **Illegal-move fallback** — if Lacerda can't pay the Colonist placement cost in Crystals or the action is illegal, he moves his Rover instead | Requires validity check before every action | ✅ Mostly — app checks Crystals itself, asks yes/no for board-dependent legality |
| P8 | **Rover movement** — toward the closest collectible tile, ignoring resource-only Discovery tiles, using Tech, spending Crystals, ties via P4 | Spatial judgment on the physical board | ⚠️ Assisted — app states the criteria + resolves ties; player picks the target on the table |
| P9 | **Construction placement** — build the Bot-icon building only if its LSS marker is below Colony level, else advance through the sequence; always build the largest Complex possible; then advance the Bot icon | Nested conditionals + spatial choice | ⚠️ Assisted — app computes *which* building type via short prompts; player places it |
| P10 | **Colony level-up interrupt** — Lacerda builds a Shelter (Complex if possible), Welcomes a Ship, takes a Bot | Interrupt that's easy to mishandle | ✅ Guided checklist triggered by one tap |
| P11 | **End-game scoring for Lacerda** — Living Quarters counted as full, kept Ships score, Tech tiles, Contracts auto-complete, etc. | Error-prone arithmetic | ✅ Fully (score calculator) |
| P12 | **Solo Goal verification** — 4 goal cards, each a checklist of 5–8 requirements the player must fully satisfy to win | Manual checklist audit | ✅ Fully (live checklist) |

**Conclusion: yes, a companion app can change this.** Roughly 80% of the bot's overhead (P1–P7, P10–P12) can be fully automated; the remaining spatial decisions (P8, P9) become short guided prompts instead of rulebook dives.

---

## 4. Product Concept

A mobile-first companion app that acts as **Lacerda's brain**. The physical game stays on the table; the app:

1. **Owns Lacerda's hidden machinery** — the solo deck, his resources/cards/tiles, deck-cycle state, and all priority logic.
2. **Tells the player exactly what to do on the table** — one imperative instruction at a time ("Lacerda builds a **Mine**. Place it forming the largest possible Complex, then move his Bot to the **Generator** icon.").
3. **Asks, never lectures** — when table state is needed, it asks the narrowest possible question ("How many Greenhouses are on the board? 0 / 1 / 2 / 3+") instead of showing a rules page.

### Design principle: *Hybrid state model*

Two architectures were considered:

- **Full board mirror** — app models the entire map. Rejected for v1: the input burden of mirroring every tile placement would replace one kind of exhaustion with another.
- **Stateless flowchart** — app is just an interactive rulebook. Rejected: leaves deck handling, mission tracking, and Lacerda's inventory on the player.

**Chosen: hybrid.** The app fully owns Lacerda's *non-spatial* state (P1–P7 inputs) and treats the player as its "sensors and actuators" for spatial state (P8–P9), querying only what a given decision needs.

---

## 5. Functional Requirements (MVP)

### 5.1 Game setup wizard
- FR-1: Walk through solo setup deltas (2-player setup, Lacerda gets no Private Goals, his Bot starts on the Mine icon in the Progress Area, random First Colonists tile for his turn-order start, Shuttle starting side).
- FR-2: Player selects the Solo Goal (lvl 1 *First Colonists*, lvl 2 *Next Generation*, lvl 3 *Hunky Dory*, or *A Martian Potato*) — or is dealt a random one.

### 5.2 Turn engine
- FR-3: "Lacerda's turn" button reveals a virtual solo card and renders the resulting action as step-by-step imperative instructions.
- FR-4: The engine encodes every priority rule from Rulebook pp. 22–23 (see P3, P5, P7, P9 in §3) so the player never consults the rulebook mid-game.
- FR-5: Ambiguity resolver (P4): when the app or player flags a tie, the app lists the options, performs the card-draw procedure internally, and announces the result.
- FR-6: Automatic second-pass Mission rule (P2): after the first reshuffle, each card's Mission cube instruction is appended to the turn output, with Crystal awards applied to Lacerda's tracked total.
- FR-7: Shuttle phase assistant (P5): travel/no-travel from the last revealed card's X marker, random turn-order space selection, destination-specific step list, turn-order benefit resolution via minimal prompts.
- FR-8: Colony level-up interrupt (P10): a persistent "Colony leveled up" button that injects the Shelter + Ship + Bot checklist at the correct timing (end of current player's turn).

### 5.3 Lacerda state tracker
- FR-9: Track Crystals (enforcing the Depot-space cap), Blueprints (by type and used/unused), Scientists (max 2, then Contracts), Contracts, Tech tiles and Lab placement, Shelters, Ships, Bots.
- FR-10: All state changes triggered by the turn engine apply automatically; manual +/- correction is always available.

### 5.4 Scoring & goals
- FR-11: Live Solo Goal checklist (P12) the player can tick during play; app auto-ticks the requirements it can know (e.g., "Beat Lacerda by X OP" once scores are entered).
- FR-12: End-game scoring calculator for Lacerda applying all solo exceptions (full Living Quarters, kept Ships, auto-completed Contracts) and a guided count for the player's own score.

### 5.5 Session robustness
- FR-13: Full undo/redo stack — physical-game companions live and die by undo (mis-taps are inevitable mid-game).
- FR-14: Autosave and resume; a heavy euro session may span hours or days.
- FR-15: Turn log (human-readable history of every card revealed and action taken) for auditability and dispute-with-yourself resolution.

---

## 6. Non-Functional Requirements

- NFR-1: **Offline-first.** Must work with no connectivity (game tables ≠ good Wi-Fi). PWA or local-first native app; no account, no backend required to play.
- NFR-2: **Table-glanceable UI.** Large type, one instruction per screen, high contrast; the phone sits next to the board.
- NFR-3: A full Lacerda turn should require **≤ 3 taps** in the common case (reveal → confirm/answer prompt → done).
- NFR-4: Deck randomization must reproduce the physical odds exactly (12-card deck without replacement, correct reshuffle timing, ambiguity draws with reshuffle-after).
- NFR-5: No copyrighted art or rulebook text reproduced verbatim in the app; instructions are paraphrased. (Seek Eagle-Gryphon Games' blessing before any public distribution.)

## 7. Out of Scope for MVP / Future Ideas

- Difficulty variants (e.g., Crystal handicaps for Lacerda).
- Upgrade Pack / expansion support (`docs/On Mars Upgrade Pack Rules EN Preview.pdf`).
- Statistics across plays (win rate per Solo Goal, average OP).
- Player-side score calculator with full category breakdown.
- Rules reference lookup for the base game.
- Physical-deck mode (app as flowchart only, using the real solo cards) for purists.

## 8. Success Metrics

- A solo game requires **zero rulebook consultations** for bot operation (self-reported / playtest observed).
- Bot-turn wall-clock time reduced from minutes to **< 20 seconds** median.
- Playtesters report the mode feels like "playing one game" (qualitative target from §1).
- Bot behavior matches manual play exactly in scripted regression scenarios (correctness gate).

## 9. Risks & Open Questions

| Risk / Question | Notes |
|---|---|
| **IP/licensing** | The app paraphrases bot logic derived from the rulebook. Fan companion apps are common but publisher approval (Eagle-Gryphon Games) should be sought before public release. |
| **Spatial-prompt fatigue** | If P8/P9 prompts are too frequent or wordy, we recreate the original problem. Prototype and playtest the prompt density early. |
| **Rules fidelity** | Lacerda's decision trees have subtle edge cases (e.g., Construct's LSS-marker cascade, Rover tie-breaks). Encode directly from the rulebook and validate against played examples (the rulebook's own construction example is test case #1). |
| **Which platform first?** | Recommendation: PWA (installable, offline via service worker, zero store friction). Native later if needed. |
| **Solo deck composition** | The 12 solo cards' exact face distribution (action numbers, X markers, mission cubes) must be catalogued from the physical cards — the preview rulebook describes usage but not the full card list. **Blocking data dependency for the turn engine.** |

## 10. References

- `docs/On Mars Rulebook EN Preview.pdf` — pp. 22–23: Solo Game rules (source of truth for §3 and §5).
- `docs/On Mars Reference Book EN Preview.pdf` — edge-case rulings.
- `docs/On Mars Upgrade Pack Rules EN Preview.pdf` — future expansion support.
- `docs/player_aids_V8_LowRes.pdf` — player-facing summaries; tone reference for in-app instructions.
