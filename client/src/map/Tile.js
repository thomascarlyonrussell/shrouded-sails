import { TILE_TYPES } from '../../../shared/constants.js';

export class Tile {
    constructor(x, y, type = TILE_TYPES.WATER) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    isWater() {
        return this.type === TILE_TYPES.WATER;
    }

    isIsland() {
        return this.type === TILE_TYPES.ISLAND;
    }

    setType(type) {
        this.type = type;
    }
}
