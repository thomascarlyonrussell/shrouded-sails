# Shrouded Sails

[![Netlify Status](https://api.netlify.com/api/v1/badges/92a7e7bb-9780-4f72-9878-1909c94dd096/deploy-status)](https://app.netlify.com/projects/shroudedsails/deploys)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vite](https://img.shields.io/badge/Vite-6.1.0-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Node](https://img.shields.io/badge/Node-v18+-339933.svg?logo=node.js)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-latest-000000.svg?logo=bun)](https://bun.sh/)
[![GitHub Issues](https://img.shields.io/github/issues/thomascarlyonrussell/shrouded-sails)](https://github.com/thomascarlyonrussell/shrouded-sails/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/thomascarlyonrussell/shrouded-sails)](https://github.com/thomascarlyonrussell/shrouded-sails/pulls)

> A turn-based naval strategy game where players command fleets of ships in tactical combat across a fog-shrouded ocean. Built with vanilla JavaScript and HTML5 Canvas.

## 🤖 AI-Assisted Development

This repository is developed with the assistance of AI coding agents, including:

- **GitHub Copilot** - Code completion and inline suggestions
- **Claude (Anthropic)** - Code architecture, refactoring, and documentation
- **OpenAI Codex** - Code generation and problem-solving

AI tools augment the development process but all code is human-reviewed, tested, and maintained. For details on how AI agents are configured for this project, see [AGENTS.md](AGENTS.md).

## 📋 Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## ✨ Features

- **Turn-Based Tactical Combat** - Command fleets of Sloops, Frigates, and Flagships
- **Fog of War System** - Limited vision with scouting and ghost ship mechanics
- **Dynamic Environment** - Wind pushes ships, procedurally generated islands
- **Strategic Depth** - Movement ranges, cannon combat, and boarding actions
- **Single-Player AI Mode** - Play against an AI opponent
- **Local Multiplayer** - Hot-seat two-player mode
- **In-Game Bug Reporting** - One-click issue submission to GitHub
- **Responsive Canvas** - Smooth zoom, pan, and touch controls

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
├── vercel.json          # Legacy fallback deployment configuration
├── netlify.toml         # Netlify build, redirects, and functions configuration
├── netlify/
│   └── functions/       # Netlify Functions for /api endpoints
└── README.md
```

### Packages

- **client**: The game frontend, built with Vite. Vanilla JavaScript with ES modules.
- **server**: A Bun-based backend stub with health check and WebSocket endpoint. Provides the foundation for future multiplayer.
- **shared**: Code shared between client and server, starting with game constants.

## Deployment

The project deploys to [Netlify](https://www.netlify.com/) from Git.

- **Build command**: `npm run build:client`
- **Publish directory**: `client/dist`
- **SPA fallback**: `/*` rewrites to `/index.html` (configured in `netlify.toml`)
- **API routes**: `/api/*` rewrites to Netlify Functions in `netlify/functions/`

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

Set this in Netlify site environment variables:

- `GITHUB_TOKEN`: GitHub personal access token with repository issue write access.

Issue creation targets `thomascarlyonrussell/shrouded-sails` and attempts to apply
the `player-report` label. If the label is invalid/missing, the API retries once
without labels so reports are still created.

#### Abuse Guard

`/api/submit-issue` enforces a lightweight per-IP in-memory limit of 3 submissions
per 10-minute window.

### Manual Deploy

Use Netlify's Git-connected deploy flow from your repository branch. For local emulation, use the Netlify CLI (`netlify dev`) with this repo's `netlify.toml`.

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes and test locally with `npm run dev`
4. Run tests with `npm run test:logic`
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

### AI-Assisted Contributions

This project uses AI coding assistants. If you're using AI tools in your contributions:
- Ensure all AI-generated code is reviewed and tested
- Document any AI-assisted changes in your PR description
- Follow the project's code style and conventions in [AGENTS.md](AGENTS.md)

## License

This project is currently unlicensed. All rights reserved.

---

**Built with** ❤️ **and AI** 🤖 | [Report a Bug](https://github.com/thomascarlyonrussell/shrouded-sails/issues) | [Request a Feature](https://github.com/thomascarlyonrussell/shrouded-sails/issues)
