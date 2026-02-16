# Shrouded Sails

A turn-based naval strategy game built with vanilla JavaScript and HTML5 Canvas.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (for the server)

### Setup

```bash
# Install all workspace dependencies
npm install

# Start both client and server dev servers
npm run dev
```

The game will be available at **http://localhost:5173**.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server concurrently |
| `npm run dev:client` | Start Vite dev server (port 5173) |
| `npm run dev:server` | Start Bun server (port 3000) |
| `npm run build:client` | Build client for production |
| `npm run preview:client` | Preview production build locally |

## Project Structure

```
shrouded-sails/
├── client/              # Frontend (Vite + vanilla JS)
│   ├── src/             # Game source code
│   │   ├── core/        # Game, TurnManager, InputHandler
│   │   ├── entities/    # Ship, Fleet
│   │   ├── combat/      # CombatResolver, BoardingSystem
│   │   ├── ui/          # Renderer, HUD, ShipPanel, ActionMenu, SettingsMenu
│   │   ├── map/         # GameMap, Tile, Wind
│   │   ├── fog/         # FogOfWar
│   │   ├── audio/       # AudioManager
│   │   └── main.js      # Entry point
│   ├── css/             # Stylesheets
│   ├── public/          # Static assets (sounds, images)
│   ├── index.html       # HTML entry point
│   ├── vite.config.js   # Vite configuration
│   └── package.json
├── server/              # Backend stub (Bun + TypeScript)
│   ├── index.ts         # HTTP + WebSocket server
│   ├── tsconfig.json
│   └── package.json
├── shared/              # Shared code (client + server)
│   ├── constants.js     # Game constants
│   └── package.json
├── package.json         # Workspace root
├── vercel.json          # Deployment configuration
└── README.md
```

### Packages

- **client**: The game frontend, built with Vite. Vanilla JavaScript with ES modules.
- **server**: A Bun-based backend stub with health check and WebSocket endpoint. Provides the foundation for future multiplayer.
- **shared**: Code shared between client and server, starting with game constants.

## Deployment

The project deploys to [Vercel](https://vercel.com/) automatically on push to `main`.

- **Frontend**: Built by Vite and served as static files from `client/dist/`
- **Backend**: Deployed as Vercel serverless functions with Bun runtime

### Bug Report API

The game includes an in-game **Report Bug** flow that creates GitHub issues through:

- `POST /api/submit-issue`
- `GET /api/health`

`/api/submit-issue` accepts JSON:

```json
{
  "title": "string",
  "description": "string",
  "context": {}
}
```

Response shape:

- Success `201`: `{ "ok": true, "issueNumber": number, "issueUrl": string }`
- Validation `400`: `{ "ok": false, "error": string, "fieldErrors": object }`
- Rate limit `429`: `{ "ok": false, "error": string }`
- Upstream/server `5xx`: `{ "ok": false, "error": string }`

#### Required Environment Variable

Set this in Vercel project settings:

- `GITHUB_TOKEN`: GitHub personal access token with repository issue write access.

Issue creation targets `thomascarlyonrussell/shrouded-sails` and attempts to apply
the `player-report` label. If the label is invalid/missing, the API retries once
without labels so reports are still created.

#### Abuse Guard

`/api/submit-issue` enforces a lightweight per-IP in-memory limit of 3 submissions
per 10-minute window.

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Troubleshooting

### `npm install` fails
Make sure you're running Node.js v18 or later. Run `node --version` to check.

### Vite dev server not starting
Check that port 5173 is not already in use. You can change the port in `client/vite.config.js`.

### Server won't start
Ensure [Bun](https://bun.sh/) is installed. Run `bun --version` to verify.

### Sounds not loading
Sound files should be in `client/public/assets/sounds/`. Vite serves the `public/` directory as static assets at the root URL.

### Import errors after migration
All imports should use clean paths without `?v=` query strings. Vite handles cache busting automatically through content-hashed filenames in production builds.
