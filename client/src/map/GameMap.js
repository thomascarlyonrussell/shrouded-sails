import { GRID, TILE_TYPES, MAP_GENERATION, BOARD_LAYOUTS } from '../../../shared/constants.js';
import { Tile } from './Tile.js';

export class GameMap {
    constructor(layout = 'landscape') {
        this.layout = BOARD_LAYOUTS[layout] ? layout : 'landscape';
        this.width = BOARD_LAYOUTS[this.layout]?.width || GRID.WIDTH;
        this.height = BOARD_LAYOUTS[this.layout]?.height || GRID.HEIGHT;
        this.tiles = [];
        this.ships = [];

        this.initializeTiles();
        this.generateIslands();
    }

    initializeTiles() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new Tile(x, y, TILE_TYPES.WATER);
            }
        }
    }

    generateIslands() {
        const islandCount = Math.floor(
            Math.random() * (MAP_GENERATION.MAX_ISLANDS - MAP_GENERATION.MIN_ISLANDS + 1)
        ) + MAP_GENERATION.MIN_ISLANDS;

        for (let i = 0; i < islandCount; i++) {
            this.generateSingleIsland();
        }
    }

    generateSingleIsland() {
        const maxAttempts = 50;
        let attempt = 0;

        while (attempt < maxAttempts) {
            const x = Math.floor(
                Math.random() * (this.width - MAP_GENERATION.EDGE_BUFFER * 2)
            ) + MAP_GENERATION.EDGE_BUFFER;

            const y = Math.floor(
                Math.random() * (this.height - MAP_GENERATION.EDGE_BUFFER * 2)
            ) + MAP_GENERATION.EDGE_BUFFER;

            if (this.isInStartingZone(x, y)) {
                attempt++;
                continue;
            }

            const size = Math.floor(
                Math.random() * (MAP_GENERATION.MAX_ISLAND_SIZE - MAP_GENERATION.MIN_ISLAND_SIZE + 1)
            ) + MAP_GENERATION.MIN_ISLAND_SIZE;

            if (this.placeIslandCluster(x, y, size)) {
                return;
            }

            attempt++;
        }
    }

    placeIslandCluster(startX, startY, size) {
        const positions = [{ x: startX, y: startY }];

        for (let i = 1; i < size; i++) {
            const basePos = positions[Math.floor(Math.random() * positions.length)];
            const adjacents = this.getAdjacentPositions(basePos.x, basePos.y);
            adjacents.sort(() => Math.random() - 0.5);

            let placed = false;
            for (const adj of adjacents) {
                if (
                    this.isValidIslandPosition(adj.x, adj.y)
                    && !positions.some(p => p.x === adj.x && p.y === adj.y)
                ) {
                    positions.push(adj);
                    placed = true;
                    break;
                }
            }

            if (!placed) break;
        }

        if (positions.length > 0) {
            positions.forEach(pos => {
                if (this.isValidPosition(pos.x, pos.y)) {
                    this.tiles[pos.y][pos.x].setType(TILE_TYPES.ISLAND);
                }
            });
            return true;
        }

        return false;
    }

    isInStartingZone(x, y) {
        const zoneSize = MAP_GENERATION.STARTING_ZONE_SIZE;

        if (this.layout === 'portrait') {
            if (y < zoneSize) return true;
            if (y >= this.height - zoneSize) return true;
            return false;
        }

        if (x < zoneSize) return true;
        if (x >= this.width - zoneSize) return true;
        return false;
    }

    isValidIslandPosition(x, y) {
        if (!this.isValidPosition(x, y)) return false;
        if (this.isInStartingZone(x, y)) return false;
        if (this.tiles[y][x].isIsland()) return false;
        return true;
    }

    isValidPosition(x, y, footprint = { width: 1, height: 1 }) {
        return x >= 0 && y >= 0 && (x + footprint.width - 1) < this.width && (y + footprint.height - 1) < this.height;
    }

    getTile(x, y) {
        if (!this.isValidPosition(x, y)) return null;
        return this.tiles[y][x];
    }

    getAdjacentPositions(x, y) {
        const adjacents = [];
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];

        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            if (this.isValidPosition(newX, newY)) {
                adjacents.push({ x: newX, y: newY });
            }
        }

        return adjacents;
    }

    isFootprintClear(x, y, footprint = { width: 1, height: 1 }, orientation = 'horizontal', excludeShip = null, game = null, viewingOwner = null) {
        const orientedFootprint = orientation === 'vertical'
            ? { width: footprint.height, height: footprint.width }
            : footprint;

        if (!this.isValidPosition(x, y, orientedFootprint)) {
            return { clear: false, blockingShip: null };
        }

        for (let dy = 0; dy < orientedFootprint.height; dy++) {
            for (let dx = 0; dx < orientedFootprint.width; dx++) {
                const tileX = x + dx;
                const tileY = y + dy;
                const tile = this.getTile(tileX, tileY);
                if (!tile || tile.isIsland()) {
                    return { clear: false, blockingShip: null };
                }

                const ship = this.getShipAt(tileX, tileY, excludeShip);
                if (!ship) continue;

                if (
                    game
                    && game.fogOfWar
                    && ship.owner !== viewingOwner
                    && !game.fogOfWar.isShipVisible(ship, viewingOwner)
                ) {
                    continue;
                }

                return { clear: false, blockingShip: ship };
            }
        }

        return { clear: true, blockingShip: null };
    }

    isOccupied(x, y) {
        return Boolean(this.getShipAt(x, y));
    }

    getShipAt(x, y, excludeShip = null) {
        return this.ships.find(ship => {
            if (ship.isDestroyed || ship === excludeShip) return false;
            return ship.getOccupiedTiles().some(pos => pos.x === x && pos.y === y);
        }) || null;
    }

    addShip(ship) {
        this.ships.push(ship);
    }

    removeShip(ship) {
        const index = this.ships.indexOf(ship);
        if (index > -1) {
            this.ships.splice(index, 1);
        }
    }

    getDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    hasLineOfSight(x1, y1, x2, y2) {
        const lineTiles = this.getLineOfSightTiles(x1, y1, x2, y2);

        for (const pos of lineTiles) {
            const tile = this.getTile(Math.floor(pos.x), Math.floor(pos.y));
            if (tile && tile.isIsland()) {
                return false;
            }
        }

        return true;
    }

    getLineOfSightTiles(x1, y1, x2, y2) {
        const tiles = [];

        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (true) {
            if ((x !== x1 || y !== y1) && (x !== x2 || y !== y2)) {
                tiles.push({ x, y });
            }

            if (Math.round(x) === Math.round(x2) && Math.round(y) === Math.round(y2)) {
                break;
            }

            const e2 = 2 * err;

            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }

            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        return tiles;
    }
}
