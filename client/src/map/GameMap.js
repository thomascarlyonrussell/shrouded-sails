import { GRID, TILE_TYPES, MAP_GENERATION, BOARD_LAYOUTS } from '../../../shared/constants.js';
import { Tile } from './Tile.js';

export class GameMap {
    constructor(layout = 'landscape') {
        this.layout = BOARD_LAYOUTS[layout] ? layout : 'landscape';
        this.width = BOARD_LAYOUTS[this.layout]?.width || GRID.WIDTH;
        this.height = BOARD_LAYOUTS[this.layout]?.height || GRID.HEIGHT;
        this.tiles = [];
        this.ships = [];
        this.occupiedTiles = new Map();
        this.shipTileIndex = new Map();
        this.shipById = new Map();

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

    getOrientedFootprint(footprint = { width: 1, height: 1 }, orientation = 'horizontal') {
        return orientation === 'vertical'
            ? { width: footprint.height, height: footprint.width }
            : footprint;
    }

    getFootprintTiles(x, y, footprint = { width: 1, height: 1 }, orientation = 'horizontal') {
        const orientedFootprint = this.getOrientedFootprint(footprint, orientation);
        const tiles = [];

        for (let dy = 0; dy < orientedFootprint.height; dy++) {
            for (let dx = 0; dx < orientedFootprint.width; dx++) {
                tiles.push({ x: x + dx, y: y + dy });
            }
        }

        return tiles;
    }

    isFootprintInStartingZone(x, y, footprint = { width: 1, height: 1 }, orientation = 'horizontal') {
        const orientedFootprint = this.getOrientedFootprint(footprint, orientation);
        if (!this.isValidPosition(x, y, orientedFootprint)) {
            return false;
        }

        const footprintTiles = this.getFootprintTiles(x, y, footprint, orientation);
        return footprintTiles.every(tile => this.isInStartingZone(tile.x, tile.y));
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
        const orientedFootprint = this.getOrientedFootprint(footprint, orientation);

        if (!this.isValidPosition(x, y, orientedFootprint)) {
            return { clear: false, blockingShip: null };
        }

        for (const tilePos of this.getFootprintTiles(x, y, footprint, orientation)) {
            const tile = this.getTile(tilePos.x, tilePos.y);
            if (!tile || tile.isIsland()) {
                return { clear: false, blockingShip: null };
            }

            const ship = this.getShipAt(tilePos.x, tilePos.y, excludeShip);
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

        return { clear: true, blockingShip: null };
    }

    getFootprintConflicts(x, y, footprint = { width: 1, height: 1 }, orientation = 'horizontal', excludeShip = null) {
        const orientedFootprint = this.getOrientedFootprint(footprint, orientation);
        if (!this.isValidPosition(x, y, orientedFootprint)) {
            return [];
        }

        const conflicts = new Map();
        for (const tilePos of this.getFootprintTiles(x, y, footprint, orientation)) {
            const ship = this.getShipAt(tilePos.x, tilePos.y, excludeShip);
            if (ship) {
                conflicts.set(ship.id, ship);
            }
        }

        return [...conflicts.values()];
    }

    isOccupied(x, y) {
        return Boolean(this.getShipAt(x, y));
    }

    getTileKey(x, y) {
        return `${x},${y}`;
    }

    registerShipTiles(ship) {
        if (!ship || ship.isDestroyed) return;

        const keys = new Set();
        for (const pos of ship.getOccupiedTiles()) {
            const key = this.getTileKey(pos.x, pos.y);
            keys.add(key);
            if (!this.occupiedTiles.has(key)) {
                this.occupiedTiles.set(key, new Set());
            }
            this.occupiedTiles.get(key).add(ship.id);
        }

        this.shipTileIndex.set(ship.id, keys);
        this.shipById.set(ship.id, ship);
    }

    unregisterShipTiles(ship) {
        if (!ship) return;

        const keys = this.shipTileIndex.get(ship.id);
        if (!keys) return;

        for (const key of keys) {
            const occupants = this.occupiedTiles.get(key);
            if (!occupants) continue;
            occupants.delete(ship.id);
            if (occupants.size === 0) {
                this.occupiedTiles.delete(key);
            }
        }

        this.shipTileIndex.delete(ship.id);
    }

    refreshShipRegistration(ship) {
        if (!ship) return;
        this.unregisterShipTiles(ship);
        if (!ship.isDestroyed) {
            this.registerShipTiles(ship);
        }
    }

    getShipAt(x, y, excludeShip = null) {
        if (!this.isValidPosition(x, y)) return null;

        const key = this.getTileKey(x, y);
        const occupants = this.occupiedTiles.get(key);
        if (!occupants || occupants.size === 0) return null;

        for (const shipId of [...occupants]) {
            const ship = this.shipById.get(shipId);
            if (!ship) {
                occupants.delete(shipId);
                continue;
            }

            if (ship.isDestroyed) {
                this.unregisterShipTiles(ship);
                continue;
            }

            if (ship === excludeShip) continue;

            const stillOccupiesTile = ship.getOccupiedTiles().some(pos => pos.x === x && pos.y === y);
            if (!stillOccupiesTile) {
                this.refreshShipRegistration(ship);
                continue;
            }

            return ship;
        }

        if (occupants.size === 0) {
            this.occupiedTiles.delete(key);
        }

        return null;
    }

    addShip(ship) {
        if (!ship) return;
        this.ships.push(ship);
        this.shipById.set(ship.id, ship);
        this.registerShipTiles(ship);
    }

    removeShip(ship) {
        const index = this.ships.indexOf(ship);
        if (index > -1) {
            this.ships.splice(index, 1);
        }
        this.unregisterShipTiles(ship);
        if (ship) {
            this.shipById.delete(ship.id);
        }
    }

    getDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    hasLineOfSight(x1, y1, x2, y2) {
        const lineTiles = this.getLineOfSightTiles(x1, y1, x2, y2);

        for (const pos of lineTiles) {
            const tile = this.getTile(pos.x, pos.y);
            if (tile && tile.isIsland()) {
                return false;
            }
        }

        return true;
    }

    getLineOfSightTiles(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
        const steps = Math.max(1, Math.ceil(maxDelta * 2));

        const startTileX = Math.floor(x1);
        const startTileY = Math.floor(y1);
        const endTileX = Math.floor(x2);
        const endTileY = Math.floor(y2);

        const tiles = [];
        const seen = new Set();

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const sampleX = x1 + dx * t;
            const sampleY = y1 + dy * t;
            const tileX = Math.floor(sampleX);
            const tileY = Math.floor(sampleY);

            if ((tileX === startTileX && tileY === startTileY) || (tileX === endTileX && tileY === endTileY)) {
                continue;
            }

            const key = `${tileX},${tileY}`;
            if (seen.has(key)) continue;
            seen.add(key);
            tiles.push({ x: tileX, y: tileY });
        }

        return tiles;
    }
}
