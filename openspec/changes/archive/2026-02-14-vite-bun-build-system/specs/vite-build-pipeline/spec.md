# Vite Build Pipeline Specification

## ADDED Requirements

### Requirement: Development server with HMR

The system SHALL provide a Vite development server on port 5173 with hot module replacement for all JavaScript modules and CSS files.

#### Scenario: Developer starts development server
- **WHEN** developer runs `npm run dev:client`
- **THEN** Vite dev server starts on http://localhost:5173
- **AND** game loads successfully in browser
- **AND** console shows no module loading errors

#### Scenario: Developer edits CSS file
- **WHEN** developer modifies any file in `client/css/`
- **THEN** browser updates styles without full page reload
- **AND** game state is preserved (current turn, ship positions)

#### Scenario: Developer edits JavaScript module
- **WHEN** developer modifies any file in `client/src/`
- **THEN** browser reloads the affected module
- **AND** game reinitializes with updated code

### Requirement: Production build with optimization

The system SHALL generate an optimized production build in `client/dist/` with bundling, minification, tree-shaking, and content-hashed filenames.

#### Scenario: Production build succeeds
- **WHEN** developer runs `npm run build:client`
- **THEN** Vite creates `client/dist/` directory
- **AND** output includes minified JavaScript bundles with content hashes (e.g., `main.a1b2c3d4.js`)
- **AND** output includes processed CSS with content hashes
- **AND** output includes `index.html` with correct asset references
- **AND** build completes without errors

#### Scenario: Production bundle is optimized
- **WHEN** production build completes
- **THEN** total JavaScript bundle size is less than 150KB (uncompressed)
- **AND** unused code is removed via tree-shaking
- **AND** all assets have content-based cache-busting hashes

### Requirement: Asset handling

The system SHALL serve static assets from `client/public/` directory without processing, making them available at root URL paths.

#### Scenario: Sound files are accessible
- **WHEN** game requests sound file at `assets/sounds/cannon.ogg`
- **THEN** Vite serves file from `client/public/assets/sounds/cannon.ogg`
- **AND** file is served with correct MIME type
- **AND** no 404 errors occur

#### Scenario: Assets are copied to production build
- **WHEN** production build runs
- **THEN** all files from `client/public/` are copied to `client/dist/`
- **AND** directory structure is preserved (e.g., `dist/assets/sounds/`)

### Requirement: Module resolution without manual cache-busting

The system SHALL resolve ES module imports using standard relative paths without query string version parameters, relying on Vite's automatic content hashing for cache invalidation.

#### Scenario: Import statements use clean paths
- **WHEN** a module imports another module (e.g., `import { Game } from './core/Game.js'`)
- **THEN** Vite resolves the module correctly
- **AND** no query string version is required (no `?v=20260214e`)

#### Scenario: Cache invalidation works automatically
- **WHEN** a JavaScript file changes
- **THEN** production build generates new content hash for that file
- **AND** browser loads updated version on next visit
- **AND** unchanged files retain same hash (optimal caching)

### Requirement: Configuration via vite.config.js

The system SHALL use a `client/vite.config.js` file for all Vite configuration including root directory, public directory, build output, and server settings.

#### Scenario: Vite uses configuration file
- **WHEN** Vite starts development server or builds for production
- **THEN** Vite reads configuration from `client/vite.config.js`
- **AND** respects configured root directory (`.`)
- **AND** respects configured public directory (`public`)
- **AND** respects configured output directory (`dist`)
- **AND** respects configured server port (5173)
