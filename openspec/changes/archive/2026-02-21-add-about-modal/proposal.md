## Why

Players need a way to learn about the game's creation, view credits, and understand that this project uses AI-assisted development. Currently, there's no in-game place to discover this information beyond the README.

## What Changes

- Add new **AboutModal** component accessible from in-game settings
- Add "About This Game" button to **InGameSettingsPanel** (next to Report Bug button)
- Modal displays game version, creator credits, AI assistance disclosure, and links to GitHub/documentation
- Reuse existing modal patterns (similar to BugReportModal) for consistency

## Capabilities

### New Capabilities
- `about-modal`: A modal UI component that displays game information, credits, AI assistance disclosure, version number, and external links

### Modified Capabilities
<!-- No existing capabilities are being modified at the spec level -->

## Impact

**New Files:**
- `client/src/ui/AboutModal.js` - Modal controller class

**Modified Files:**
- `client/src/ui/InGameSettingsPanel.js` - Add About button and modal integration
- `client/index.html` - Add AboutModal HTML markup
- `client/css/style.css` - Add AboutModal styling
- `client/src/main.js` - Instantiate and wire up AboutModal
