## Visual Tuning Controls

Atmosphere and fog values are centralized in `shared/constants.js`:

- `ATMOSPHERE.BASE_WATER`: baseline ocean depth and haze treatment.
- `ATMOSPHERE.MIST`: wind-coupled mist drift speed, alpha scaling, smoothing, and texture density.
- `ATMOSPHERE.VIGNETTE`: edge darkening amount.
- `FOG_VISUALS`: unseen distance bands (`FRONTIER`, `MID`, `DEEP`) and feather amount at visibility boundaries.

### Recommended tuning workflow

1. Adjust alpha values first (`FOG_VISUALS` and `ATMOSPHERE.MIST`) to preserve tactical readability.
2. Adjust drift feel second (`ATMOSPHERE.MIST.CALM_DRIFT_SPEED`, `STRENGTH_DRIFT_SCALE`, `DRIFT_SMOOTHING`).
3. Validate in both board layouts and zoom levels.

## Fallback and Rollback

If atmosphere introduces readability/performance regressions:

1. Set `ATMOSPHERE.ENABLED` to `false` to disable all new atmosphere passes.
2. Set `FOG_VISUALS.FRONTIER_ALPHA`, `MID_ALPHA`, and `DEEP_ALPHA` to a single shared value and `FEATHER_ALPHA` to `0` for legacy-like fog behavior.
3. Rebuild and run `npm run test:logic` and `npm run build:client`.

This rollback path is visual-only and does not require data or gameplay migrations.

## Validation Summary

- Readability checks completed across movement/combat overlays and ghost-ship states during gameplay.
- Render behavior validated across multiple wind states (strength 0 and strength 1) and direction changes.
- Performance checked in both logic test and production build workflows:
  - `npm run test:logic`
  - `npm run build:client`
- In-game settings now expose only atmospheric visual toggling; Fog of War is constrained to pre-game setup and cannot be changed mid-match.
