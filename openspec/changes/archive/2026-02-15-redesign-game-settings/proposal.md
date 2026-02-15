## Why

The current "New Game" settings dialog (`#settingsModal`) has become cluttered with large blocks of text and inconsistent control styles, making it difficult for users to quickly scan and configure the game options. As new settings are added, the current "stacked list" approach is not scaling well.

## What Changes

- **Grid Layout**: Move from a single vertical list to a structured grid layout for clearer alignment.
- **Categorization**: Group settings into logical sections (Game Rules, Interface, Audio) to improve mental modeling.
- **Visual Hierarchy**: Standardize input controls and labels.
- **Tooltip Descriptions**: Move verbose descriptions out of the main flow into tooltips (hover icons) to reduce visual noise while maintaining accessibility.

## Capabilities

### New Capabilities
- `structured-settings-dialog`: A categorized, grid-based settings UI aimed at scalability and readability.

### Modified Capabilities
- None

## Impact

- **Client UI**: Significant refactoring of `#settingsModal` in `index.html`.
- **Styles**: New CSS for grid layout, categories, and tooltips in `style.css`.
- **Logic**: Updates to `SettingsMenu.js` to support the new structure, though logic changes should be minimal.
