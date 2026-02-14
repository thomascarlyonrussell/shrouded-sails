# Monorepo Structure Specification

## ADDED Requirements

### Requirement: Workspace organization

The system SHALL organize code into three workspace packages: `client/` (frontend), `server/` (backend), and `shared/` (common code), managed by npm workspaces in the root `package.json`.

#### Scenario: Repository has three workspaces
- **WHEN** developer checks out the repository
- **THEN** root directory contains `client/`, `server/`, and `shared/` directories
- **AND** root `package.json` declares workspaces: `["client", "server", "shared"]`
- **AND** each workspace has its own `package.json`

#### Scenario: Single install command for all workspaces
- **WHEN** developer runs `npm install` in root directory
- **THEN** npm installs dependencies for all three workspaces
- **AND** creates single shared `node_modules/` in root
- **AND** completes without errors

### Requirement: Client workspace structure

The client workspace SHALL contain all frontend code, including game modules, UI, styles, assets, and the HTML entry point, with source files in `src/` and static assets in `public/`.

#### Scenario: Client structure is organized
- **WHEN** developer navigates to `client/` directory
- **THEN** directory contains `src/` with game modules (core, entities, combat, ui, map, fog, audio)
- **AND** directory contains `public/` with static assets (sounds, favicon)
- **AND** directory contains `index.html` at root
- **AND** directory contains `vite.config.js` for build configuration
- **AND** directory contains `package.json` with Vite dependency

#### Scenario: Asset paths resolve correctly
- **WHEN** client code references an asset (e.g., `assets/sounds/cannon.ogg`)
- **THEN** Vite serves the file from `client/public/assets/sounds/cannon.ogg`
- **AND** relative paths work in both dev and production builds

### Requirement: Server workspace structure

The server workspace SHALL contain backend stub code with a TypeScript entry point, including health check endpoint and WebSocket stub.

#### Scenario: Server structure is initialized
- **WHEN** developer navigates to `server/` directory
- **THEN** directory contains `index.ts` entry point
- **AND** directory contains `tsconfig.json` for TypeScript configuration
- **AND** directory contains `package.json` with Bun dependencies

#### Scenario: Server can be started independently
- **WHEN** developer runs `npm run dev:server`
- **THEN** Bun starts server on port 3000
- **AND** server responds to health check at `/health` endpoint

### Requirement: Shared workspace for common code

The shared workspace SHALL contain code used by both client and server, starting with game constants, exported as ES modules.

#### Scenario: Shared constants are accessible to client
- **WHEN** client module imports from shared (e.g., `import { PLAYERS } from '../../../shared/constants.js'`)
- **THEN** import resolves correctly during development and build
- **AND** constants are available at runtime

#### Scenario: Shared constants are accessible to server
- **WHEN** server module imports from shared (e.g., `import { GRID_WIDTH } from '../shared/constants.js'`)
- **THEN** Bun resolves the import
- **AND** constants are available at runtime

### Requirement: Concurrent development servers

The system SHALL provide a single command to run both client and server development servers concurrently.

#### Scenario: Both servers start with one command
- **WHEN** developer runs `npm run dev` in root directory
- **THEN** both client (port 5173) and server (port 3000) start simultaneously
- **AND** console shows output from both servers
- **AND** developer can access http://localhost:5173 for client
- **AND** developer can access http://localhost:3000 for server

### Requirement: File migrations preserve functionality

All files SHALL be moved from root directory to client workspace, including `js/` → `client/src/`, `css/` → `client/css/`, `assets/` → `client/public/assets/`, and `index.html` → `client/index.html`.

#### Scenario: Game modules are relocated
- **WHEN** files are migrated to monorepo structure
- **THEN** all files from `js/` directory are in `client/src/` directory
- **AND** directory structure is preserved (core/, entities/, combat/, ui/, map/, fog/, audio/, utils/)
- **AND** all 18 game classes are present

#### Scenario: Assets are relocated to public directory
- **WHEN** files are migrated to monorepo structure
- **THEN** all sound files are in `client/public/assets/sounds/`
- **AND** dual format files are present (OGG and MP3 for each sound)

#### Scenario: Import paths are updated correctly
- **WHEN** files are migrated to monorepo structure
- **THEN** all import statements in JavaScript files use correct relative paths for new locations
- **AND** all imports resolve without errors
- **AND** game loads and functions identically to pre-migration state
