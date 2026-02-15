# fine-grid-coordinates

## Purpose
Defines the fine-grid coordinate system and value scaling model used after grid subdivision.

## Requirements

### Requirement: Grid subdivision ratio
The system SHALL define a subdivision ratio that determines the relationship between coarse-tile (original) and fine-grid (subdivided) coordinate systems.

#### Scenario: Subdivision ratio doubles grid dimensions
- **WHEN** the subdivision ratio is 2
- **THEN** the grid width SHALL be 40 (original 20 × 2)
- **AND** the grid height SHALL be 30 (original 15 × 2)
- **AND** the tile size SHALL be 30px (original 60px / 2)

#### Scenario: Canvas dimensions preserved
- **WHEN** the grid is subdivided
- **THEN** the canvas pixel dimensions SHALL remain the same as the original (GRID.WIDTH × GRID.TILE_SIZE)
- **AND** the visual appearance of the board SHALL be equivalent in total size

### Requirement: Uniform value scaling
The system SHALL scale all tile-based gameplay constants proportionally with the subdivision ratio to preserve existing gameplay balance.

#### Scenario: Movement values scale with ratio
- **WHEN** the subdivision ratio is 2
- **THEN** Sloop movement SHALL be 10 (original 5 × 2)
- **AND** Frigate movement SHALL be 8 (original 4 × 2)
- **AND** Flagship movement SHALL be 6 (original 3 × 2)

#### Scenario: Firing range values scale with ratio
- **WHEN** the subdivision ratio is 2
- **THEN** Sloop firing range SHALL be 4 (original 2 × 2)
- **AND** Frigate firing range SHALL be 6 (original 3 × 2)
- **AND** Flagship firing range SHALL be 6 (original 3 × 2)

#### Scenario: Vision range values scale with ratio
- **WHEN** the subdivision ratio is 2
- **THEN** Sloop vision range SHALL be 8 (original 4 × 2)
- **AND** Frigate vision range SHALL be 6 (original 3 × 2)
- **AND** Flagship vision range SHALL be 4 (original 2 × 2)

#### Scenario: Map generation constants scale with ratio
- **WHEN** the subdivision ratio is 2
- **THEN** edge buffer SHALL be 4 (original 2 × 2)
- **AND** starting zone size SHALL be 8 (original 4 × 2)
- **AND** min/max island sizes SHALL scale proportionally

### Requirement: Pre-scaled constant storage
The system SHALL store all gameplay constants as their final fine-grid values, not as coarse-tile equivalents requiring runtime multiplication.

#### Scenario: Constants are directly usable
- **WHEN** game code reads a ship's movement value from constants
- **THEN** the value SHALL be the fine-grid movement range (e.g., 10 for Sloop at 2× subdivision)
- **AND** no multiplication by the subdivision ratio SHALL be required at point of use

#### Scenario: Subdivision ratio available for reference
- **WHEN** code needs to convert between coarse-tile and fine-grid units
- **THEN** a named `SUBDIVISION_RATIO` constant SHALL be available in the constants file
