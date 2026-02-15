import { WIND_DIRECTIONS } from '../../../shared/constants.js';

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
            const orientedFootprint = gameMap.getOrientedFootprint(ship.footprint, ship.orientation);

            // Calculate new position
            let newX = ship.x + (vector.dx * this.strength);
            let newY = ship.y + (vector.dy * this.strength);

            // Clamp to map boundaries using full footprint dimensions.
            newX = Math.max(0, Math.min(gameMap.width - orientedFootprint.width, newX));
            newY = Math.max(0, Math.min(gameMap.height - orientedFootprint.height, newY));

            // Check if footprint hits island tiles
            if (this.footprintHitsIsland(ship, newX, newY, gameMap)) {
                // Ship takes 1 damage and stays in place
                ship.takeDamage(1);
                if (ship.isDestroyed) {
                    gameMap.refreshShipRegistration(ship);
                }
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

            // Check if footprint collides with another ship
            if (!this.isFootprintClearForShip(ship, newX, newY, gameMap)) {
                // Try adjacent positions
                const alternatePositions = this.findNearbyWaterTile(newX, newY, ship, gameMap);
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
            gameMap.refreshShipRegistration(ship);

            results.push({
                ship: ship,
                type: 'moved',
                oldPos: { x: oldX, y: oldY },
                newPos: { x: newX, y: newY }
            });
        }

        return results;
    }

    footprintHitsIsland(ship, x, y, gameMap) {
        const footprintTiles = ship.getOccupiedTiles(x, y, ship.orientation);
        return footprintTiles.some(tilePos => {
            const tile = gameMap.getTile(tilePos.x, tilePos.y);
            return !tile || tile.isIsland();
        });
    }

    isFootprintClearForShip(ship, x, y, gameMap) {
        const placement = gameMap.isFootprintClear(
            x,
            y,
            ship.footprint,
            ship.orientation,
            ship
        );
        return placement.clear;
    }

    findNearbyWaterTile(x, y, ship, gameMap) {
        // Check nearby tiles for a valid full-footprint position.
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
            if (!this.isFootprintClearForShip(ship, pos.x, pos.y, gameMap)) continue;
            if (this.footprintHitsIsland(ship, pos.x, pos.y, gameMap)) continue;
            if (gameMap.isValidPosition(pos.x, pos.y, gameMap.getOrientedFootprint(ship.footprint, ship.orientation))) {
                return pos;
            }
        }

        return null;
    }
}
