export class FogOfWar {
    constructor(game) {
        this.game = game;
        this.lastKnownPositionsByPlayer = new Map();
    }

    getPlayerGhostMap(viewingPlayer) {
        if (!this.lastKnownPositionsByPlayer.has(viewingPlayer)) {
            this.lastKnownPositionsByPlayer.set(viewingPlayer, new Map());
        }
        return this.lastKnownPositionsByPlayer.get(viewingPlayer);
    }

    calculateVisionCoverage(playerOwner) {
        const visibleTiles = new Set();
        const ships = this.game.getShipsByOwner(playerOwner, false);

        for (const ship of ships) {
            if (ship.isDestroyed) continue;

            const center = ship.getCenterPoint();
            const visionRange = ship.getVisionRange();

            for (let dx = -visionRange; dx <= visionRange; dx++) {
                for (let dy = -visionRange; dy <= visionRange; dy++) {
                    const distance = Math.abs(dx) + Math.abs(dy);
                    if (distance > visionRange) continue;

                    const tileX = Math.floor(center.x + dx);
                    const tileY = Math.floor(center.y + dy);

                    if (this.game.map.isValidPosition(tileX, tileY)) {
                        if (this.game.map.hasLineOfSight(center.x, center.y, tileX, tileY)) {
                            visibleTiles.add(`${tileX},${tileY}`);
                        }
                    }
                }
            }
        }

        return visibleTiles;
    }

    isShipVisible(ship, viewingPlayer) {
        if (ship.owner === viewingPlayer) return true;

        const friendlyShips = this.game.getShipsByOwner(viewingPlayer, false);
        const enemyCenter = ship.getCenterPoint();

        for (const friendlyShip of friendlyShips) {
            if (friendlyShip.isDestroyed) continue;

            const friendlyCenter = friendlyShip.getCenterPoint();
            const visionRange = friendlyShip.getVisionRange();
            const distance = Math.abs(friendlyCenter.x - enemyCenter.x) + Math.abs(friendlyCenter.y - enemyCenter.y);

            if (distance <= visionRange) {
                if (this.game.map.hasLineOfSight(friendlyCenter.x, friendlyCenter.y, enemyCenter.x, enemyCenter.y)) {
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
        const playerGhostMap = this.getPlayerGhostMap(viewingPlayer);
        const enemyShips = this.game.getEnemyShipsFor(viewingPlayer, false);

        for (const enemyShip of enemyShips) {
            if (enemyShip.isDestroyed) continue;

            if (this.isShipVisible(enemyShip, viewingPlayer)) {
                playerGhostMap.set(enemyShip.id, {
                    x: enemyShip.x,
                    y: enemyShip.y,
                    ship: enemyShip,
                    type: enemyShip.type,
                    orientation: enemyShip.orientation
                });
            }
        }
    }

    getGhostShips(viewingPlayer) {
        const ghostShips = [];
        const playerGhostMap = this.getPlayerGhostMap(viewingPlayer);

        for (const [, lastKnown] of playerGhostMap.entries()) {
            const ship = lastKnown.ship;
            if (ship.isDestroyed || ship.owner === viewingPlayer) continue;

            if (!this.isShipVisible(ship, viewingPlayer)) {
                ghostShips.push({
                    ship,
                    lastX: lastKnown.x,
                    lastY: lastKnown.y,
                    type: lastKnown.type,
                    orientation: lastKnown.orientation
                });
            }
        }

        return ghostShips;
    }

    clearGhostShip(shipId) {
        for (const ghostMap of this.lastKnownPositionsByPlayer.values()) {
            ghostMap.delete(shipId);
        }
    }
}
