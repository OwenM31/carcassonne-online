# Carcassonne Online: Agent Context
A web-based, online multiplayer clone of the Carcassonne base game.

## 1. Core Tech & Architecture

* **Stack:** React (Atomic Components), Node.js (SOA), Strict TypeScript (No `any`).
* **Logging:**
    *  **Frontend:** `loglevel` (wrapped in a utility)
    * **Backend:** `pino` (JSON in prod, `pino-pretty` in dev)
* **Rules:** 
    * **Frontend:** Atomic, reusable components with clear structure. No business logic in `App.tsx`.
    * **Backend:** Service-Oriented architecture (SOA). Decouple Services (logic) from Controllers (transport).
    *  Use Dependency Injection for testability.
* **Styling:** Relative units only (`rem`, `%`, `vh`); no `px`.

## 2. Workflow & Dev Protocol

* **TDD:** Red  Green  Refactor. Run tests every turn.
* **Git:** Atomic commits on every "Green" state. Format: `type: description`.
* **Branching:** `feature/name` off `develop`.
* **Versioning:** Increment the right-most app version number in `client/src/config/version.ts` on every commit.

## 3. Coding Standards

* **Structure:** Files must include `@description`, grouped imports, and named exports.
* **Size:** Maximum 200 lines per file; enforce Single Responsibility (SRP).
* **Clean Code:** Follow DRY and KISS principles.

## 4. Agent Behavior & Memory

* **Clarify:** Ask questions before generating code if requirements are ambiguous.
* **Update Memory:** Automatically update the **Project Memory** below when:
1. Architectural decisions are made.
2. The user states a recurring preference.
3. A specific "Green" TDD milestone is reached.

---

## 5. Project Memory (Agent to maintain)

