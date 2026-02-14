## 1. Repository Structure and Workspaces

- [x] 1.1 Create `client/`, `server/`, and `shared/` directories at repository root
- [x] 1.2 Create root `package.json` with workspace configuration for all three packages
- [x] 1.3 Add root `.gitignore` with entries for `node_modules/`, `client/dist/`, `.vercel/`, `.env*`, IDE configs
- [x] 1.4 Create root `README.md` with project overview, setup instructions, and development commands

## 2. Client Package Configuration

- [x] 2.1 Create `client/package.json` with project metadata and Vite as dev dependency
- [x] 2.2 Create `client/vite.config.js` with configuration for root, publicDir, build output, and server port 5173
- [x] 2.3 Add build scripts to client package.json: `dev`, `build`, `preview`
- [x] 2.4 Install Vite in client workspace: `npm install -D vite -w client`

## 3. File Migrations

- [x] 3.1 Move `index.html` from root to `client/index.html`
- [x] 3.2 Create `client/src/` directory structure mirroring current `js/` organization
- [x] 3.3 Move all files from `js/core/` to `client/src/core/`
- [x] 3.4 Move all files from `js/entities/` to `client/src/entities/`
- [x] 3.5 Move all files from `js/combat/` to `client/src/combat/`
- [x] 3.6 Move all files from `js/ui/` to `client/src/ui/`
- [x] 3.7 Move all files from `js/map/` to `client/src/map/`
- [x] 3.8 Move all files from `js/fog/` to `client/src/fog/`
- [x] 3.9 Move all files from `js/audio/` to `client/src/audio/`
- [x] 3.10 Move all files from `js/utils/` to `client/src/utils/`
- [x] 3.11 Move `main.js` to `client/src/main.js`
- [x] 3.12 Move `css/style.css` to `client/css/style.css`
- [x] 3.13 Create `client/public/` directory
- [x] 3.14 Move all files from `assets/` to `client/public/assets/`
- [x] 3.15 Delete now-empty `js/`, `css/`, and `assets/` directories

## 4. Update Import Paths

- [x] 4.1 Update script tag in `client/index.html` to reference `./src/main.js`
- [x] 4.2 Update CSS link in `client/index.html` to reference `./css/style.css`
- [x] 4.3 Update all import statements in `client/src/main.js` to use correct relative paths
- [x] 4.4 Update all import statements in `client/src/core/Game.js` for new structure
- [x] 4.5 Update all import statements in `client/src/core/TurnManager.js`
- [x] 4.6 Update all import statements in `client/src/core/InputHandler.js`
- [x] 4.7 Update all import statements in `client/src/entities/Ship.js`
- [x] 4.8 Update all import statements in `client/src/entities/Fleet.js`
- [x] 4.9 Update all import statements in `client/src/combat/CombatResolver.js`
- [x] 4.10 Update all import statements in `client/src/combat/BoardingSystem.js`
- [x] 4.11 Update all import statements in `client/src/map/GameMap.js`
- [x] 4.12 Update all import statements in `client/src/map/Tile.js`
- [x] 4.13 Update all import statements in `client/src/map/Wind.js`
- [x] 4.14 Update all import statements in `client/src/fog/FogOfWar.js`
- [x] 4.15 Update all import statements in `client/src/ui/Renderer.js`
- [x] 4.16 Update all import statements in `client/src/ui/HUD.js`
- [x] 4.17 Update all import statements in `client/src/ui/ShipPanel.js`
- [x] 4.18 Update all import statements in `client/src/ui/SettingsMenu.js`
- [x] 4.19 Update all import statements in `client/src/ui/ActionMenu.js`
- [x] 4.20 Update all import statements in `client/src/audio/AudioManager.js`

## 5. Remove Manual Cache-Busting

- [x] 5.1 Remove `?v=20260214e` query strings from all imports in `client/src/main.js`
- [x] 5.2 Remove cache-busting from all imports in `client/src/core/` modules
- [x] 5.3 Remove cache-busting from all imports in `client/src/entities/` modules
- [x] 5.4 Remove cache-busting from all imports in `client/src/combat/` modules
- [x] 5.5 Remove cache-busting from all imports in `client/src/ui/` modules
- [x] 5.6 Remove cache-busting from all imports in `client/src/map/` modules
- [x] 5.7 Remove cache-busting from all imports in `client/src/fog/` modules
- [x] 5.8 Remove cache-busting from all imports in `client/src/audio/` modules
- [x] 5.9 Remove cache-busting from constants import in all files

## 6. Shared Package Setup

- [x] 6.1 Create `shared/package.json` with type: "module"
- [x] 6.2 Move `client/src/utils/Constants.js` to `shared/constants.js`
- [x] 6.3 Update all client imports of Constants to reference `../../../shared/constants.js` (or appropriate path)
- [x] 6.4 Verify Constants exports work correctly as ES module

## 7. Server Package Setup

