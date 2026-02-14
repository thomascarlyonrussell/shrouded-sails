/**
 * Shrouded Sails - Backend Server Stub
 *
 * This is a minimal Bun HTTP server that serves as the foundation for
 * future multiplayer functionality. Currently provides:
 * - Health check endpoint at /health
 * - WebSocket stub at /ws for future game session management
 * - CORS configuration for local development
 *
 * === Future Multiplayer Architecture ===
 *
 * Command Pattern:
 *   All game actions will be modeled as serializable commands:
 *   - MoveCommand { shipId, targetCol, targetRow }
 *   - AttackCommand { attackerId, targetId }
 *   - BoardCommand { boarderId, targetId }
 *   - EndTurnCommand {}
 *
 *   Server validates each command against authoritative game state
 *   before broadcasting to other players.
 *
 * State Serialization:
 *   GameState.toJSON() / GameState.fromJSON() for:
 *   - Sending initial state to newly connected players
 *   - Reconnection support (restore full game state)
 *   - Replay / spectator mode
 *
 * Validation Layer:
 *   Server-side validation prevents cheating:
 *   - Ship movement range checks
 *   - Turn order enforcement
 *   - Line of sight / fog of war calculations
 *   - Combat resolution verification
 *
 * WebSocket Message Format (planned):
 *   { type: "command", payload: { action: "move", data: {...} } }
 *   { type: "state_update", payload: { gameState: {...} } }
 *   { type: "error", payload: { message: "Invalid move" } }
 *   { type: "room", payload: { action: "join", roomId: "..." } }
 */

const CORS_ORIGIN = "http://localhost:5173";
const PORT = 3000;

const server = Bun.serve({
  port: PORT,

  fetch(req, server) {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": CORS_ORIGIN,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // WebSocket upgrade at /ws
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      return undefined;
    }

    // Health check
    if (url.pathname === "/health") {
      return Response.json(
        { status: "ok" },
        {
          headers: {
            "Access-Control-Allow-Origin": CORS_ORIGIN,
          },
        }
      );
    }

    // 404 for everything else
    return new Response("Not Found", { status: 404 });
  },

  websocket: {
    open(ws) {
      console.log("WebSocket client connected");
      // Future: assign to game room, send initial state
    },
    message(ws, message) {
      console.log("Received:", message);
      // Future: parse command, validate, apply to game state, broadcast
    },
    close(ws) {
      console.log("WebSocket client disconnected");
      // Future: handle disconnect, notify other players
    },
  },
});

console.log(`Shrouded Sails server listening on http://localhost:${PORT}`);
