## Context

**Current State:**
- Vanilla JavaScript ES6 modules with zero build tooling
- Manual cache-busting using query strings (`?v=20260214e`) in 80+ import statements across 18 classes
- Files served directly without bundling or optimization
- Root-level flat structure: `index.html`, `js/`, `css/`, `assets/`
- No deployment configuration or CI/CD pipeline
- No backend infrastructure

**Target Deployment:**
- Vercel platform (user requirement)
- Need support for future multiplayer with WebSocket server on separate machines

**Constraints:**
- Must preserve game functionality - this is purely infrastructure work
- Team familiar with JavaScript, adding TypeScript only for backend
- Want fast iteration during active development (fog of war, grid subdivision features in progress)
- ~15 sound files (OGG/MP3 dual format) need proper serving

## Goals / Non-Goals

**Goals:**
- Establish modern development environment with HMR and fast iteration
- Prepare repository structure for multiplayer backend (stub only, not implemented)
- Configure automated deployment to Vercel
- Eliminate manual cache-busting maintenance burden
- Set up asset pipeline for current and future media files
- Create clear separation between client, server, and shared code

**Non-Goals:**
- Implement multiplayer game logic (deferred to future work)
- Migrate client code to TypeScript (keep vanilla JS to minimize disruption)
- Change game mechanics or features
- Add testing framework (can be added later)
- Optimize bundle size (game is small ~50KB, not a priority)
- Support legacy browsers (already requires ES6 modules)

## Decisions

### D1: Vite over Webpack/Parcel/Rollup

**Decision:** Use Vite as the build tool and development server.

**Rationale:**
- **Zero-config for vanilla JS**: Works out of box without complex webpack configs
- **Fast dev server**: Native ESM in development, no bundling needed (10-50x faster cold starts than Webpack)
- **HMR built-in**: Hot module replacement preserves game state during development
- **Production-ready**: Rollup bundler underneath with tree-shaking and code splitting
- **Vercel integration**: First-class support via vercel.json build commands
- **Asset handling**: Built-in support for images, audio, fonts with automatic hashing
- **Community momentum**: Becoming standard for modern web projects

**Alternatives Considered:**
- **Webpack**: Too much configuration overhead, slower dev server, overkill for this project size
- **Parcel**: Good zero-config but less mature ecosystem, weaker Vercel integration
- **Rollup alone**: No dev server, would need additional tooling for HMR
- **No bundler**: Continue manual cache-busting - doesn't scale as project grows, doesn't solve deployment

### D2: Monorepo Structure with Workspaces

**Decision:** Restructure as monorepo with three packages: `client/`, `server/`, `shared/`

**Rationale:**
- **Shared code reuse**: `Constants.js`, future types/interfaces, game state models can be imported by both client and multiplayer server
- **Single deployment**: Vercel monorepo support allows unified deployment pipeline
- **Atomic changes**: Can update client and server together in same commit/PR
- **Clear boundaries**: Enforces separation of concerns (presentation vs. business logic vs. networking)
- **Simpler DX**: One repo to clone, one `npm install`, concurrent dev servers with `npm run dev`

**Structure:**
```
/
├── client/          # Frontend (Vite + vanilla JS)
│   ├── public/      # Static assets (sounds, favicon)
│   ├── src/         # Game modules (moved from root js/)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/          # Backend stub (Bun + TypeScript)
│   ├── index.ts     # HTTP server + WebSocket endpoint
│   ├── tsconfig.json
│   └── package.json
├── shared/          # Shared code
│   └── constants.js # Game constants used by client and server
├── package.json     # Workspace root
├── vercel.json      # Deployment config
└── README.md
```

**Alternatives Considered:**
- **Separate repos (client/server)**: More complex to synchronize, harder to share types, separate deployments
- **Keep client at root**: Doesn't scale when server becomes significant, no clear boundary
- **No shared package**: Copy-paste constants between client/server - DRY violation, error-prone

### D3: Bun over Node.js/Deno for Backend

**Decision:** Use Bun runtime for the server stub.

**Rationale:**
- **User requirement**: User explicitly requested Bun
- **Performance**: 3-4x faster startup than Node.js (matters for serverless cold starts)
- **Built-in TypeScript**: No need for ts-node or build step during development
- **Node.js compatibility**: Can use Socket.IO and other npm packages via compatibility layer
- **Modern DX**: Native support for ESM, top-level await, fetch API
- **Vercel support**: Vercel supports Bun serverless functions natively

