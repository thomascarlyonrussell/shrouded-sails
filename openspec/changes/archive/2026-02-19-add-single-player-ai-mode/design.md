## Context

Shrouded Sails currently runs as a two-human hotseat game, with turn progression centralized in `TurnManager`, action execution in `Game`, and player input through `InputHandler`. Settings are selected in `SettingsMenu` before match start and persisted to local storage.

This change introduces a single-player mode where Player 2 is automated. The implementation must preserve existing tactical rules (movement, fog, combat, boarding, wind, win checks) and avoid introducing hidden rule paths that differ from human play.

## Goals / Non-Goals

**Goals:**
- Add pre-game game mode selection for `hotseat` and `single_player`.
- In `single_player`, enforce Player 1 as human and Player 2 as AI.
- Remove pass-device turn transitions in single-player flow.
- Run AI turns automatically with cinematic pacing and visible action sequencing.
- Keep hotseat flow behaviorally unchanged.

**Non-Goals:**
- Multiplayer/networked play.
- Advanced AI difficulty tiers, personality profiles, or learning models.
- Side selection (human as Player 2) in this change.
- Balance retuning of ship stats, combat math, or wind rules.

## Decisions

### 1. Represent mode in persisted settings and runtime game config
- Decision: Add a game mode enum (`hotseat`, `single_player`) to settings persistence and pass it into game initialization.
- Rationale: The existing settings pipeline already owns pre-game configuration and restart behavior.
- Alternatives considered:
  - Runtime toggle during a live match: rejected because control ownership and turn UX are start-of-game concerns.
  - URL/query param only: rejected because it bypasses UI and persistence expectations.

### 2. Lock control roles in single-player
- Decision: In single-player, human is always Player 1 and AI is always Player 2.
- Rationale: Matches user decision and reduces branching in turn orchestration, tutorials, and UI labeling.
- Alternatives considered:
  - Side-select option: rejected for v1 scope and test matrix growth.

### 3. AI orchestration is turn-driven, not render-loop-driven
- Decision: Trigger AI execution from turn lifecycle after player switching/start, not per-frame.
- Rationale: Turn events are deterministic and already gate win checks, resets, and modal flow.
- Alternatives considered:
  - Calling AI from render loop: rejected due to race risk and repeated execution hazards.
  - Embedding all AI state in `Game`: rejected to keep `Game` focused on rules/actions.

### 4. Single-player removes pass-device transition modal
- Decision: Skip turn transition modal logic in single-player for both directions (P1->P2 and P2->P1).
- Rationale: Pass-device UX is unnecessary with one human and slows flow.
- Alternatives considered:
  - Keep modal only before AI turns: rejected as redundant friction.

### 5. Baseline heuristic AI using existing action APIs
- Decision: AI executes ship decisions through existing public game actions (`selectShip`, mode entry, `moveShip`, `attackShip`, `boardShip`, `endTurn`) with no rule bypass.
- Rationale: Guarantees parity with human validation paths and minimizes regression surface.
- Alternatives considered:
  - Direct state mutation (teleport/damage/ownership): rejected as brittle and unfair.

### 6. Cinematic pacing by staged delays
- Decision: AI performs actions with non-zero delays between decision, movement, and combat execution.
- Rationale: Preserves readability of combat feed, camera framing, and feedback sounds.
- Alternatives considered:
  - Instant AI resolution: rejected by product decision.
  - Fully animated timeline engine: deferred; too heavy for baseline.

### 7. Fair-information policy under fog
- Decision: AI target selection uses currently visible enemies plus last-known ghost data only; no omniscient use of hidden enemy positions.
- Rationale: Keeps fog gameplay fair and aligned with player expectations.
- Alternatives considered:
  - Full-map omniscient AI: rejected as unfair and inconsistent with fog design.

## Risks / Trade-offs

- [Input race during AI turn] -> Gate human input paths while AI is acting and re-enable on AI completion.
- [AI can stall on edge cases] -> Add max-steps/action budget and guaranteed fallback `endTurn`.
- [Cinematic delays slow pacing too much] -> Centralize delay constants for rapid tuning without logic rewrite.
- [Fog fairness bugs] -> Restrict candidate targets to visibility APIs and add tests around hidden enemies.
- [Hotseat regression] -> Keep mode branching explicit and add regression tests for existing transition behavior.

## Migration Plan

1. Add game mode setting and persistence with default `hotseat` when absent.
2. Introduce AI controller module and integrate turn trigger points.
3. Branch turn transition behavior by game mode.
4. Add input gating during AI turns.
5. Add deterministic logic tests for AI turn triggering and mode-specific transitions.
6. Validate manual gameplay in both modes.

Rollback:
- Revert mode branching to hotseat-only path.
- Keep stored setting backward-compatible by ignoring unknown or removed keys and defaulting to `hotseat`.

## Open Questions

- None for baseline scope; product decisions for role lock, transition removal, pacing style, and single AI tier are fixed.