- [x] 7.1 Create `server/package.json` with Bun dependencies
- [x] 7.2 Create `server/tsconfig.json` with appropriate TypeScript configuration
- [x] 7.3 Create `server/index.ts` with basic HTTP server on port 3000
- [x] 7.4 Implement `/health` endpoint returning HTTP 200 with `{status: "ok"}` JSON
- [x] 7.5 Implement WebSocket endpoint at `/ws` that accepts connections
- [x] 7.6 Add CORS configuration allowing `http://localhost:5173`
- [x] 7.7 Add code comments documenting future multiplayer architecture (command pattern, state serialization, validation)
- [x] 7.8 Create `server/README.md` documenting architecture and future implementation plan

## 8. Root Package Scripts

- [x] 8.1 Install `concurrently` as dev dependency in root: `npm install -D concurrently`
- [x] 8.2 Add `dev:client` script to root package.json: `vite -w client`
- [x] 8.3 Add `dev:server` script to root package.json: `bun run server/index.ts`
- [x] 8.4 Add `dev` script to run both servers using concurrently
- [x] 8.5 Add `build:client` script: `vite build -w client`
- [x] 8.6 Add `preview:client` script: `vite preview -w client`

## 9. Vercel Configuration

- [x] 9.1 Create `vercel.json` in repository root
- [x] 9.2 Configure build command: `npm run build:client`
- [x] 9.3 Configure output directory: `client/dist`
- [x] 9.4 Configure serverless functions for `server/` with Bun runtime
- [x] 9.5 Configure routing rules: `/api/*` → server, everything else → client static files
- [x] 9.6 Configure SPA fallback to `index.html` for client-side routing
- [x] 9.7 Create `.vercelignore` excluding unnecessary files

## 10. Local Development Testing

- [x] 10.1 Run `npm install` in root and verify all workspaces install successfully
- [ ] 10.2 Run `npm run dev:client` and verify Vite starts on port 5173
- [x] 10.3 Open http://localhost:5173 and verify game loads without errors
- [ ] 10.4 Verify all 15 sound effects load correctly (check browser console)
- [x] 10.5 Test game functionality: menu interactions, ship placement, turn flow
- [x] 10.6 Test combat, boarding, movement, and wind mechanics
- [x] 10.7 Test fog of war toggle works correctly
- [x] 10.8 Test settings persistence in localStorage
- [x] 10.9 Edit `client/css/style.css` and verify HMR updates without page reload
- [ ] 10.10 Edit JavaScript file and verify module hot reload
- [x] 10.11 Run `npm run dev:server` and verify Bun starts on port 3000
- [x] 10.12 Test server health check: `curl http://localhost:3000/health`
- [ ] 10.13 Run `npm run dev` and verify both servers start concurrently

## 11. Production Build Testing

- [x] 11.1 Run `npm run build:client` and verify build completes without errors
- [x] 11.2 Verify `client/dist/` directory is created with expected structure
- [x] 11.3 Verify JavaScript bundles have content hashes (e.g., `main.a1b2c3d4.js`)
- [x] 11.4 Verify CSS files have content hashes
- [x] 11.5 Verify `index.html` references hashed assets correctly
- [x] 11.6 Verify all files from `client/public/` are copied to `client/dist/`
- [x] 11.7 Verify sound files in `dist/assets/sounds/` have original filenames (not hashed)
- [ ] 11.8 Run `npm run preview:client` to preview production build locally
- [ ] 11.9 Test full game functionality in production build preview

## 12. Vercel Deployment

- [ ] 12.1 Connect GitHub repository to Vercel project (via Vercel dashboard or CLI)
- [ ] 12.2 Configure Vercel project with root directory and build settings
- [ ] 12.3 Push changes to main branch to trigger automatic deployment
- [ ] 12.4 Monitor Vercel build logs for errors
- [ ] 12.5 Verify deployment completes successfully
- [ ] 12.6 Access deployed site at production URL (e.g., shrouded-sails.vercel.app)
- [ ] 12.7 Test game loads and functions correctly in production
- [ ] 12.8 Test all sound effects load in production
- [ ] 12.9 Test API health check: `curl https://<domain>/api/health`
- [ ] 12.10 Verify WebSocket endpoint is accessible (if needed for testing)

## 13. Documentation Updates

- [x] 13.1 Update root README.md with setup instructions for new repository structure
- [x] 13.2 Document development workflow: `npm install`, `npm run dev`, `npm run build:client`
- [x] 13.3 Document monorepo structure and package purposes
- [x] 13.4 Document deployment process (Git push → automatic Vercel deploy)
- [x] 13.5 Update `assets/sounds/README.md` if needed for new paths
- [x] 13.6 Add troubleshooting section for common issues

## 14. Cleanup and Verification

- [x] 14.1 Delete old root-level files that have been migrated
- [ ] 14.2 Verify git status shows expected changes (file moves, new configs)
- [ ] 14.3 Create git tag `pre-vite` for rollback reference (if not done already)
- [ ] 14.4 Review all changed files for correctness
- [ ] 14.5 Run final smoke test of all game features locally
- [ ] 14.6 Run final smoke test of all game features in production
- [ ] 14.7 Commit all changes with descriptive message
- [ ] 14.8 Push to main branch and verify successful deployment
