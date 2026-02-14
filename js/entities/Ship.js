import { SHIP_TYPES } from '../utils/Constants.js';

export class Ship {
    constructor(type, owner, x, y) {
        this.id = this.generateId();
        this.type = type;
        this.owner = owner;
        this.x = x;
        this.y = y;

        // Get stats from ship type
        const stats = SHIP_TYPES[type];
        this.name = stats.name;
        this.maxHP = stats.maxHP;
        this.currentHP = this.maxHP;
        this.maxMovement = stats.movement;
        this.remainingMovement = this.maxMovement;
        this.cannons = stats.cannons;
        this.range = stats.range;

        // Action flags
        this.hasFired = false;
        this.hasMoved = false;
        this.isDestroyed = false;
        this.isCaptured = false;
        this.isFlagship = (type === 3);

        // Visual
        this.facing = 0; // 0-7 for wind directions, will be set based on movement
    }

    generateId() {
        return `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    resetTurn() {
        this.remainingMovement = this.maxMovement;
        this.hasFired = false;
        this.hasMoved = false;
    }

    takeDamage(amount) {
        this.currentHP -= amount;
        if (this.currentHP <= 0) {
            this.currentHP = 0;
            this.isDestroyed = true;
        }
    }

    heal(amount) {
        this.currentHP = Math.min(this.currentHP + amount, this.maxHP);
    }

    canMove() {
        return !this.isDestroyed && this.remainingMovement > 0;
    }

    isMovementExhausted() {
        return this.remainingMovement === 0;
    }

    canAttack() {
        return !this.isDestroyed && !this.hasFired;
    }

    canBoard() {
        return !this.isDestroyed && !this.hasFired;
    }

    isDone() {
        return !this.canMove() && !this.canAttack() && !this.canBoard();
    }

    getVisionRange() {
        const stats = SHIP_TYPES[this.type];
        return stats.vision;
    }

    moveTo(x, y) {
        const distance = Math.abs(this.x - x) + Math.abs(this.y - y);
        if (distance <= this.remainingMovement) {
            this.x = x;
            this.y = y;
            this.remainingMovement -= distance;
            this.hasMoved = true;
            return true;
        }
        return false;
    }

    getValidMovePositions(gameMap, game = null) {
        // Use BFS (Breadth-First Search) to find all reachable positions
        // This ensures ships can't move through islands
        const positions = [];
        const maxDist = this.remainingMovement;
        const visited = new Set();
        const queue = [{ x: this.x, y: this.y, dist: 0 }];

        visited.add(`${this.x},${this.y}`);

        while (queue.length > 0) {
            const current = queue.shift();

            // Check all 4 adjacent positions (N, E, S, W)
            const neighbors = [
                { x: current.x, y: current.y - 1 },  // North
                { x: current.x + 1, y: current.y },  // East
                { x: current.x, y: current.y + 1 },  // South
                { x: current.x - 1, y: current.y }   // West
            ];

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;

                // Skip if already visited
                if (visited.has(key)) continue;

                // Skip if out of bounds
                if (!gameMap.isValidPosition(neighbor.x, neighbor.y)) continue;

                // Skip if it's an island
                const tile = gameMap.getTile(neighbor.x, neighbor.y);
                if (tile.isIsland()) continue;

                // Check if tile is occupied - but with fog of war consideration
                const occupyingShip = gameMap.getShipAt(neighbor.x, neighbor.y);
                if (occupyingShip) {
                    // Always block friendly ships
                    if (occupyingShip.owner === this.owner) continue;

                    // For enemy ships: only block if visible (fog of war enabled)
                    if (game && game.fogOfWar) {
                        const isVisible = game.fogOfWar.isShipVisible(occupyingShip, this.owner);
                        console.log(`[FOG] Enemy ship at (${neighbor.x},${neighbor.y}): visible=${isVisible}`);
                        // Only block if the enemy ship is visible
                        if (isVisible) {
                            console.log(`[FOG] Blocking visible enemy ship at (${neighbor.x},${neighbor.y})`);
                            continue;
                        }
                        // If not visible, allow movement (collision will be handled later)
                        console.log(`[FOG] Allowing move to unseen enemy at (${neighbor.x},${neighbor.y})`);
                    } else {
                        // No fog of war - block all enemy ships
                        continue;
                    }
                }

                // Calculate distance from start
                const newDist = current.dist + 1;

                // Skip if beyond movement range
                if (newDist > maxDist) continue;

                // Mark as visited
                visited.add(key);

                // Add to valid positions (exclude starting position)
                if (neighbor.x !== this.x || neighbor.y !== this.y) {
                    positions.push({ x: neighbor.x, y: neighbor.y });
                }

                // Add to queue for further exploration
                queue.push({ x: neighbor.x, y: neighbor.y, dist: newDist });
            }
        }

        return positions;
    }

    getAttackableTargets(gameMap, enemyShips, fogOfWar = null, viewingPlayer = null) {
        const targets = [];

        for (const enemy of enemyShips) {
            if (enemy.isDestroyed) continue;

            // Check visibility with fog of war
            if (fogOfWar && viewingPlayer) {
                if (!fogOfWar.isShipVisible(enemy, viewingPlayer)) {
                    continue; // Can't target ships outside vision
                }
            }

            const distance = gameMap.getDistance(this.x, this.y, enemy.x, enemy.y);
            if (distance >= 1 && distance <= this.range) {
                // Check line of sight - can't shoot through islands
                if (gameMap.hasLineOfSight(this.x, this.y, enemy.x, enemy.y)) {
                    targets.push(enemy);
                }
            }
        }

        return targets;
    }

    getBoardableTargets(gameMap, enemyShips, fogOfWar = null, viewingPlayer = null) {
        const targets = [];

        for (const enemy of enemyShips) {
            if (enemy.isDestroyed) continue;

            // Check visibility with fog of war
            if (fogOfWar && viewingPlayer) {
                if (!fogOfWar.isShipVisible(enemy, viewingPlayer)) {
                    continue; // Can't target ships outside vision
                }
            }

            // Ships can only board vessels of a lower level
            if (this.type <= enemy.type) continue;

            const distance = gameMap.getDistance(this.x, this.y, enemy.x, enemy.y);
            if (distance === 1) {
                targets.push(enemy);
            }
        }

        return targets;
    }

    getStatusText() {
        const destroyedText = this.isDestroyed ? ' [SUNK]' : '';
        const capturedText = this.isCaptured ? ' [CAPTURED]' : '';
        return `${this.name} (${this.currentHP}/${this.maxHP} HP, ${this.remainingMovement}/${this.maxMovement} Move, ${this.cannons} Cannons)${destroyedText}${capturedText}`;
    }
}