* **User Preferences:** Run tests (`npm test`) every turn; commit (`git commit`) on green; increment right-most app version number each commit.
* **Current Focus:** Gameplay QoL, replay ergonomics, and realtime disconnect/reconnect hardening.
* **Accomplished:** [Maintain this list with task completions with most recent at the top; ocasionally condense this list]
    * Treat Abbot+River and Abbot+River 2 combo IDs as river-addon tiles for deck classification/order so their bonus river tiles stay in the opening river segment in standard mode, with game-service regression coverage
    * Increase on-board meeple role label size/weight and color the label background per owning player color while retaining zoom-invariant label sizing for readability
    * Add board-focus zoom behavior so wheel/pinch zoom is captured only while the board is focused (with outside-click unfocus and focus border), plus inverse-scale meeple role labels to keep their text size stable regardless of board zoom level
    * Add a game hotbar toggle for `auto-zoom on new tile` (default off) and gate board re-fit-on-growth behind this setting so the board still fits once initially but no longer auto-resets zoom after each tile unless explicitly enabled
    * Rename lobby add-on label `Abbot` to `The Abbot` and refine River/The River 2 overlap indicator display so only the later-selected river add-on shows the red `(-2 Tiles)` adjustment while preserving dynamic net tile modifier calculations
    * Fix River + River 2 additive tile math to 22 (exclude River spring/lake in combined mode) across shared catalog/deck building so lobby deck counts and dynamic add-on modifiers reflect the true combined-river rules while preserving full reference catalog behavior for placement validation
    * Rename lobby add-on labels to `The River` / `The River 2` and implement dynamic per-option tile modifiers in add-on selection (gold positive bonus tiles, red negative tile reductions) based on catalog delta math so interaction effects work in either selection order and scale to future add-ons
    * Add automatic Abbot combo tile support for River (1), River 2 (2), and Inns & Cathedrals (2), wire new combo tile sheets/assets into rendering, validate ABIC inner-field four-city-stub feature behavior, and surface gold bonus-tile hints in lobby add-on selection when Abbot enables combo bonuses
    * Add River expansion support (12 tiles + assets), unify river-opening rules across River/River 2 with shared no-u-turn validation, apply River+River 2 compatibility (drop River spring/lake when combined), and add automated-bot regression coverage for river add-on play
    * Add Abbot expansion support with 8 garden tiles, per-player abbot piece state, garden feature analysis/scoring, Abbot place/return actions (including AI automation paths), and UI/HUD/rules updates plus extracted abbot meeple/tile assets
    * Add River 2 expansion support with forced standard-mode river opening order (R1C1 start, R1C2 second, randomized R3C3/R3C4 endings), no-immediate-u-turn river placement validation, sandbox placement exemptions, and in-game River Tiles Remaining HUD tracking
    * Add Inns and Cathedrals AI support so RANDY/MARTIN/JUAN can execute big-meeple placements (including no-normal-meeple turns) during automated play
    * Allow any lobby participant to change AI seat colors and relabel Inns and Cathedrals HUD availability from `Big meeple ready` to `Big meeple 1/1`
    * Extend sprite export pipeline to generate transparent expansion assets for big meeples, builders, and pigs (plus per-group preview strips and a manifest) from the master figure sheet
    * Pre-export transparent meeple sprites from the figure sheet into dedicated client assets and switch board rendering to load static sprite files instead of runtime canvas keying
    * Replace board meeple dots with extracted sprite-sheet meeples (white background keyed out at load time) and update player color palette/order to black, red, yellow, green, blue, gray, pink across shared typing, server assignment, lobby labels, HUD chips, and event tinting
    * Add lobby QoL controls: connect/disconnect toggle plus in-card start action, bot `X` removal in lobby, reordered settings controls, and per-client `(You)` session-list markers via personalized session summaries
    * Expand sessions to 6 players and switch player color order/palette to yellow, green, white, orange, blue, purple across shared types, server assignment, client rendering, and tests
    * Redesign lobby session cards with a status-plus-session header, two-column players/settings layout, AI `+` picker, and deck/sandbox/timer controls
    * Extract turn-timer automation into dedicated strategy modules so RANDY and MARTIN logic live in separate service files
    * Add Cloud Build support for bucket-backed Cloud Run session-state volume mounts (`_SESSION_STATE_BUCKET` and mount/path substitutions) with automatic `SESSION_STATE_FILE` wiring
    * Wire Cloud Build server deploy to optionally set `SESSION_STATE_FILE` via `_SESSION_STATE_FILE` substitution for production rollout control
    * Add durable session snapshot persistence with boot restore (`SESSION_STATE_FILE`) so lobby/game state survives server restarts and can support shared-mount failover setups
    * Harden disconnect handling with server heartbeat ping/pong cleanup, socket-bound player action authorization, reconnect queue retention ordering, and lobby session-player ID privacy
    * Add optional replay hotbar toggle to auto-jump back to current board when live game updates arrive during read-only rewind
    * Add sandbox board reset/refill action and cross-mode read-only turn replay with board hotbar controls plus click-to-rewind event-turn grouping
    * Show joined player names directly under each session card in the lobby and remove separate global lobby player list
    * Add sandbox session mode (single-player start + manual tile picker with remaining counts) and regression coverage that undo restores score state after scoring actions
    * Add end-game polish: immediate game-over after final tile turn (no empty-deck draw), preserve meeples on board after final scoring, and add scrollable HUD event log timestamps
    * Add per-session small-deck option in lobby (ceil half by tile type), wire selection through shared protocol/server session config/game start, and align tile-catalog tests to current catalog data
    * Add global app footer with shared version constant and display version `0.1.100` across lobby/game views
    * Correct `T_R2C4`/`T_R2C5` city-farm feature metadata to restore catalog consistency and passing tile validation tests
    * Harden realtime stability with websocket reconnect/auto-rejoin, grace-period disconnect handling, and Cloud Run timeout/instance pinning defaults
    * Switch meeple placement to board-click ghost anchors with on-feature role labels while keeping skip action
    * Color-code game event log rows by acting player and wire in-game return-to-lobby control
    * Simplify lobby chrome to a single "Carcassonne Online" header bar and remove server label exposure
    * Add delete-session support in lobby list across shared protocol, server session registry, and client UI
    * Set up Google Cloud Build + Cloud Run CI/CD pipeline for monorepo client/server deployment
    * Add standard scoring engine (during game and final scoring) with meeple return handling
    * Add friendly undo support with turn-action history
    * Render on-board meeple indicators by feature anchor
    * Resolve end-game transition with final scoring when deck is exhausted
    * Add optional meeple placement phase with skip action and meeple occupancy validation on connected features
    * Add feature graph analysis for cities/roads/farms/monasteries with open vs closed city/road counters
    * Add game HUD scoreboard and event log with per-player meeple availability tracking
    * Shuffle the 72-tile deck at game start
    * Align placement coordinates with board north-up layout
    * Create lobby screen
    * Init project