**Alternatives Considered:**
- **Node.js + Express**: More mature ecosystem, but slower and requires build tooling for TypeScript
- **Deno**: Good security model but different module system, less npm compatibility, less proven for game servers

### D4: Socket.IO over Native WebSocket

**Decision:** Plan to use Socket.IO library for WebSocket communication (documented in stub, not implemented).

**Rationale:**
- **Room management**: Built-in concept of "rooms" perfect for game sessions
- **Automatic reconnection**: Handles network hiccups gracefully
- **Fallback transport**: Falls back to HTTP long-polling if WebSocket blocked by firewall/proxy
- **Event-based API**: Cleaner than raw WebSocket message parsing
- **Proven for games**: Used by io games, board games, turn-based games extensively
- **Bun compatibility**: Works via WebSocket polyfill in Bun

**Alternatives Considered:**
- **Native WebSocket**: Lower level, no reconnection logic, would need to build room management
- **SSE (Server-Sent Events)**: One-way only, need separate channel for client → server
- **WebRTC Data Channels**: Peer-to-peer complexity, NAT traversal issues, overkill for turn-based game

### D5: Client-First Deployment Strategy

**Decision:** Deploy fully-functional frontend immediately; backend stub returns 200 OK but no game logic.

**Rationale:**
- **Incremental delivery**: Can deploy and test build system without waiting for multiplayer implementation
- **Low risk**: Game continues to work as single-player, backend adds zero value initially
- **Clear contracts**: Backend stub documents future API shape (health check, WebSocket endpoint structure)
- **Verifiable**: Can test Vercel deployment, asset loading, performance without multiplayer complexity

**Migration Path:**
1. Phase 1: Deploy static client + stub backend (this change)
2. Phase 2 (future): Refactor game logic for serialization and validation
3. Phase 3 (future): Implement WebSocket command handlers and state sync

### D6: Keep Vanilla JS in Client, TypeScript Only in Server

**Decision:** Do not migrate client code to TypeScript.

**Rationale:**
- **Minimize disruption**: Client code is working and actively being developed (fog of war changes in progress)
- **Type safety where it matters**: Server validation and multiplayer state sync benefit most from types
- **Gradual adoption**: Can add TypeScript to client later if needed
- **Lower barrier**: Vanilla JS is more approachable for contributors
- **Build speed**: Vite handles vanilla JS faster (no transpilation)

**Alternatives Considered:**
- **TypeScript everywhere**: Would require migrating 18 classes, slowing down current feature work
- **JSDoc types**: Adds type checking without build step, but less robust than TypeScript

## Risks / Trade-offs

### R1: Monorepo adds complexity for new contributors
**Risk:** Developers unfamiliar with workspaces might not understand package boundaries.  
**Mitigation:** Comprehensive README.md with setup instructions, clear package.json scripts, only 3 packages (not complex).

### R2: Bun ecosystem less mature than Node.js
**Risk:** Bugs or missing features in Bun runtime or Vercel Bun support.  
**Mitigation:** Backend is stub-only (minimal code at risk), can switch to Node.js if blocking issues arise. Vercel officially supports Bun.

### R3: Large file restructuring creates merge conflicts
**Risk:** Moving all files to `client/` conflicts with in-progress branches (fog-of-war-scouting, grid-subdivision).  
**Mitigation:** Coordinate with team to merge active PRs first, or assist with rebase after migration. Git handles file moves well with similarity detection.

### R4: Breaking local development for contributors
**Risk:** Contributors with repo checked out need to reinstall dependencies and learn new commands.  
**Mitigation:** Update README with clear migration steps: `npm install`, `npm run dev`. Script commands are intuitive (`dev`, `build`).

### R5: Vercel serverless cold starts add latency
**Risk:** First request to backend after inactivity has 200-500ms cold start delay.  
**Mitigation:** Acceptable for turn-based game (not real-time twitch gameplay). Bun's fast startup helps. Can migrate to dedicated server later if needed.

### R6: Asset path changes might break references
**Risk:** Moving assets to `client/public/` could break sound loading if paths not updated correctly.  
**Mitigation:** Test all 15 sounds load in dev and production builds. Vite's `public/` directory is designed for this use case.

## Migration Plan

### Pre-Migration
1. **Merge active branches**: Coordinate with team to merge or hold fog-of-war and grid-subdivision work
2. **Backup current state**: Tag current main as `pre-vite` for emergency rollback

### Migration Steps
1. **Create new directory structure**:
   ```
   mkdir client server shared
   mv js css assets index.html client/
   mv client/assets client/public/assets
   ```

