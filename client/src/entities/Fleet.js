import { FLEET_COMPOSITION, MAP_GENERATION, SHIP_TYPES } from '../../../shared/constants.js';
import { Ship } from './Ship.js';

export class Fleet {
    constructor(owner, gameMap) {
        this.owner = owner;
        this.ships = [];
        this.deployShips(gameMap);
    }

    deployShips(gameMap) {
        const startingPositions = this.getStartingPositions(gameMap);

        for (const shipSpec of FLEET_COMPOSITION) {
            for (let i = 0; i < shipSpec.count; i++) {
                const shipType = SHIP_TYPES[shipSpec.type];
                const orientation = shipSpec.type === 2 ? 'horizontal' : 'horizontal';
                const candidateIndex = startingPositions.findIndex(pos => {
                    return this.canPlaceShipAtPosition(
                        gameMap,
                        pos,
                        shipType.footprint,
                        orientation
                    );
                });

                if (candidateIndex === -1) continue;

                const pos = startingPositions.splice(candidateIndex, 1)[0];
                const ship = new Ship(shipSpec.type, this.owner, pos.x, pos.y, orientation);
                this.ships.push(ship);
                gameMap.addShip(ship);
            }
        }
    }

    canPlaceShipAtPosition(gameMap, pos, footprint = { width: 1, height: 1 }, orientation = 'horizontal') {
        const orientedFootprint = gameMap.getOrientedFootprint(footprint, orientation);

        if (gameMap.layout === 'landscape' && this.owner === 'player2') {
            const maxX = gameMap.width - MAP_GENERATION.EDGE_BUFFER - orientedFootprint.width;
            if (pos.x > maxX) return false;
        }

        if (gameMap.layout === 'portrait' && this.owner === 'player2') {
            const maxY = gameMap.height - MAP_GENERATION.EDGE_BUFFER - orientedFootprint.height;
            if (pos.y > maxY) return false;
        }

        const check = gameMap.isFootprintClear(
            pos.x,
            pos.y,
            footprint,
            orientation,
            null
        );

        return check.clear && gameMap.isFootprintInStartingZone(
            pos.x,
            pos.y,
            footprint,
            orientation
        );
    }

    getStartingPositions(gameMap) {
        const positions = [];
        const zoneSize = MAP_GENERATION.STARTING_ZONE_SIZE;
        const edgeBuffer = MAP_GENERATION.EDGE_BUFFER;

        if (gameMap.layout === 'portrait') {
            const startY = this.owner === 'player1' ? edgeBuffer : gameMap.height - zoneSize - edgeBuffer;
            const endY = this.owner === 'player1' ? zoneSize + edgeBuffer : gameMap.height - edgeBuffer;
            const startX = edgeBuffer;
            const endX = gameMap.width - edgeBuffer;

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (y >= 0 && y < gameMap.height && x >= 0 && x < gameMap.width) {
                        const tile = gameMap.getTile(x, y);
                        if (tile.isWater() && !gameMap.isOccupied(x, y)) positions.push({ x, y });
                    }
                }
            }
        } else if (this.owner === 'player1') {
            const startX = edgeBuffer;
            const endX = zoneSize + edgeBuffer;

            for (let y = edgeBuffer; y < gameMap.height - edgeBuffer; y++) {
                for (let x = startX; x < endX; x++) {
                    const tile = gameMap.getTile(x, y);
                    if (tile && tile.isWater() && !gameMap.isOccupied(x, y)) positions.push({ x, y });
                }
            }
        } else {
            const startX = gameMap.width - zoneSize - edgeBuffer;
            const endX = gameMap.width - edgeBuffer;

            for (let y = edgeBuffer; y < gameMap.height - edgeBuffer; y++) {
                for (let x = startX; x < endX; x++) {
                    const tile = gameMap.getTile(x, y);
                    if (tile && tile.isWater() && !gameMap.isOccupied(x, y)) positions.push({ x, y });
                }
            }
        }

        positions.sort(() => Math.random() - 0.5);
        return positions;
    }

    getActiveShips() {
        return this.ships.filter(ship => !ship.isDestroyed);
    }

    hasShipsRemaining() {
        return this.getActiveShips().length > 0;
    }

    getFlagship() {
        return this.ships.find(ship => ship.isFlagship && !ship.isDestroyed);
    }

    resetAllShips() {
        for (const ship of this.ships) {
            if (!ship.isDestroyed) ship.resetTurn();
        }
    }

    getShipCount() {
        return {
            total: this.ships.length,
            active: this.getActiveShips().length,
            destroyed: this.ships.filter(s => s.isDestroyed).length
        };
    }
}
