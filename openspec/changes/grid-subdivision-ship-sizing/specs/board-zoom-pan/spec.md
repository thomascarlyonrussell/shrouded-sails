# board-zoom-pan

## ADDED Requirements

### Requirement: Camera system for zoom and pan
The system SHALL implement a camera that manages zoom level and pan offset, applied as a transform wrapping all canvas rendering.

#### Scenario: Default zoom shows full board
- **WHEN** a game starts or zoom is reset
- **THEN** the camera zoom level SHALL be set so the full board is visible within the canvas

#### Scenario: Camera transform applied to rendering
- **WHEN** the renderer draws the game board
- **THEN** all rendering SHALL be transformed through the camera's zoom and pan values
- **AND** grid lines, tiles, ships, fog overlay, and effects SHALL all render at the camera's current view

#### Scenario: Screen shake composes with camera
- **WHEN** screen shake is active during combat
- **THEN** the shake offset SHALL be applied in screen space (after camera transform)
- **AND** shake magnitude SHALL remain constant regardless of zoom level

### Requirement: Pinch-to-zoom gesture
The system SHALL support pinch-to-zoom gestures on touch devices to zoom into and out of the game board.

#### Scenario: Pinch outward zooms in
- **WHEN** the player performs a pinch-outward gesture (fingers moving apart) on the canvas
- **THEN** the camera zoom level SHALL increase (zoom in)
- **AND** the zoom SHALL center on the midpoint between the two touch points

#### Scenario: Pinch inward zooms out
- **WHEN** the player performs a pinch-inward gesture (fingers moving together) on the canvas
- **THEN** the camera zoom level SHALL decrease (zoom out)
- **AND** the zoom SHALL not go below the minimum level (full board visible)

#### Scenario: Zoom has maximum limit
- **WHEN** the player zooms in beyond the maximum zoom level
- **THEN** the zoom SHALL be clamped to the maximum
- **AND** further pinch-outward gestures SHALL have no effect

### Requirement: Pan gesture
The system SHALL support single-finger drag gestures to pan the camera across the board when zoomed in.

#### Scenario: Drag pans the view
- **WHEN** the player drags with a single finger on the canvas while zoomed in
- **THEN** the camera offset SHALL move to follow the drag direction
- **AND** the board SHALL appear to scroll under the player's finger

#### Scenario: Pan constrained to board bounds
- **WHEN** the player pans toward the edge of the board
- **THEN** the camera SHALL stop panning before the view moves beyond the board boundaries
- **AND** empty space beyond the board SHALL not be visible

#### Scenario: Pan disabled at default zoom
- **WHEN** the camera is at the default zoom level (full board visible)
- **THEN** single-finger drag SHALL NOT pan the camera
- **AND** single-finger tap SHALL be treated as a click for ship selection

### Requirement: Touch gesture disambiguation
The system SHALL distinguish between taps (clicks), pans, and pinch-to-zoom gestures.

#### Scenario: Quick tap treated as click
- **WHEN** a single touch starts and ends within a short duration (< 200ms) and small movement (< 10px)
- **THEN** the touch SHALL be treated as a click/tap for ship selection or action targeting

#### Scenario: Single-finger drag treated as pan
- **WHEN** a single touch moves more than 10px while zoomed in
- **THEN** the touch SHALL be treated as a pan gesture
- **AND** no click event SHALL fire

#### Scenario: Multi-touch treated as pinch-to-zoom
- **WHEN** two simultaneous touches are detected on the canvas
- **THEN** the gesture SHALL be treated as pinch-to-zoom
- **AND** no click or pan events SHALL fire

### Requirement: Coordinate transforms through camera
The system SHALL correctly transform coordinates between screen space and grid space through the camera's zoom and pan.

#### Scenario: Click at zoom maps to correct grid position
- **WHEN** the player taps the canvas while zoomed in to 2× at pan offset (100, 50)
- **THEN** the tap coordinates SHALL be inverse-transformed through the camera
- **AND** the resulting grid position SHALL accurately reflect the tile the player tapped

#### Scenario: Grid position renders at correct screen position
- **WHEN** rendering a ship at grid position (20, 15) with camera zoom 2× and pan offset (100, 50)
- **THEN** the ship SHALL appear at the correct screen position consistent with the camera transform
