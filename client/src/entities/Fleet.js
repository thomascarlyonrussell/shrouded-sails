import { FLEET_COMPOSITION, MAP_GENERATION } from '../../../shared/constants.js';
import { Ship } from './Ship.js';

export class Fleet {
    constructor(owner, gameMap) {
        this.owner = owner;
        this.ships = [];
        this.deployShips(gameMap);
    }

    deployShips(gameMap) {
        const startingPositions = this.getStartingPositions(gameMap);
        let posIndex = 0;

        // Create ships based on fleet composition
        for (const shipSpec of FLEET_COMPOSITION) {
            for (let i = 0; i < shipSpec.count; i++) {
                if (posIndex < startingPositions.length) {
                    const pos = startingPositions[posIndex];
                    const ship = new Ship(shipSpec.type, this.owner, pos.x, pos.y);
                    this.ships.push(ship);
                    gameMap.addShip(ship);
                    posIndex++;
                }
            }
        }
    }

    getStartingPositions(gameMap) {
        const positions = [];
        const zoneSize = MAP_GENERATION.STARTING_ZONE_SIZE;
        const edgeBuffer = 1; // Small buffer to avoid exact edge (prevents wind from blowing ships off immediately)

        if (this.owner === 'player1') {
            // Left side - randomly choose top or bottom
            const useTopLeft = Math.random() < 0.5;

            let startY, endY;
            if (useTopLeft) {
                // Top-left corner
                startY = edgeBuffer;
                endY = zoneSize + edgeBuffer;
                console.log('Player 1 starting in TOP-LEFT corner');
            } else {
                // Bottom-left corner
                startY = gameMap.height - zoneSize - edgeBuffer;
                endY = gameMap.height - edgeBuffer;
                console.log('Player 1 starting in BOTTOM-LEFT corner');
            }

            const startX = edgeBuffer;
            const endX = zoneSize + edgeBuffer;

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (y >= 0 && y < gameMap.height && x >= 0 && x < gameMap.width) {
                        const tile = gameMap.getTile(x, y);
                        if (tile.isWater() && !gameMap.isOccupied(x, y)) {
                            positions.push({ x, y });
                        }
                    }
                }
            }
        } else {
            // Right side - randomly choose top or bottom (player2)
            const useTopRight = Math.random() < 0.5;

            let startY, endY;
            if (useTopRight) {
                // Top-right corner
                startY = edgeBuffer;
                endY = zoneSize + edgeBuffer;
                console.log('Player 2 starting in TOP-RIGHT corner');
            } else {
                // Bottom-right corner
                startY = gameMap.height - zoneSize - edgeBuffer;
                endY = gameMap.height - edgeBuffer;
                console.log('Player 2 starting in BOTTOM-RIGHT corner');
            }

            const startX = gameMap.width - zoneSize - edgeBuffer;
            const endX = gameMap.width - edgeBuffer;

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (y >= 0 && y < gameMap.height && x >= 0 && x < gameMap.width) {
                        const tile = gameMap.getTile(x, y);
                        if (tile.isWater() && !gameMap.isOccupied(x, y)) {
                            positions.push({ x, y });
                        }
                    }
                }
            }
        }

        // Shuffle positions for variety
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
            if (!ship.isDestroyed) {
                ship.resetTurn();
            }
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
