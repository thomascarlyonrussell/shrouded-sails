## Why

The game currently requires two human players sharing one device, which limits accessibility and replay value when only one player is available. Adding a single-player mode now enables solo play without changing core combat rules or board systems.

## What Changes

- Add a new game mode setting so players can choose `Hotseat` or `Single Player` before match start.
- In single-player mode, keep Player 1 as the human-controlled side and make Player 2 fully AI-controlled.
- Remove the pass-device turn transition step for single-player flow.
- Add a baseline AI turn loop for Player 2 that uses existing movement, attack, and boarding rules.
- Use cinematic pacing for AI turns so actions are visually readable instead of instant.
- Keep existing hotseat behavior unchanged when hotseat mode is selected.

## Capabilities

### New Capabilities
- `single-player-ai-mode`: Solo match flow with a computer-controlled Player 2, including AI turn execution and pacing rules.

### Modified Capabilities
- `structured-settings-dialog`: Add game mode selection to pre-game settings and persist the selection alongside existing settings.

## Impact

- Affected client systems: `SettingsMenu`, `main.js` initialization flow, `Game`, `TurnManager`, `InputHandler`, and new AI controller module(s).
- No backend/API changes required.
- No new third-party runtime dependencies expected.
