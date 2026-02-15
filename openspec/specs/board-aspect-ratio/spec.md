# board-aspect-ratio

## Purpose
Defines board orientation options and constraints so landscape and portrait layouts behave consistently across setup and gameplay.

## Requirements

### Requirement: Board layout game setting
The system SHALL provide a game setting to choose between landscape and portrait board layouts at game creation.

#### Scenario: Landscape layout selected
- **WHEN** the player selects landscape layout
- **THEN** the grid SHALL use landscape dimensions (40 wide × 30 tall at 2× subdivision)
- **AND** the canvas aspect ratio SHALL be landscape (wider than tall)

#### Scenario: Portrait layout selected
- **WHEN** the player selects portrait layout
- **THEN** the grid SHALL use portrait dimensions (30 wide × 40 tall at 2× subdivision)
- **AND** the canvas aspect ratio SHALL be portrait (taller than wide)

#### Scenario: Same total tile count
- **WHEN** comparing landscape and portrait layouts
- **THEN** both SHALL have the same total number of grid cells (1,200 at 2× subdivision)

### Requirement: Auto-suggestion based on device orientation
The system SHALL auto-suggest a board layout matching the creator's device orientation.

#### Scenario: Portrait device suggests portrait layout
- **WHEN** the game creation screen loads on a device where viewport height > viewport width
- **THEN** the portrait layout SHALL be pre-selected as the suggested default

#### Scenario: Landscape device suggests landscape layout
- **WHEN** the game creation screen loads on a device where viewport width ≥ viewport height
- **THEN** the landscape layout SHALL be pre-selected as the suggested default

#### Scenario: Player can override suggestion
- **WHEN** the system suggests a layout based on device orientation
- **THEN** the player SHALL be able to change the selection before starting the game

### Requirement: Starting zone adaptation for board orientation
The system SHALL adapt starting zone placement based on the board layout to maximize fleet separation along the board's longer axis.

#### Scenario: Landscape starting zones (left/right)
- **WHEN** the board layout is landscape
- **THEN** Player 1's starting zone SHALL be on the left side of the board
- **AND** Player 2's starting zone SHALL be on the right side of the board

#### Scenario: Portrait starting zones (top/bottom)
- **WHEN** the board layout is portrait
- **THEN** Player 1's starting zone SHALL be at the top of the board
- **AND** Player 2's starting zone SHALL be at the bottom of the board

#### Scenario: Starting zone size scales with subdivision
- **WHEN** calculating starting zone boundaries
- **THEN** the zone size SHALL be the scaled `STARTING_ZONE_SIZE` constant (8×8 at 2× subdivision)
- **AND** the edge buffer SHALL be the scaled `EDGE_BUFFER` constant (4 at 2× subdivision)

### Requirement: Board layout locked for game duration
The system SHALL not allow changing the board layout after a game has started.

#### Scenario: Layout set at game creation
- **WHEN** a game is initialized with a board layout setting
- **THEN** the layout SHALL remain fixed for the entire game session
- **AND** no UI option to change layout SHALL be available during gameplay
