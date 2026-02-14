## Why

The game currently has zero build tooling and uses vanilla ES modules with manual cache-busting (80+ import statements with `?v=20260214e`). We need a modern build system for Vercel deployment and to establish the foundation for future multiplayer functionality where two different machines can connect to the same game session.

## What Changes

- **Add Vite build system** with fast development server, hot module replacement, and automatic asset optimization
- **Restructure to monorepo** with `client/`, `server/`, and `shared/` directories for clean separation and code reuse
- **Create Bun backend stub** with WebSocket endpoint foundation for future multiplayer (implementation deferred)
- **Configure Vercel deployment** with frontend static hosting and serverless backend functions
- **Remove manual cache-busting** from all 80+ import statements - Vite handles content hashing automatically
- **Establish asset pipeline** for sound effects (OGG/MP3) with proper build-time optimization
- **Add development workflow** with concurrent client/server dev servers and build scripts

## Capabilities

### New Capabilities

- `vite-build-pipeline`: Vite configuration for development server (HMR, port 5173), production builds (bundling, tree-shaking, code splitting), and asset handling
- `monorepo-structure`: Directory organization with client/, server/, shared/ folders, workspace configuration, and cross-package imports for shared code
- `bun-backend-stub`: Basic Bun HTTP server with health check endpoint, WebSocket stub, CORS configuration, and documented architecture for future multiplayer commands/state sync
- `vercel-deployment`: Vercel configuration mapping `/api/*` to serverless functions, static frontend serving, build commands, and environment variable setup
- `asset-pipeline`: Sound asset handling in public directory, automatic file hashing, and removal of manual version query strings from imports

### Modified Capabilities

_No existing capabilities are being modified - this adds build infrastructure without changing game logic._

## Impact

**File Restructuring:**
- All existing files move from root to `client/` directory
- Assets move to `client/public/assets/` for static serving
- Shared constants move to `shared/` for client/server reuse
- New `server/` directory with TypeScript backend stub

**Import Changes:**
- Remove `.js?v=<version>` from 80+ import statements across all game modules
- Update asset paths in [AudioManager.js](js/audio/AudioManager.js#L42)

**New Configuration Files:**
- Root: `package.json` (workspace), `vercel.json`, `.gitignore`, `README.md`
- Client: `client/package.json`, `client/vite.config.js`, `client/index.html` (moved from root)
- Server: `server/package.json`, `server/index.ts`, `server/tsconfig.json`

**Development Workflow:**
- New commands: `npm run dev` (both), `npm run dev:client`, `npm run dev:server`, `npm run build:client`
- Development server: `localhost:5173` (client), `localhost:3000` (server)
- Hot reload for all client code and CSS changes

**Deployment:**
- Vercel builds from Git push or CLI
- Frontend serves from `client/dist/` as static site
- Backend serves from `server/index.ts` as serverless function

**No Breaking Changes:**
- Game logic remains identical - purely infrastructure work
- All existing features (fog of war, combat, wind, etc.) unchanged
- Browser compatibility unchanged (still vanilla JS, modern browsers)