2. **Initialize workspaces**:
   ```
   # Root package.json with workspaces: ["client", "server", "shared"]
   npm init -w client -w server -w shared
   ```

3. **Install Vite in client**:
   ```
   npm install -D vite -w client
   ```

4. **Create Vite config** (`client/vite.config.js`):
   ```javascript
   import { defineConfig } from 'vite';
   export default defineConfig({
     root: '.',
     publicDir: 'public',
     build: {
       outDir: 'dist',
       emptyOutDir: true
     },
     server: {
       port: 5173
     }
   });
   ```

5. **Remove cache-busting from imports**:
   - Find/replace regex: `from ['"](.+?).js\?v=[^'"]+['"]` → `from '$1.js'`
   - 80+ files affected: main.js, Game.js, Renderer.js, TurnManager.js, all entities, UI, combat, fog, map

6. **Update asset paths**:
   - AudioManager.js: Keep `assets/sounds` relative path (Vite serves from public/)
   - Test all sounds load correctly

7. **Create server stub** (`server/index.ts`):
   ```typescript
   // Health check + WebSocket stub
   // Document future command structure
   ```

8. **Move Constants.js to shared**:
   - `mv client/src/utils/Constants.js shared/constants.js`
   - Update imports: `import { PLAYERS } from '../../../shared/constants.js'`

9. **Add package.json scripts**:
   ```json
   {
     "scripts": {
       "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
       "dev:client": "vite -w client",
       "dev:server": "bun run server/index.ts",
       "build:client": "vite build -w client"
     }
   }
   ```

10. **Create Vercel config** (`vercel.json`):
    ```json
    {
      "buildCommand": "npm run build:client",
      "outputDirectory": "client/dist",
      "functions": {
        "api/**/*.ts": {
          "runtime": "bun@1"
        }
      },
      "routes": [
        { "src": "/api/(.*)", "dest": "/server/$1" },
        { "handle": "filesystem" },
        { "src": "/(.*)", "dest": "/index.html" }
      ]
    }
    ```

11. **Add .gitignore**:
    ```
    node_modules/
    client/dist/
    .vercel/
    .env
    .env.local
    ```

12. **Test locally**:
    - `npm install`
    - `npm run dev` → Open http://localhost:5173
    - Verify game loads, plays, sounds work
    - Check HMR: Edit CSS → see changes without refresh

13. **Deploy to Vercel**:
    - Connect GitHub repo to Vercel project
    - Push to main → automatic deployment
    - Test production build on vercel.app domain

### Rollback Strategy
If deployment fails:
1. Revert main to `pre-vite` tag: `git reset --hard pre-vite`
2. Force push (if needed): `git push --force`
3. Vercel auto-deploys previous working commit

### Post-Migration Validation
- [ ] Game loads on localhost:5173
- [ ] All menu interactions work (settings, ship placement, turn flow)
- [ ] All 15 sounds play correctly
- [ ] Fog of war toggle works
- [ ] Combat, boarding, movement, wind mechanics unchanged
- [ ] Hot reload works (edit CSS/JS → see changes)
- [ ] Production build succeeds: `npm run build:client`
- [ ] Vercel deployment succeeds
- [ ] Production site loads and plays correctly on vercel.app domain
- [ ] Backend health check returns 200: `curl https://<domain>/api/health`

## Open Questions

1. **Sound optimization**: Should Vite convert OGG/MP3 to optimized formats, or keep dual-format system as-is for browser compatibility?
   - **Decision needed before:** Asset pipeline spec
   - **Recommendation:** Keep dual format initially, revisit if users report loading issues

2. **Environment variables**: Do we need .env support for API keys (future analytics, error tracking)?
   - **Decision needed before:** Implementation
   - **Recommendation:** Add Vite + Vercel .env support now (low cost), even if unused initially

3. **Shared code in ES modules or CommonJS**: Should `shared/` use ESM (client compatible) or CJS (server compatible)?
   - **Decision needed before:** Moving Constants.js
   - **Recommendation:** Use ESM with `.js` extension - Bun supports ESM natively, Vite prefers ESM

4. **Server file structure**: When multiplayer is implemented, should server/ have subdirectories (routes/, game-engine/, validators/)?
   - **Decision needed before:** Future refactoring (not this change)
   - **Recommendation:** Start flat, refactor when >5 server files

5. **Separate CSS build step**: Should we add PostCSS, Sass, or keep single CSS file?
   - **Decision needed before:** Implementation
   - **Recommendation:** Keep single CSS file - it's already well-organized at 1089 lines, no preprocessor needed yet
