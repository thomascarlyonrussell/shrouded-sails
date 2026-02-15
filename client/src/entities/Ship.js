import { SHIP_TYPES } from '../../../shared/constants.js';

export class Ship {
    constructor(type, owner, x, y, orientation = 'horizontal') {
        this.id = this.generateId();
        this.type = type;
        this.owner = owner;
        this.originalOwner = owner;
        this.x = x;
        this.y = y;
        this.orientation = orientation;

        // Get stats from ship type
        const stats = SHIP_TYPES[type];
        this.name = stats.name;
        this.maxHP = stats.maxHP;
        this.currentHP = this.maxHP;
        this.maxMovement = stats.movement;
        this.remainingMovement = this.maxMovement;
        this.cannons = stats.cannons;
        this.range = stats.range;
        this.footprint = stats.footprint || { width: 1, height: 1 };

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

    updateCaptureState() {
        this.isCaptured = this.owner !== this.originalOwner;
    }

    transferOwnership(newOwner) {
        this.owner = newOwner;
        this.updateCaptureState();
    }

    isDone() {
        return !this.canMove() && !this.canAttack() && !this.canBoard();
    }

    getVisionRange() {
        if (this.isCaptured) {
            return 1;
        }
        const stats = SHIP_TYPES[this.type];
        return stats.vision;
    }

    moveTo(x, y) {
        const distance = Math.abs(this.x - x) + Math.abs(this.y - y);
        if (distance <= this.remainingMovement) {
            const dx = x - this.x;
            const dy = y - this.y;
            if (this.type === 2) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.orientation = 'horizontal';
                } else if (Math.abs(dy) > Math.abs(dx)) {
                    this.orientation = 'vertical';
                }
            }
            this.x = x;
            this.y = y;
            this.remainingMovement -= distance;
            this.hasMoved = true;
            return true;
        }
        return false;
    }

    getOccupiedTiles(anchorX = this.x, anchorY = this.y, orientation = this.orientation) {
        const occupied = [];
        const baseFootprint = this.footprint || { width: 1, height: 1 };
        const orientedFootprint = this.type === 2 && orientation === 'vertical'
            ? { width: baseFootprint.height, height: baseFootprint.width }
            : baseFootprint;

        for (let y = 0; y < orientedFootprint.height; y++) {
            for (let x = 0; x < orientedFootprint.width; x++) {
                occupied.push({ x: anchorX + x, y: anchorY + y });
            }
        }

        return occupied;
    }

    getCenterPoint(anchorX = this.x, anchorY = this.y, orientation = this.orientation) {
        const occupied = this.getOccupiedTiles(anchorX, anchorY, orientation);
        const xValues = occupied.map(pos => pos.x);
        const yValues = occupied.map(pos => pos.y);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);

        return {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2
        };
    }

    getValidMovePositions(gameMap, game = null) {
        // Use BFS (Breadth-First Search) to find all reachable positions
        // This ensures ships can't move through islands
        const positions = [];
        const maxDist = this.remainingMovement;
        const visited = new Set();
        const queue = [{ x: this.x, y: this.y, dist: 0, orientation: this.orientation }];

        visited.add(`${this.x},${this.y},${this.orientation}`);

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
                let nextOrientation = current.orientation;
                if (this.type === 2) {
                    if (neighbor.x !== current.x) nextOrientation = 'horizontal';
                    else if (neighbor.y !== current.y) nextOrientation = 'vertical';
                }

                const key = `${neighbor.x},${neighbor.y},${nextOrientation}`;

                // Skip if already visited
                if (visited.has(key)) continue;

                // Skip if out of bounds
                const footprintCheck = gameMap.isFootprintClear(
                    neighbor.x,
                    neighbor.y,
                    this.footprint,
                    nextOrientation,
                    this,
                    game,
                    this.owner
                );
                if (!footprintCheck.clear) continue;

                // Calculate distance from start
                const newDist = current.dist + 1;

                // Skip if beyond movement range
                if (newDist > maxDist) continue;

                // Mark as visited
                visited.add(key);

                // Add to valid positions (exclude starting position)
                if (neighbor.x !== this.x || neighbor.y !== this.y) {
                    positions.push({ x: neighbor.x, y: neighbor.y, orientation: nextOrientation });
                }

                // Add to queue for further exploration
                queue.push({ x: neighbor.x, y: neighbor.y, dist: newDist, orientation: nextOrientation });
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

            const attackerCenter = this.getCenterPoint();
            const targetCenter = enemy.getCenterPoint();
            const distance = gameMap.getDistance(attackerCenter.x, attackerCenter.y, targetCenter.x, targetCenter.y);
            if (distance >= 1 && distance <= this.range) {
                // Check line of sight - can't shoot through islands
                if (gameMap.hasLineOfSight(attackerCenter.x, attackerCenter.y, targetCenter.x, targetCenter.y)) {
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

            const sourceTiles = this.getOccupiedTiles();
            const targetTiles = enemy.getOccupiedTiles();
            let minDistance = Infinity;

            for (const source of sourceTiles) {
                for (const target of targetTiles) {
                    const distance = gameMap.getDistance(source.x, source.y, target.x, target.y);
                    minDistance = Math.min(minDistance, distance);
                }
            }

            if (minDistance === 1) {
                targets.push(enemy);
            }
        }

        return targets;
    }

    getStatusText() {
        const destroyedText = this.isDestroyed ? ' [SUNK]' : '';
        const capturedText = this.isCaptured ? ' [CAPTURED]' : '';
        const captureContextText = this.isCaptured
            ? ` Captured from ${this.originalOwner}`
            : '';
        return `${this.name} (${this.currentHP}/${this.maxHP} HP, ${this.remainingMovement}/${this.maxMovement} Move, ${this.cannons} Cannons)${destroyedText}${capturedText}${captureContextText}`;
    }
}
