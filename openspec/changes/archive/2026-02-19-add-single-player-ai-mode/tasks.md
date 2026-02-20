## 1. Settings and Mode Plumbing

- [x] 1.1 Add `gameMode` (`hotseat` | `single_player`) to settings defaults and normalization logic.
- [x] 1.2 Add a game mode control to the New Game settings modal UI in the Game Rules section.
- [x] 1.3 Wire `SettingsMenu` event handling to persist `gameMode` through local storage.
- [x] 1.4 Pass resolved `gameMode` from `main.js` initialization into game runtime state.
- [x] 1.5 Ensure backward compatibility by defaulting missing persisted `gameMode` to `hotseat`.

## 2. AI Controller Integration

- [x] 2.1 Create a client AI controller module responsible for automated Player 2 turns.
- [x] 2.2 Define a turn-execution entrypoint that can be called from turn lifecycle events.
- [x] 2.3 Add runtime state flags for AI activity (for input gating and re-entrancy protection).
- [x] 2.4 Wire AI controller creation and teardown into app/game lifecycle.

## 3. Turn Flow Changes

- [x] 3.1 Update turn transition logic to skip pass-device modal when `gameMode` is `single_player`.
- [x] 3.2 Trigger AI turn execution automatically when active player becomes Player 2 in `single_player`.
- [x] 3.3 Keep existing hotseat transition behavior unchanged when `gameMode` is `hotseat`.
- [x] 3.4 Add fail-safe handling so AI always yields control or ends turn (no deadlock).

## 4. Baseline AI Behavior

- [x] 4.1 Implement baseline ship action ordering (board if legal/high value, else attack, else move).
- [x] 4.2 Reuse existing game action APIs (`selectShip`, mode entry, move/attack/board, `endTurn`) for rule parity.
- [x] 4.3 Enforce fog fairness by limiting direct targeting to visible enemies and ghost data only.
- [x] 4.4 Prevent AI from issuing actions for destroyed or exhausted ships.
- [x] 4.5 Implement deterministic action budget/iteration limits to avoid infinite loops.

## 5. Cinematic Pacing and Input Gating

- [x] 5.1 Add centralized AI pacing constants for per-action delays.
- [x] 5.2 Apply non-zero delays between AI-visible actions (selection, movement, combat).
- [x] 5.3 Gate/ignore human action input while AI is executing its turn.
- [x] 5.4 Re-enable human input immediately after AI turn completion.

## 6. Validation and Regression Coverage

- [x] 6.1 Add logic tests for settings normalization/persistence of `gameMode`.
- [x] 6.2 Add logic tests for single-player turn flow (auto AI turn, no transition modal path).
- [x] 6.3 Add logic tests that hotseat mode remains unchanged (manual handoff retained, no AI execution).
- [x] 6.4 Add tests/assertions for fog-fair AI targeting constraints.
- [x] 6.5 Perform manual QA pass for both modes (start, restart, win condition, fog on/off, tutorial start path).
