## Context

The current "New Game" settings modal (`#settingsModal`) uses a flat, vertically stacked layout where each setting occupies a significant amount of vertical space due to inline descriptions. This makes the dialog look cluttered and requires scrolling as options increase. We need a more scalable design that separates rules, interface, and audio settings while maintaining ease of use.

## Goals / Non-Goals

**Goals:**
- Implement a structured, categorized layout (Rules, Interface, Audio).
- Reduce visual noise by moving descriptions to tooltips.
- Standardize input controls (toggles, selects, sliders) for a consistent look.
- Ensure the layout is responsive and works well within the existing modal framework.

**Non-Goals:**
- Changing the actual logic or storage of settings (persistence logic remains in `SettingsMenu.js`).
- Adding new settings that don't currently exist (focus is on redesigning the existing set).
- Implementing a tab system (grid separation is sufficient for the current number of settings).

## Decisions

### 1. CSS Grid Layout
We will use a 2-column CSS Grid layout for the settings container.
- **Why**: It ensures perfect alignment of labels (left column) and controls (right column) regardless of content length.
- **Structure**: `grid-template-columns: 1fr auto;`
- **Responsiveness**: On very narrow screens, we can switch to `1fr` to stack them, but at the modal's min-width, side-by-side should persist.

### 2. Custom CSS Tooltips
Instead of browser-native `title` attributes or a heavy JS library, we will use a lightweight CSS-only tooltip solution.
- **Why**: Provides instant feedback, supports improved styling matching the game theme, and avoids script overhead.
- **Implementation**: An icon element `.info-icon` with a child `.tooltip-content` that becomes `display: block` on hover.

### 3. "Switch" Style Toggles
We will replace standard checkboxes with a "Toggle Switch" UI.
- **Why**: Indicates an immediate state change (on/off) more clearly and fits the "settings panel" mental model better than lengthy checkbox labels.
- **Implementation**: Standard "checkbox hack" using a `<label>` wrapping the input and a `<span>` for the visual slider.

### 4. Preservation of ID Hooks
We will retain the existing specific IDs (e.g., `fogOfWarCheckbox`, `combatDetailLevelSelect`) on the form elements.
- **Why**: `SettingsMenu.js` relies on `getElementById` to bind events. changing structure while keeping IDs ensures the JS logic remains largely untouched.

## Risks / Trade-offs

- **Risk**: Tooltips may be cut off by `overflow: hidden` on parent containers.
  - **Mitigation**: Ensure the tooltip container or modal body allows overflow or position tooltips carefully (e.g., to the right or bottom).
- **Risk**: Layout breakage on mobile.
  - **Mitigation**: Test with small viewports; standard grid behavior usually handles this well, but we should verify minimum widths.

## Migration Plan

1.  Update `style.css` with new classes (`.settings-grid`, `.settings-category`, `.toggle-switch`, `.tooltip`).
2.  Refactor `#settingsModal` in `index.html` to match the new structure, moving descriptions into tooltips.
3.  Refresh `SettingsMenu.js` references if any container-based query selectors were used (currently mostly direct IDs, so low risk).
