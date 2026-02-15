# ship-footprint-rendering

## ADDED Requirements

### Requirement: Ships rendered at footprint scale
The system SHALL render each ship's visual shape scaled to match its grid footprint size.

#### Scenario: Sloop rendered in single tile
- **WHEN** rendering a Sloop at position (10, 5)
- **THEN** the ship shape SHALL be drawn within a single tile area (1 × tileSize wide, 1 × tileSize tall)

#### Scenario: Frigate rendered across two tiles
- **WHEN** rendering a horizontal Frigate at anchor (10, 5)
- **THEN** the ship shape SHALL be drawn spanning two tiles (2 × tileSize wide, 1 × tileSize tall)
- **AND** the shape SHALL be centered within the combined tile area

#### Scenario: Flagship rendered across four tiles
- **WHEN** rendering a Flagship at anchor (10, 5)
- **THEN** the ship shape SHALL be drawn spanning a 2×2 tile block (2 × tileSize wide, 2 × tileSize tall)
- **AND** the shape SHALL be centered within the combined tile area

### Requirement: Frigate rotation rendering
The system SHALL render Frigates rotated to match their current orientation.

#### Scenario: Horizontal Frigate
- **WHEN** rendering a Frigate with horizontal orientation
- **THEN** the ship shape SHALL be drawn wider than tall, spanning two tiles horizontally

#### Scenario: Vertical Frigate
- **WHEN** rendering a Frigate with vertical orientation
- **THEN** the ship shape SHALL be drawn taller than wide, spanning two tiles vertically
- **AND** the anchor position SHALL be the top tile of the pair

### Requirement: UI indicators positioned for multi-tile ships
The system SHALL position HP bars, action badges, selection highlights, and completion overlays relative to the full ship footprint.

#### Scenario: HP bar spans full footprint width
- **WHEN** rendering the HP bar for a horizontal Frigate
- **THEN** the bar SHALL be positioned below the full 2-tile-wide footprint
- **AND** the bar width SHALL span the footprint width

#### Scenario: Selection highlight covers full footprint
- **WHEN** a Flagship is selected
- **THEN** the selection highlight (yellow outline) SHALL surround the entire 2×2 tile area
- **AND** corner brackets SHALL be positioned at the corners of the full footprint

#### Scenario: DONE overlay covers full footprint
- **WHEN** a Frigate has exhausted all actions
- **THEN** the semi-transparent "DONE" overlay SHALL cover both tiles of the footprint

#### Scenario: Action indicators positioned relative to footprint
- **WHEN** rendering M (moved) and A (action) indicators for a multi-tile ship
- **THEN** the indicators SHALL be positioned relative to the footprint's visual area, not a single tile
