# Asset Pipeline Specification

## ADDED Requirements

### Requirement: Sound files in public directory

The system SHALL serve sound files (OGG and MP3 formats) from the `client/public/assets/sounds/` directory without processing or transformation.

#### Scenario: Sound files are relocated
- **WHEN** repository is migrated to monorepo structure
- **THEN** all sound files move from `assets/sounds/` to `client/public/assets/sounds/`
- **AND** directory structure is preserved
- **AND** all 15 expected sound effects are present in both OGG and MP3 formats

#### Scenario: Sounds are accessible in development
- **WHEN** game runs on Vite dev server (localhost:5173)
- **THEN** AudioManager can load sound files from `assets/sounds/` path
- **AND** Vite serves files from `client/public/assets/sounds/`
- **AND** no 404 errors occur for sound files

#### Scenario: Sounds are included in production build
- **WHEN** production build runs (`npm run build:client`)
- **THEN** all sound files are copied to `client/dist/assets/sounds/`
- **AND** files are not renamed or hashed (preserve original filenames for dual-format fallback logic)

### Requirement: AudioManager path compatibility

The system SHALL ensure AudioManager.js can load sound files using the existing relative path pattern (`assets/sounds/<name>.<ext>`) without modification.

#### Scenario: AudioManager loads sounds successfully
- **WHEN** game initializes and calls `AudioManager.preload()`
- **THEN** AudioManager constructs paths like `assets/sounds/cannon.ogg`
- **AND** browser successfully fetches files from correct location
- **AND** all 15 sounds preload without errors

#### Scenario: Dual-format fallback works
- **WHEN** browser does not support OGG format
- **THEN** AudioManager falls back to MP3 format
- **AND** both formats are available at expected paths
- **AND** audio playback works correctly

### Requirement: Removal of manual cache-busting

The system SHALL remove all manual cache-busting query strings (`?v=<version>`) from import statements, relying on Vite's automatic content hashing for cache invalidation.

#### Scenario: Import statements are cleaned
- **WHEN** repository is migrated to Vite build system
- **THEN** all import statements in JavaScript files use clean paths without query strings
- **AND** no imports contain `?v=20260214e` or similar patterns
- **AND** approximately 80+ imports are updated across all game modules

#### Scenario: Cache invalidation works automatically
- **WHEN** a JavaScript file changes between deployments
- **THEN** Vite generates a unique content hash for that file (e.g., `Game.a1b2c3d4.js`)
- **AND** browser downloads new version due to changed filename
- **AND** unchanged files keep same hash and remain cached

### Requirement: Static asset serving strategy

The system MUST use Vite's `public/` directory convention for assets that should be served as-is without import transformations.

#### Scenario: Public directory is configured
- **WHEN** Vite configuration is examined
- **THEN** `publicDir` is set to `public` in `vite.config.js`
- **AND** files in `client/public/` are copied verbatim to `client/dist/` during build

#### Scenario: Asset paths are predictable
- **WHEN** code references a public asset (e.g., `assets/sounds/cannon.ogg`)
- **THEN** path resolves to `/assets/sounds/cannon.ogg` relative to domain root
- **AND** path works identically in development and production

### Requirement: Future asset optimization compatibility

The system SHALL structure the asset pipeline to support future optimizations (e.g., image compression, audio format conversion) without breaking existing functionality.

#### Scenario: Asset directory is extensible
- **WHEN** new asset types are added in future (e.g., images, fonts)
- **THEN** developer can add to `client/public/assets/` subdirectories
- **AND** Vite serves them using same pattern as sounds

#### Scenario: Build plugins can be added
- **WHEN** future requirements need asset processing (e.g., image optimization plugin)
- **THEN** Vite plugins can be configured in `vite.config.js`
- **AND** public directory assets can optionally be processed
- **AND** existing sound file references continue working
