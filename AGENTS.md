# AI Agent Instructions - Shrouded Sails

This file contains unified instructions for AI coding assistants working on the Shrouded Sails game project.

## Project Context

**Shrouded Sails** is a turn-based naval strategy game built with vanilla JavaScript and HTML5 Canvas. It's a two-player tactical game where players command fleets of ships (Sloops, Frigates, and Flagships) in fleet-vs-fleet combat across a fog-shrouded grid-based ocean map.

### Core Gameplay
- **Genre**: Turn-based tactical naval combat
- **Players**: 2 players (local hotseat)
- **Map**: 40x30 grid (or 30x40 portrait) with dynamically generated islands
- **Ships**: 3 types with different stats - Sloop (1x1), Frigate (2x1), Flagship (2x2)
- **Fleet**: Each player starts with 3 Sloops, 2 Frigates, 1 Flagship
- **Win Conditions**: Destroy all enemy ships OR capture enemy flagship
- **Mechanics**: Ship movement, cannon combat with hit chances, boarding for capture, fog of war system, wind that pushes ships each turn

### Game States
SETUP → PLAYING → GAME_OVER

Action modes within PLAYING state: NONE, MOVE, ATTACK, BOARD

## Architecture Overview

Shrouded Sails uses a **modular vanilla JavaScript architecture** with clear separation between game logic, rendering, and input handling. The codebase is organized as an npm workspace monorepo with three packages:

