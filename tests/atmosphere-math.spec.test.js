import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    buildVisibilityDistanceMap,
    getFogOpacityForDistance,
    getWindAtmosphereTarget,
    hasUnseenNeighbor
} from '../client/src/ui/AtmosphereMath.js';
import { ATMOSPHERE, FOG_VISUALS } from '../shared/constants.js';

describe('AtmosphereMath', () => {
    it('maps wind direction and strength into drift targets', () => {
        const wind = {
            strength: 1,
            getDirectionVector: () => ({ dx: 1, dy: 0 })
        };
        const target = getWindAtmosphereTarget(wind, ATMOSPHERE.MIST);

        assert.equal(target.velocityY, 0);
        assert.ok(target.velocityX > ATMOSPHERE.MIST.CALM_DRIFT_SPEED);
        assert.ok(target.alpha > ATMOSPHERE.MIST.BASE_ALPHA);
    });

    it('keeps calm wind with subtle non-zero drift speed', () => {
        const wind = {
            strength: 0,
            getDirectionVector: () => ({ dx: 0, dy: -1 })
        };
        const target = getWindAtmosphereTarget(wind, ATMOSPHERE.MIST);

        assert.equal(target.velocityX, 0);
        assert.equal(target.velocityY, -ATMOSPHERE.MIST.CALM_DRIFT_SPEED);
        assert.equal(target.alpha, ATMOSPHERE.MIST.BASE_ALPHA);
    });

    it('builds manhattan distance map from visible tiles', () => {
        const visible = new Set(['1,1']);
        const distances = buildVisibilityDistanceMap(3, 3, visible);

        assert.equal(distances[1 * 3 + 1], 0);
        assert.equal(distances[1 * 3 + 2], 1);
        assert.equal(distances[2 * 3 + 2], 2);
        assert.equal(distances[0], 2);
    });

    it('classifies fog opacity by unseen distance bands', () => {
        assert.equal(getFogOpacityForDistance(1, FOG_VISUALS), FOG_VISUALS.FRONTIER_ALPHA);
        assert.equal(getFogOpacityForDistance(FOG_VISUALS.FRONTIER_DISTANCE + 1, FOG_VISUALS), FOG_VISUALS.MID_ALPHA);
        assert.equal(getFogOpacityForDistance(FOG_VISUALS.MID_DISTANCE + 2, FOG_VISUALS), FOG_VISUALS.DEEP_ALPHA);
        assert.equal(getFogOpacityForDistance(0, FOG_VISUALS), 0);
    });

    it('detects unseen neighbors around visible frontier tiles', () => {
        const visible = new Set(['1,1', '1,2']);
        assert.equal(hasUnseenNeighbor(1, 1, visible, 4, 4), true);
        assert.equal(hasUnseenNeighbor(1, 2, visible, 4, 4), true);
    });
});
