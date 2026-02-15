## 1. CSS Styles

- [x] 1.1 Add grid layout classes (`.settings-grid`, `.settings-category`, `.setting-row`) to `client/css/style.css`.
- [x] 1.2 Implement CSS-only tooltip styles (`.info-icon`, `.tooltip-content`).
- [x] 1.3 Implement Toggle Switch styles (`.toggle-switch`, `.slider`) to replace default checkboxes.
- [x] 1.4 Refine general settings modal spacing and responsive behavior.
- [x] 1.5 Clean up unused CSS classes related to the old "stacked" settings layout.

## 2. HTML Structure

- [x] 2.1 Refactor `#settingsModal` in `client/index.html` to use the new `.settings-grid` structure.
- [x] 2.2 Group existing settings into "Game Rules", "Interface", and "Audio" sections with headers.
- [x] 2.3 Replace `fogOfWarCheckbox` and `muteAllCheckbox` inputs with the new toggle switch markup (preserving IDs).
- [x] 2.4 Move verbose descriptions from paragraph tags into `.tooltip-content` elements inside `.info-icon`.
- [x] 2.5 Verify all input IDs match the original ones to maintain JS compatibility.

## 3. JavaScript Logic

- [x] 3.1 Verify `SettingsMenu.js` element binding works with the new structure.
- [x] 3.2 Verify `SettingsMenu.js` event listeners (change/input) fire correctly on the new inputs.
- [x] 3.3 Verify initial state synchronization (loading settings from localStorage updates the new UI correctly).

## 4. Verification

- [x] 4.1 Launch the game and open "Game Settings" (New Game modal).
- [x] 4.2 Verify layout alignment (grid) and sections.
- [x] 4.3 Verify tooltips appear on hover and are readable.
- [x] 4.4 Verify toggling "Fog of War" persist state and affects gameplay.
- [x] 4.5 Verify audio sliders and mute toggle work as expected.
