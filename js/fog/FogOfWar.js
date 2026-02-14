export class FogOfWar {
    constructor(game) {
        this.game = game;
        this.lastKnownPositions = new Map(); // shipId -> {x, y, ship}
    }

    calculateVisionCoverage(playerOwner) {
        const visibleTiles = new Set();
        const fleet = this.game.fleets[playerOwner];

        if (!fleet) return visibleTiles;

        const ships = fleet.ships;

        for (const ship of ships) {
            if (ship.isDestroyed) continue;

            const visionRange = ship.getVisionRange();

            // Use Manhattan distance to calculate vision coverage
            for (let dx = -visionRange; dx <= visionRange; dx++) {
                for (let dy = -visionRange; dy <= visionRange; dy++) {
                    const distance = Math.abs(dx) + Math.abs(dy);

                    if (distance <= visionRange) {
                        const tileX = ship.x + dx;
                        const tileY = ship.y + dy;

                        // Check if position is valid on map
                        if (this.game.map.isValidPosition(tileX, tileY)) {
                            // Check line of sight - islands block vision
                            if (this.game.map.hasLineOfSight(ship.x, ship.y, tileX, tileY)) {
                                visibleTiles.add(`${tileX},${tileY}`);
                            }
                        }
                    }
                }
            }
        }

        return visibleTiles;
    }

    isShipVisible(ship, viewingPlayer) {
        // Friendly ships are always visible to their owner
        if (ship.owner === viewingPlayer) {
            return true;
        }

        // Enemy ships - check if within vision range of any friendly ship
        const friendlyFleet = this.game.fleets[viewingPlayer];
        if (!friendlyFleet) return false;

        const friendlyShips = friendlyFleet.ships;

        for (const friendlyShip of friendlyShips) {
            if (friendlyShip.isDestroyed) continue;

            const visionRange = friendlyShip.getVisionRange();
            const distance = Math.abs(friendlyShip.x - ship.x) + Math.abs(friendlyShip.y - ship.y);

            if (distance <= visionRange) {
                // Check line of sight
                if (this.game.map.hasLineOfSight(friendlyShip.x, friendlyShip.y, ship.x, ship.y)) {
                    return true;
                }
            }
        }

        return false;
    }

    isPositionVisible(x, y, viewingPlayer) {
        const visibleTiles = this.calculateVisionCoverage(viewingPlayer);
        return visibleTiles.has(`${x},${y}`);
    }

    updateLastKnownPositions(viewingPlayer) {
        // Get all enemy ships
        const enemyPlayer = viewingPlayer === 'player1' ? 'player2' : 'player1';
        const enemyFleet = this.game.fleets[enemyPlayer];

        if (!enemyFleet) return;

        const enemyShips = enemyFleet.ships;

        for (const enemyShip of enemyShips) {
            if (enemyShip.isDestroyed) {
                // Don't track destroyed ships
                continue;
            }

            // Check if this enemy ship is currently visible
            if (this.isShipVisible(enemyShip, viewingPlayer)) {
                // Update last known position
                this.lastKnownPositions.set(enemyShip.id, {
                    x: enemyShip.x,
                    y: enemyShip.y,
                    ship: enemyShip
                });
            }
        }
    }

    getGhostShips(viewingPlayer) {
        const ghostShips = [];

        for (const [shipId, lastKnown] of this.lastKnownPositions.entries()) {
            const ship = lastKnown.ship;

            // Skip if ship is destroyed
            if (ship.isDestroyed) {
                continue;
            }

            // Check if ship is currently visible
            if (!this.isShipVisible(ship, viewingPlayer)) {
                // Ship is not visible, so it's a ghost
                ghostShips.push({
                    ship: ship,
                    lastX: lastKnown.x,
                    lastY: lastKnown.y
                });
            }
        }

        return ghostShips;
    }

    clearGhostShip(shipId) {
        this.lastKnownPositions.delete(shipId);
    }
}
