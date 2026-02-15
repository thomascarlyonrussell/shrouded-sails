# ship-vision-ranges

## MODIFIED Requirements

### Requirement: Ship type vision ranges (MODIFIED)
The system SHALL assign vision ranges scaled by the subdivision ratio. Vision range values are stored as pre-scaled fine-grid values.

#### Scenario: Sloop vision range at 2× subdivision
- **WHEN** querying the vision range of a Sloop (type 1)
- **THEN** the system SHALL return a vision range of 8 fine-grid tiles (original 4 × 2)

#### Scenario: Frigate vision range at 2× subdivision
- **WHEN** querying the vision range of a Frigate (type 2)
- **THEN** the system SHALL return a vision range of 6 fine-grid tiles (original 3 × 2)

#### Scenario: Flagship vision range at 2× subdivision
- **WHEN** querying the vision range of a Flagship (type 3)
- **THEN** the system SHALL return a vision range of 4 fine-grid tiles (original 2 × 2)

### Requirement: Vision range calculation from ship center (MODIFIED)
The system SHALL calculate vision coverage using Manhattan distance from the ship's center point, not from the anchor position.

#### Scenario: Sloop vision from center
- **WHEN** calculating vision coverage for a Sloop at (10, 5) with center (10.5, 5.5)
- **THEN** tiles SHALL be considered within vision if their center is within Manhattan distance of the vision range from (10.5, 5.5)

#### Scenario: Flagship vision from center
- **WHEN** calculating vision coverage for a Flagship at anchor (10, 5) with center (11, 6)
- **THEN** tiles SHALL be considered within vision if their center is within Manhattan distance of the vision range from (11, 6)
- **AND** the vision area SHALL be centered on the ship's geometric center, not biased toward the top-left anchor

#### Scenario: Vision range does not extend beyond map boundaries (unchanged)
- **WHEN** calculating vision coverage for a ship near the map edge
- **THEN** only tiles within the valid map boundaries SHALL be included in the vision range
