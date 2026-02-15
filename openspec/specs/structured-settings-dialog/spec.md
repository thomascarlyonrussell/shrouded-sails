## Purpose

Define the behavior and presentation requirements for a structured, categorized New Game settings dialog. Detailed UX rationale is TBD.

## Requirements

### Requirement: Categorized Settings Grouping
The new game settings dialog SHALL organize all configuration options into distinct logical categories to improve discoverability.

#### Scenario: Displaying Categories
- **WHEN** the user opens the "New Game" settings dialog
- **THEN** they see section headers for "Game Rules", "Interface", and "Audio"
- **AND** relevant settings are grouped under each header

### Requirement: Grid-Based Layout
The settings dialog SHALL use a grid layout to ensure labels and controls are consistently aligned, improving scannability.

#### Scenario: Alignment of Controls
- **WHEN** the user views a settings category
- **THEN** all setting labels align to the left
- **AND** all input controls (toggles, selects, sliders) align to the right in a dedicated column

### Requirement: Tooltip Descriptions
The system SHALL display detailed explanations of settings via interactive tooltips rather than inline text, reducing visual clutter.

#### Scenario: Viewing Setting Details
- **WHEN** the user hovers over the info icon (ⓘ) next to a setting label
- **THEN** a tooltip appears containing the detailed description text
- **AND** the tooltip disappears when the mouse moves away

### Requirement: Standardized Input Controls
The settings dialog SHALL use a consistent visual style for all input types (switches for booleans, dropdowns for choices, sliders for ranges).

#### Scenario: Toggling Boolean Settings
- **WHEN** the user sees a boolean setting (e.g., Fog of War)
- **THEN** it is represented by a standardized toggle switch instead of a native checkbox
