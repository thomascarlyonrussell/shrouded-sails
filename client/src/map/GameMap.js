import { GRID, TILE_TYPES, MAP_GENERATION } from '../../../shared/constants.js';
import { Tile } from './Tile.js';

export class GameMap {
    constructor() {
        this.width = GRID.WIDTH;
        this.height = GRID.HEIGHT;
        this.tiles = [];
        this.ships = [];

        this.initializeTiles();
        this.generateIslands();
    }

    initializeTiles() {
        // Create 2D array of water tiles
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
            // Random starting position (avoid edges and starting zones)
            const x = Math.floor(
                Math.random() * (this.width - MAP_GENERATION.EDGE_BUFFER * 2)
            ) + MAP_GENERATION.EDGE_BUFFER;

            const y = Math.floor(
                Math.random() * (this.height - MAP_GENERATION.EDGE_BUFFER * 2)
            ) + MAP_GENERATION.EDGE_BUFFER;

            // Check if position is in starting zones
            if (this.isInStartingZone(x, y)) {
                attempt++;
                continue;
            }

            // Random island size
            const size = Math.floor(
                Math.random() * (MAP_GENERATION.MAX_ISLAND_SIZE - MAP_GENERATION.MIN_ISLAND_SIZE + 1)
            ) + MAP_GENERATION.MIN_ISLAND_SIZE;

            // Try to place island tiles
            if (this.placeIslandCluster(x, y, size)) {
                return; // Successfully placed island
            }

            attempt++;
        }
    }

    placeIslandCluster(startX, startY, size) {
        const positions = [];

        // Generate random cluster shape
        positions.push({ x: startX, y: startY });

        for (let i = 1; i < size; i++) {
            // Pick a random existing tile and try to add adjacent tile
            const basePos = positions[Math.floor(Math.random() * positions.length)];
            const adjacents = this.getAdjacentPositions(basePos.x, basePos.y);

            // Shuffle adjacents
            adjacents.sort(() => Math.random() - 0.5);

            let placed = false;
            for (const adj of adjacents) {
                if (this.isValidIslandPosition(adj.x, adj.y) &&
                    !positions.some(p => p.x === adj.x && p.y === adj.y)) {
                    positions.push(adj);
                    placed = true;
                    break;
                }
            }

            if (!placed) break; // Can't expand further
        }

        // Place all tiles if we got at least 1
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

        // Player 1 zone: bottom-left
        if (x < zoneSize && y >= this.height - zoneSize) {
            return true;
        }

        // Player 2 zone: top-right
        if (x >= this.width - zoneSize && y < zoneSize) {
            return true;
        }

        return false;
    }

    isValidIslandPosition(x, y) {
        if (!this.isValidPosition(x, y)) return false;
        if (this.isInStartingZone(x, y)) return false;
        if (this.tiles[y][x].isIsland()) return false;
        return true;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getTile(x, y) {
        if (!this.isValidPosition(x, y)) return null;
        return this.tiles[y][x];
    }

    getAdjacentPositions(x, y) {
        const adjacents = [];
        const directions = [
            { dx: 0, dy: -1 },  // N
            { dx: 1, dy: 0 },   // E
            { dx: 0, dy: 1 },   // S
            { dx: -1, dy: 0 }   // W
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

    isOccupied(x, y) {
        return this.ships.some(ship => ship.x === x && ship.y === y && !ship.isDestroyed);
    }

    getShipAt(x, y) {
        return this.ships.find(ship => ship.x === x && ship.y === y && !ship.isDestroyed) || null;
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
        // Manhattan distance
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    hasLineOfSight(x1, y1, x2, y2) {
        // Use Bresenham's line algorithm to trace a line between two points
        // and check if any islands block the path

        // Get all tiles along the line (excluding start and end points)
        const lineTiles = this.getLineOfSightTiles(x1, y1, x2, y2);

        // Check if any tile along the line is an island
        for (const pos of lineTiles) {
            const tile = this.getTile(pos.x, pos.y);
            if (tile && tile.isIsland()) {
                return false; // Line of sight blocked by island
            }
        }

        // For diagonal lines, also check if islands are in the corners
        // to prevent shooting through tight diagonal gaps
        for (let i = 0; i < lineTiles.length - 1; i++) {
            const current = lineTiles[i];
            const next = lineTiles[i + 1];

            // If the line moves diagonally (both x and y change)
            if (current.x !== next.x && current.y !== next.y) {
                // Check the two tiles in the corners of this diagonal move
                const corner1 = this.getTile(current.x, next.y);
                const corner2 = this.getTile(next.x, current.y);

                // If either corner is an island, the line is blocked
                // (cannon fire can't squeeze through diagonal gaps)
                if ((corner1 && corner1.isIsland()) || (corner2 && corner2.isIsland())) {
                    return false;
                }
            }
        }

        return true; // Clear line of sight
    }

    getLineOfSightTiles(x1, y1, x2, y2) {
        // Bresenham's line algorithm to get all tiles between two points
        const tiles = [];

        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        let sx = x1 < x2 ? 1 : -1;
        let sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (true) {
            // Don't include start or end point in the check
            if ((x !== x1 || y !== y1) && (x !== x2 || y !== y2)) {
                tiles.push({ x, y });
            }

            // Reached the end
            if (x === x2 && y === y2) {
                break;
            }

            let e2 = 2 * err;

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
