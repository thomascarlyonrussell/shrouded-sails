# Bun Backend Stub Specification

## ADDED Requirements

### Requirement: Bun HTTP server

The system SHALL provide a Bun-based HTTP server that listens on port 3000 and serves basic endpoints.

#### Scenario: Server starts successfully
- **WHEN** developer runs `npm run dev:server`
- **THEN** Bun starts HTTP server on port 3000
- **AND** console shows "Server listening on port 3000" or similar message
- **AND** server process does not crash

#### Scenario: Server is implemented in TypeScript
- **WHEN** server code is examined
- **THEN** entry point is `server/index.ts` (TypeScript file)
- **AND** Bun runs TypeScript directly without build step
- **AND** `tsconfig.json` configures TypeScript options

### Requirement: Health check endpoint

The system SHALL provide a `/health` endpoint that returns HTTP 200 status with a JSON response indicating server status.

#### Scenario: Health check returns success
- **WHEN** client sends GET request to `http://localhost:3000/health`
- **THEN** server responds with HTTP 200 status
- **AND** response body is valid JSON
- **AND** response includes `status: "ok"` field

### Requirement: WebSocket endpoint stub

The system SHALL provide a WebSocket endpoint at `/ws` that accepts connections but does not implement game logic, serving as a placeholder for future multiplayer implementation.

#### Scenario: WebSocket connection is accepted
- **WHEN** client attempts to connect to `ws://localhost:3000/ws`
- **THEN** server accepts the WebSocket connection
- **AND** connection remains open without errors

#### Scenario: WebSocket receives messages but does not process
- **WHEN** client sends a message over WebSocket
- **THEN** server receives the message without crashing
- **AND** server may log message for debugging
- **AND** server does not send game state updates (stub only)

### Requirement: CORS configuration for local development

The system SHALL configure CORS to allow requests from `http://localhost:5173` (Vite dev server) during local development.

#### Scenario: Client requests are allowed
- **WHEN** client running on localhost:5173 sends request to server
- **THEN** server includes CORS header: `Access-Control-Allow-Origin: http://localhost:5173`
- **AND** request succeeds without CORS errors in browser console

### Requirement: Documentation of future multiplayer architecture

The server SHALL include code comments or a README documenting the planned multiplayer architecture, including command pattern, state serialization, and validation layer.

#### Scenario: Architecture is documented
- **WHEN** developer reads `server/index.ts` or `server/README.md`
- **THEN** documentation describes planned command pattern for game actions (MoveCommand, AttackCommand, BoardCommand)
- **AND** documentation describes state serialization requirements (GameState.toJSON/fromJSON)
- **AND** documentation describes server-side validation approach
- **AND** documentation describes WebSocket message format (suggested structure)

#### Scenario: Stub clearly indicates incomplete implementation
- **WHEN** developer examines WebSocket handler code
- **THEN** comments indicate this is a stub/placeholder
- **AND** comments reference future implementation requirements
- **AND** code structure suggests where game logic will be added
