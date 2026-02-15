## ADDED Requirements

### Requirement: Hull silhouette shape for all ship types
The system SHALL render each ship type using a hull silhouette shape — a pointed bow, curved hull sides, and tapered stern — drawn with Canvas 2D path operations.

#### Scenario: Sloop hull silhouette
- **WHEN** a Sloop (type 1, 1×1 footprint) is rendered
- **THEN** the shape SHALL be a compact hull silhouette with a pointed bow at the top, gently curved sides, and a flat or slightly tapered stern at the bottom
- **AND** the shape SHALL fit within the ship's computed width and height dimensions

#### Scenario: Frigate hull silhouette
- **WHEN** a Frigate (type 2, 2×1 footprint) is rendered
- **THEN** the shape SHALL be an elongated hull silhouette with a pronounced pointed bow, curved sides, and a slightly tapered stern
- **AND** the shape SHALL include a single row of gun ports (one per side)

#### Scenario: Flagship hull silhouette
- **WHEN** a Flagship (type 3, 2×2 footprint) is rendered
- **THEN** the shape SHALL be a wide, imposing hull silhouette with a bold pointed bow, strong curved sides, and a tapered stern
- **AND** the shape SHALL include two rows of gun ports (two per side per row)
- **AND** the shape SHALL include layered deck detail (main deck and upper deck)

### Requirement: Mast lines as rank indicator
The system SHALL render vertical mast lines on each ship to indicate rank, replacing any numeric level overlay.

#### Scenario: Sloop mast count
- **WHEN** a Sloop is rendered
- **THEN** the system SHALL draw exactly 1 mast line near the top of the hull

#### Scenario: Frigate mast count
- **WHEN** a Frigate is rendered
- **THEN** the system SHALL draw exactly 2 mast lines evenly spaced along the hull

#### Scenario: Flagship mast count
- **WHEN** a Flagship is rendered
- **THEN** the system SHALL draw exactly 3 mast lines evenly spaced along the hull

#### Scenario: Mast line appearance
- **WHEN** mast lines are rendered on any ship type
- **THEN** each mast SHALL be a thin vertical line with a small horizontal crossbar (yard)
- **AND** mast lines SHALL be white with a dark outline for visibility against both player colors

### Requirement: No numeric level overlay
The system SHALL NOT render numeric level indicators (e.g., "1", "2", "3") on ship shapes.

#### Scenario: Level number removed from all ships
- **WHEN** any ship is rendered on the game grid
- **THEN** no numeric text indicating ship type or level SHALL be drawn at the ship's center
- **AND** rank SHALL be communicated solely through ship size, hull shape, and mast count

### Requirement: Ship color and outline
The system SHALL render each ship using the owning player's color with a dark outline.

#### Scenario: Player color applied to hull
- **WHEN** a ship is rendered
- **THEN** the hull fill color SHALL match the owning player's color (red for Player 1, blue for Player 2)
- **AND** captured ships SHALL use a brightened variant of the owner's color

#### Scenario: Hull outline
- **WHEN** a ship hull is rendered
- **THEN** a dark (black) outline SHALL be drawn around the hull path

### Requirement: Deck detail
The system SHALL render deck detail as a lighter-colored interior region on ships where pixel budget allows.

#### Scenario: Sloop deck
- **WHEN** a Sloop is rendered
- **THEN** a small inner deck region SHALL be drawn in a brightened shade of the hull color

#### Scenario: Frigate deck
- **WHEN** a Frigate is rendered
- **THEN** a deck region SHALL be drawn in a brightened shade of the hull color

#### Scenario: Flagship multi-level deck
- **WHEN** a Flagship is rendered
- **THEN** a main deck region SHALL be drawn in a brightened shade of the hull color
- **AND** an upper deck region SHALL be drawn in a further brightened shade
