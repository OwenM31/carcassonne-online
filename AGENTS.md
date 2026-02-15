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
