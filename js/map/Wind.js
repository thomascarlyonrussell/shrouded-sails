import { WIND_DIRECTIONS } from '../utils/Constants.js';

export class Wind {
    constructor() {
        this.directionIndex = this.randomDirectionIndex();
        this.strength = Math.floor(Math.random() * 2); // 0-1 (reduced for playability)
        this.turnsUntilChange = this.randomChangeInterval();
    }

    randomDirectionIndex() {
        return Math.floor(Math.random() * WIND_DIRECTIONS.length);
    }

    randomChangeInterval() {
        return Math.floor(Math.random() * 3) + 3; // 3-5 turns
    }

    getDirection() {
        return WIND_DIRECTIONS[this.directionIndex];
    }

    getDirectionName() {
        return this.getDirection().name;
    }

    getDirectionArrow() {
        return this.getDirection().arrow;
    }

    getDirectionVector() {
        const dir = this.getDirection();
        return { dx: dir.dx, dy: dir.dy };
    }

    update() {
        this.turnsUntilChange--;

        if (this.turnsUntilChange <= 0) {
            this.changeWind();
        }
    }

    changeWind() {
        const oldDirection = this.getDirectionName();
        const oldStrength = this.strength;

        // Change direction (could be same)
        this.directionIndex = this.randomDirectionIndex();

        // Change strength (0-1 for playability)
        this.strength = Math.floor(Math.random() * 2);

        // Reset timer
        this.turnsUntilChange = this.randomChangeInterval();

        console.log(`Wind changed from ${oldDirection} (${oldStrength}) to ${this.getDirectionName()} (${this.strength})`);

        return {
            oldDirection,
            oldStrength,
            newDirection: this.getDirectionName(),
            newStrength: this.strength
        };
    }

    applyWindToShips(ships, gameMap) {
        if (this.strength === 0) {
            console.log('Wind is calm, no drift');
            return [];
        }

        const results = [];
        const vector = this.getDirectionVector();

        console.log(`Applying wind: ${this.getDirectionName()} strength ${this.strength}`);

        for (const ship of ships) {
            if (ship.isDestroyed) continue;

            const oldX = ship.x;
            const oldY = ship.y;

            // Calculate new position
            let newX = ship.x + (vector.dx * this.strength);
            let newY = ship.y + (vector.dy * this.strength);

            // Clamp to map boundaries instead of destroying ship
            newX = Math.max(0, Math.min(gameMap.width - 1, newX));
            newY = Math.max(0, Math.min(gameMap.height - 1, newY));

            // If clamped to edge, ship stays at edge (no destruction)
            if (!gameMap.isValidPosition(newX, newY)) {
                // Should never happen due to clamping, but keep as safeguard
                results.push({
                    ship: ship,
                    type: 'blocked',
                    oldPos: { x: oldX, y: oldY },
                    newPos: { x: oldX, y: oldY }
                });
                continue;
            }

            // Check if hit island
            const targetTile = gameMap.getTile(newX, newY);
            if (targetTile.isIsland()) {
                // Ship takes 1 damage and stays in place
                ship.takeDamage(1);
                results.push({
                    ship: ship,
                    type: 'island-collision',
                    oldPos: { x: oldX, y: oldY },
                    newPos: { x: oldX, y: oldY },
                    damage: 1
                });
                console.log(`${ship.name} crashed into island! (-1 HP)`);
                continue;
            }

            // Check if position is occupied by another ship
            if (gameMap.isOccupied(newX, newY)) {
                // Try adjacent positions
                const alternatePositions = this.findNearbyWaterTile(newX, newY, gameMap);
                if (alternatePositions) {
                    newX = alternatePositions.x;
                    newY = alternatePositions.y;
                } else {
                    // No valid position, ship stays in place
                    results.push({
                        ship: ship,
                        type: 'blocked',
                        oldPos: { x: oldX, y: oldY },
                        newPos: { x: oldX, y: oldY }
                    });
                    console.log(`${ship.name} blocked by another ship`);
                    continue;
                }
            }

            // Move ship to new position
            ship.x = newX;
            ship.y = newY;

            results.push({
                ship: ship,
                type: 'moved',
                oldPos: { x: oldX, y: oldY },
                newPos: { x: newX, y: newY }
            });
        }

        return results;
    }

    findNearbyWaterTile(x, y, gameMap) {
        // Check adjacent tiles for valid water position
        const adjacents = [
            { x: x + 1, y: y },
            { x: x - 1, y: y },
            { x: x, y: y + 1 },
            { x: x, y: y - 1 },
            { x: x + 1, y: y + 1 },
            { x: x + 1, y: y - 1 },
            { x: x - 1, y: y + 1 },
            { x: x - 1, y: y - 1 }
        ];

        for (const pos of adjacents) {
            if (!gameMap.isValidPosition(pos.x, pos.y)) continue;
            const tile = gameMap.getTile(pos.x, pos.y);
            if (tile.isWater() && !gameMap.isOccupied(pos.x, pos.y)) {
                return pos;
            }
        }

        return null;
    }
}