1. **client/** - Frontend game (Vite + vanilla JS)
2. **server/** - Backend stub for future multiplayer (Bun + TypeScript)
3. **shared/** - Shared constants and configuration

### High-Level Architecture

```
Input (Mouse/Touch/Keyboard)
    ↓
InputHandler (delegates events)
    ↓
Game (state machine + action dispatch)
    ↓
Systems (TurnManager, Combat, Fog, Wind)
    ↓
Entities (Ship, Fleet, GameMap)
    ↓
Renderer (Canvas 2D + Camera)
```

**Core Pattern**: Input → Game dispatch → State change → Renderer update

The game uses an **immediate-mode canvas rendering** approach with a main game loop driven by `requestAnimationFrame`.

### Key Directories

```
client/src/
├── core/           Game engine and input handling
│   ├── Game.js                Main state machine (690 lines, HIGH complexity)
│   ├── TurnManager.js         Turn logic, wind phase, win conditions
│   └── InputHandler.js        Mouse/touch/keyboard input delegation
│
├── entities/       Game objects and data structures
│   ├── Ship.js                Individual ship with stats/actions
│   └── Fleet.js               Fleet deployment and management
│
├── map/            Game world and environment
│   ├── GameMap.js             Grid system, islands, ship registry
│   ├── Tile.js                Individual water/island tiles
│   └── Wind.js                Wind simulation and mechanics
│
├── combat/         Battle systems
│   ├── CombatResolver.js      Attack resolution with hit chances
│   └── BoardingSystem.js      Ship capture mechanics
│
├── fog/            Fog of war system
│   └── FogOfWar.js            Vision ranges, ghost ships, scouting
│
├── ui/             Rendering and user interface
│   ├── Renderer.js            Canvas rendering engine (350+ lines)
│   ├── Camera.js              Viewport and zoom management
│   ├── HUD.js                 Heads-up display, combat log
│   ├── ShipPanel.js           Side panels showing ship lists
│   ├── ActionMenu.js          Move/Fire/Board action menu
│   ├── SettingsMenu.js        Pre-game settings modal
│   ├── InGameSettingsPanel.js Audio settings during gameplay
│   ├── SplashScreen.js        Intro splash screen
│   └── TutorialTour.js        Interactive tutorial overlay
│
├── audio/          Sound system
│   └── AudioManager.js        Audio playback, preload, volume control
│
└── main.js         Entry point, GameApp class

shared/
└── constants.js    Centralized game configuration and balance

tests/
└── grid-subdivision.spec.test.js  Unit tests for grid/collision logic
```

## Code Style Guidelines

### Language & Module System
- **Language**: Vanilla JavaScript (ES6+) - NO frameworks, NO TypeScript in client
- **Modules**: ES6 import/export only
- **Type Safety**: None (server uses TypeScript, but client does not)

### General Principles
1. **Modularity**: One major system per file, clear separation of concerns
2. **Vanilla JS Only**: Do NOT add external frameworks (React, Vue, etc.) or libraries
3. **Inject Dependencies**: Pass dependencies as constructor parameters, avoid global state
4. **Centralized Config**: All game balance values live in `shared/constants.js`
5. **Immediate-Mode Rendering**: Canvas redraws fully each frame (no dirty rect optimization)

### Naming Conventions

- **Files**: PascalCase for classes (e.g., `Game.js`, `InputHandler.js`, `CombatResolver.js`)
- **Classes**: PascalCase (e.g., `class Game`, `class TurnManager`)
- **Methods/Functions**: camelCase (e.g., `getValidMovePositions()`, `enterMoveMode()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `GAME_STATES`, `ACTION_MODES`, `SHIP_TYPES`)
- **Booleans**: Prefixed with `is`/`has`/`can` (e.g., `isDestroyed`, `hasAttacked`, `canMove()`)
- **Private Intent**: No explicit private fields; underscore prefix not consistently used

### Formatting
- **Indentation**: 2 spaces (not tabs)
- **Line Length**: No strict limit, prefer readability
- **Semicolons**: Used consistently
- **Quotes**: Single quotes for strings
- **Trailing Commas**: Not consistently used

## Testing Requirements

### Test Framework
- **Framework**: Node.js built-in `node:test` module (no Jest, Mocha, etc.)
- **Assertions**: `node:assert/strict`
- **Philosophy**: Unit tests for deterministic logic (grid math, collision, pathfinding)

### Test Structure
Tests live in `/tests/` directory at project root. Currently minimal coverage with one test file focusing on grid/collision logic:

```javascript
// tests/grid-subdivision.spec.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
```

### Running Tests

```bash
npm run test:logic
# Runs: node --test tests/grid-subdivision.spec.test.js
```

### Test Coverage
- **Current**: Grid/collision logic (Ship footprints, tile occupancy, starting zones)
- **Missing**: Combat calculations, fog of war, wind mechanics, UI interactions
- **No coverage tools configured** - this is a growth area

When adding tests:
1. Keep tests deterministic (avoid randomness without seeding)
2. Test mathematical/geometric logic (grid calculations, hit chances)
3. Avoid testing UI directly (hard with Canvas)
4. Use descriptive test names

## Important Conventions

### Ship Types & Stats
All ship data lives in `shared/constants.js` under `SHIP_TYPES`:

```javascript
SHIP_TYPES = {
  1: { // Sloop
    name: 'Sloop', hp: 4, movement: 10, cannons: 1,
    range: 4, vision: 8, footprint: {width: 1, height: 1}
  },
  2: { // Frigate
    name: 'Frigate', hp: 8, movement: 8, cannons: 2,
    range: 6, vision: 6, footprint: {width: 2, height: 1}
  },
  3: { // Flagship
    name: 'Flagship', hp: 12, movement: 6, cannons: 4,
    range: 6, vision: 4, footprint: {width: 2, height: 2}
  }
}
```

**Never hardcode ship stats** - always reference `SHIP_TYPES`.

### Grid Coordinate System
- **Coordinates**: Integer grid (x, y) starting at (0, 0) in top-left
- **Tile Size**: 30x30 pixels
- **Map Size**: 40x30 tiles (landscape) or 30x40 tiles (portrait)
- **Ship Positions**: Anchor point (top-left of footprint)
- **Center Points**: Geometric center = `(x + width/2, y + height/2)`

Examples:
- Sloop at (5, 5): center = (5.5, 5.5)
- Frigate (2x1) at (5, 5): center = (6, 5.5)
- Flagship (2x2) at (5, 5): center = (6, 6)

### State Management
- **Single Source of Truth**: `Game` class holds all game state
- **No Global State**: Pass game instance to systems that need it
- **Callback Pattern**: Use callbacks for cross-system communication
  ```javascript
  game.setCombatEventHandler(handler);
  game.setEndTurnTransitionHandler(handler);
  ```

### Configuration Changes
When changing game balance or behavior:
1. Modify `shared/constants.js` first
2. Never hardcode values in implementation files
3. Document balance changes in commit messages

## Common Patterns

### 1. State Machine Pattern
The `Game` class implements a finite state machine:

```javascript
// Game state transitions
this.gameState = GAME_STATES.SETUP; // or PLAYING, GAME_OVER
this.actionMode = ACTION_MODES.NONE; // or MOVE, ATTACK, BOARD

// State transitions via methods
game.startGame();      // SETUP → PLAYING
game.enterMoveMode();  // actionMode → MOVE
game.endTurn();        // Triggers turn manager
```

### 2. Manager/System Pattern
Each major subsystem has a dedicated manager class:
- `TurnManager` - Turn phase management, win condition checks
- `CombatResolver` - Static methods for hit chance calculations
- `BoardingSystem` - Static methods for boarding logic
- `AudioManager` - Sound playback and mixing
- `InputHandler` - Input event delegation
- `FogOfWar` - Vision and scouting calculations

### 3. Observable/Callback Pattern
Systems notify each other via callbacks:

```javascript
// Game notifies renderer of combat events
game.setCombatEventHandler((eventData) => {
  renderer.playCombatAnimation(eventData);
});

// Game notifies camera of turn changes
game.setEndTurnTransitionHandler(() => {
  camera.panToPlayerFleet();
});
```

### 4. Canvas Rendering Loop
Immediate-mode rendering with `requestAnimationFrame`:

```javascript
render() {
  if (!this.isRunning) return;

  // Clear canvas
  this.ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw everything
  this.renderer.render();

  // Request next frame
  requestAnimationFrame(() => this.render());
}
```

### 5. Event Delegation Pattern
`InputHandler` delegates to game methods:

```javascript
canvas.addEventListener('click', (e) => {
  const gridPos = this.screenToGrid(e.clientX, e.clientY);

  if (game.actionMode === ACTION_MODES.MOVE) {
    game.executeMove(gridPos.x, gridPos.y);
  } else if (game.actionMode === ACTION_MODES.ATTACK) {
    game.executeAttack(targetShip);
  }
});
```

### 6. Static Utility Pattern
Pure calculation functions as static methods:

```javascript
class CombatResolver {
  static calculateHitChance(attacker, target, distance) {
    // Pure function, no state mutation
    return hitChance;
  }

  static resolveAttack(attacker, target, distance) {
    // Dice roll + damage application
  }
}
```

## Areas to Be Careful

### Critical Gotchas & Edge Cases

1. **Fog of War Collision Deflection**
   - Ships can collide with fog-hidden enemy ships
   - Collision damage applied to BOTH parties
   - Moving ship deflects to adjacent tile
   - **Gotcha**: Collision logic happens BEFORE move validation
   - **Why**: Prevents exploitation where moving reveals hidden enemies without risk

2. **Frigate Orientation Mechanics**
   - Frigates (type 2) have 2x1 footprint and can rotate
   - Orientation determined by movement direction on single-step moves
   - **Gotcha**: `getPreviewOrientationForStep()` decides orientation based on `dx/dy`
   - **Why**: Multi-step moves need explicit orientation calculation
   - **File**: `client/src/entities/Ship.js:getPreviewOrientationForStep()`

3. **Boarding Level Restrictions**
   - Can only board ships BELOW your type level
   - Flagship (3) → Frigate (2) or Sloop (1) ✓
   - Frigate (2) → Sloop (1) ✓
   - Sloop (1) → Nothing ✗
   - **Gotcha**: Attempting invalid boarding shows notification but no error throw
   - **File**: `client/src/combat/BoardingSystem.js:canBoard()`

4. **Multi-tile Ship Placement**
   - Starting zones enforce 8x8 regions with 1-tile buffer
   - Landscape: Player 1 left side, Player 2 right side
   - Portrait: Player 1 top, Player 2 bottom
   - **Gotcha**: `Fleet.deployShips()` can fail silently if no valid positions
   - **Why**: Placement algorithm tries random positions with limited retries

5. **Wind Phase Timing**
   - Wind applies ONLY at start of Player 1's turn (after Player 2 ends)
   - Skipped on turn 1 to prevent ships spawning off-map
   - Wind direction randomizes each application
   - **Gotcha**: Wind doesn't apply during Player 2's turn start
   - **File**: `client/src/core/TurnManager.js:endTurn()`

6. **Movement Preview State**
   - `game.movementPreview` stores tentative ship position before commit
   - Must manually clear when exiting move mode
   - **Gotcha**: Forgetting to clear causes ghost previews
   - **Solution**: Always call `game.clearMovementPreview()` on mode exit

7. **Combat Event Async Timing**
   - Combat plays audio with staggered delays (cannon salvos)
   - Each cannon fires with 70ms spacing
   - **Gotcha**: If ship destroyed during boarding, full audio sequence still plays
   - **Why**: Audio events queued before state change completes

8. **Audio Preload Fallback**
   - Probes OGG support first, falls back to MP3
   - Both formats expected in `public/assets/sounds/`
   - **Gotcha**: Missing audio files log warnings but don't crash game
   - **File**: `client/src/audio/AudioManager.js:preload()`

9. **Touch Long-Press vs Drag**
   - Long-press (500ms hold) = right-click equivalent
   - Drag tolerance: 10px movement before registering as pan
   - **Gotcha**: Holding UI button 500ms accidentally triggers long-press instead of click
   - **Solution**: Move threshold prevents accidental long-press during slight finger movement

10. **Grid Subdivision & Footprints**
    - All positions use integer grid coordinates
    - Center points calculated as geometric mean of occupied tiles
    - **Gotcha**: Asymmetric ships have non-integer centers
    - **Example**: Frigate (2x1) at (0,0) has center (1, 0.5), not (0, 0)
    - **File**: `client/src/entities/Ship.js:getCenterPoint()`

### Performance Considerations
- **Canvas Rendering**: Full-screen redraw each frame (60 FPS target)
- **Fog of War**: Recalculates vision every frame (could cache per-turn for optimization)
- **No Spatial Indexing**: Ship lookups use linear search O(n) - fine for small fleet sizes
- **Camera Transitions**: Smooth animations over 650ms (configurable in `Camera.js`)

## Dependencies and Tools

### Core Dependencies (client)
- **Vite** 6.1.0 - Build tool and dev server
- **No runtime dependencies** - Pure vanilla JavaScript

### Core Dependencies (server)
- **Bun** - TypeScript runtime and server framework
- **Current Status**: Stub for future multiplayer (not actively used)

### Shared Configuration
- **npm workspaces** - Monorepo structure
- **shared/constants.js** - Game balance and configuration

### Development Tools
- **Vite Dev Server** - Fast HMR, port 5173
- **Bun Server** - WebSocket server stub, port 3000
- **Concurrently** - Runs client + server in parallel
- **Node.js Test Runner** - Built-in `node:test` module

### Build Commands

```bash
# Install all workspace dependencies
npm install

# Development (runs client + server concurrently)
npm run dev

# Client only (Vite dev server on port 5173)
npm run dev:client

# Server only (Bun server on port 3000)
npm run dev:server

# Build for production (outputs to client/dist/)
npm run build:client

# Preview production build
npm run preview:client

# Run tests
npm run test:logic
```

### Deployment (Vercel)
- **Platform**: Vercel (auto-deploy on push to `main` branch)
- **Build**: `npm run build:client` → outputs to `client/dist/`
- **Routing**: SPA rewrites all routes to `index.html`
- **Config**: `vercel.json` at project root

## Additional Resources

### Key Files to Understand
- `client/src/core/Game.js` - Main state machine (START HERE)
- `shared/constants.js` - All game configuration
- `client/src/ui/Renderer.js` - Canvas rendering logic
- `client/src/entities/Ship.js` - Ship entity and movement

### External Documentation
- Vite: https://vitejs.dev/
- HTML5 Canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- Node.js Test Runner: https://nodejs.org/api/test.html

### Design Documents
- `openspec/` directory contains structured design specs (if using OpenSpec workflow)

### Development Workflow
1. Make changes in `client/src/`
2. Test locally with `npm run dev`
3. Run tests with `npm run test:logic`
4. Commit and push to `main` → auto-deploys to Vercel

---

**Last Updated**: 2026-02-16
**Game Version**: Active Development
