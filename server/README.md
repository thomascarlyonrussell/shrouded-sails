# Shrouded Sails - Server

Bun-based backend stub for future multiplayer functionality.

## Current State

The server is a **stub** that provides:
- `/health` - Health check endpoint (returns `{ status: "ok" }`)
- `/ws` - WebSocket endpoint (accepts connections, logs messages)
- CORS configured for local development (`localhost:5173`)

## Running

```bash
# From repository root
npm run dev:server

# Or directly
bun run server/index.ts
```

Server starts on `http://localhost:3000`.

## Future Multiplayer Architecture

### Command Pattern

All game actions will be serializable commands sent over WebSocket:

| Command | Payload | Description |
|---------|---------|-------------|
| `MoveCommand` | `{ shipId, targetCol, targetRow }` | Move a ship to a tile |
| `AttackCommand` | `{ attackerId, targetId }` | Fire cannons at enemy |
| `BoardCommand` | `{ boarderId, targetId }` | Board an enemy ship |
| `EndTurnCommand` | `{}` | End current player's turn |

### State Synchronization

- Server maintains authoritative game state
- `GameState.toJSON()` / `GameState.fromJSON()` for serialization
- New players receive full state on connection
- Reconnection restores game state from server

### Validation

Server validates every command before applying:
- Ship movement range and path validity
- Turn order enforcement (can only act on your turn)
- Combat range and line-of-sight checks
- Fog of war visibility calculations

### WebSocket Protocol

```json
// Client → Server (command)
{ "type": "command", "payload": { "action": "move", "data": { "shipId": 1, "col": 5, "row": 3 } } }

// Server → Client (state update)
{ "type": "state_update", "payload": { "gameState": { ... } } }

// Server → Client (error)
{ "type": "error", "payload": { "message": "Invalid move: out of range" } }

// Room management
{ "type": "room", "payload": { "action": "join", "roomId": "abc123" } }
```

### Room Management (via Socket.IO, planned)

- Each game session is a "room"
- Two players per room
- Spectator support possible
- Room lifecycle: create → join → play → end
