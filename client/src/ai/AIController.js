import { AI_LIMITS, AI_PACING, GAME_STATES, PLAYERS } from '../../../shared/constants.js';
import { BoardingSystem } from '../combat/BoardingSystem.js';
import { CombatResolver } from '../combat/CombatResolver.js';

export class AIController {
    constructor(game, options = {}) {
        this.game = game;
        this.onUpdateUI = typeof options.onUpdateUI === 'function' ? options.onUpdateUI : null;
        this.running = false;
        this.runToken = 0;
        this.exhaustedShipIds = new Set();
    }

    destroy() {
        this.cancel();
    }

    cancel() {
        this.runToken += 1;
        this.running = false;
        this.exhaustedShipIds.clear();
        if (this.game) {
            this.game.setAITurnInProgress(false);
        }
        this.safeUpdateUI();
    }

    isActiveAIPlayerTurn() {
        return this.game
            && this.game.gameState === GAME_STATES.PLAYING
            && this.game.currentPlayer === PLAYERS.PLAYER2
            && this.game.isAIControlledPlayer(PLAYERS.PLAYER2);
    }

    async executeTurn() {
        if (this.running || !this.isActiveAIPlayerTurn()) {
            return false;
        }

        this.running = true;
        const token = ++this.runToken;
        this.exhaustedShipIds.clear();
        this.game.setAITurnInProgress(true);
        this.safeUpdateUI();

        try {
            if (!(await this.wait(AI_PACING.START_DELAY_MS, token))) return false;

            for (let step = 0; step < AI_LIMITS.MAX_TURN_STEPS; step++) {
                if (!this.isTokenActive(token) || !this.isActiveAIPlayerTurn()) {
                    break;
                }

                const acted = await this.executeSingleStep(token);
                if (!acted) {
                    break;
                }
            }
        } finally {
            const stillNeedsEndTurn = this.isTokenActive(token) && this.isActiveAIPlayerTurn();
            this.running = false;
            this.exhaustedShipIds.clear();
            this.game.setAITurnInProgress(false);
            this.safeUpdateUI();

            if (stillNeedsEndTurn) {
                await this.wait(AI_PACING.END_DELAY_MS, token);
                if (this.isTokenActive(token) && this.isActiveAIPlayerTurn()) {
                    this.game.endTurn();
                    this.safeUpdateUI();
                }
            }
        }

        return true;
    }

    async executeSingleStep(token) {
        const ship = this.chooseShipForStep();
        if (!ship) return false;

        const boarded = await this.tryBoardAction(ship, token);
        if (boarded) return true;

        const attacked = await this.tryAttackAction(ship, token);
        if (attacked) return true;

        const moved = await this.tryMoveAction(ship, token);
        if (moved) return true;

        this.exhaustedShipIds.add(ship.id);
        return this.hasAnyActionableShips();
    }

    hasAnyActionableShips() {
        return this.getActionableShips().length > 0;
    }

    getActionableShips() {
        return this.game.getShipsByOwner(PLAYERS.PLAYER2, false).filter((ship) => {
            if (!ship || ship.isDestroyed) return false;
            if (this.exhaustedShipIds.has(ship.id)) return false;
            return ship.canBoard() || ship.canAttack() || ship.canMove();
        });
    }

    chooseShipForStep() {
        const ships = this.getActionableShips();
        if (ships.length === 0) return null;

        const enemyPositions = this.getStrategicEnemyPositions();
        ships.sort((a, b) => {
            if (b.type !== a.type) return b.type - a.type;

            const aDist = this.getNearestDistanceToObjectives(a, enemyPositions);
            const bDist = this.getNearestDistanceToObjectives(b, enemyPositions);
            if (aDist !== bDist) return aDist - bDist;

            return b.currentHP - a.currentHP;
        });

        return ships[0];
    }

    getVisibleEnemyShipsForAI() {
        const enemies = this.game.getEnemyShipsFor(PLAYERS.PLAYER2, false);
        if (!this.game.fogOfWar) return enemies;
        return enemies.filter((ship) => this.game.fogOfWar.isShipVisible(ship, PLAYERS.PLAYER2));
    }

    getStrategicEnemyPositions() {
        const positions = [];
        const visibleEnemies = this.getVisibleEnemyShipsForAI();

        for (const ship of visibleEnemies) {
            const center = ship.getCenterPoint();
            positions.push({
                x: center.x,
                y: center.y,
                priority: ship.type * 10 + (ship.isFlagship ? 20 : 0)
            });
        }

        if (this.game.fogOfWar) {
            const ghosts = this.game.fogOfWar.getGhostShips(PLAYERS.PLAYER2);
            for (const ghost of ghosts) {
                positions.push({
                    x: ghost.lastX + 0.5,
                    y: ghost.lastY + 0.5,
                    priority: 5
                });
            }
        }

        return positions;
    }

    getNearestDistanceToObjectives(ship, objectives) {
        if (!objectives || objectives.length === 0) return Number.POSITIVE_INFINITY;
        const center = ship.getCenterPoint();
        let nearest = Number.POSITIVE_INFINITY;
        for (const objective of objectives) {
            const distance = this.game.map.getDistance(center.x, center.y, objective.x, objective.y);
            if (distance < nearest) nearest = distance;
        }
        return nearest;
    }

    async tryBoardAction(ship, token) {
        if (!ship.canBoard()) return false;
        if (!(await this.selectShipForAction(ship, token))) return false;
        if (!this.game.enterBoardMode()) return false;

        const targets = [...this.game.validTargets];
        if (targets.length === 0) {
            this.game.cancelActionMode();
            this.safeUpdateUI();
            return false;
        }

        const target = this.chooseBoardTarget(ship, targets);
        if (!target) {
            this.game.cancelActionMode();
            this.safeUpdateUI();
            return false;
        }

        if (!(await this.wait(AI_PACING.ACTION_DELAY_MS, token))) return false;
        const success = this.game.boardShip(target);
        this.safeUpdateUI();
        return success;
    }

    chooseBoardTarget(ship, targets) {
        let bestTarget = null;
        let bestScore = Number.NEGATIVE_INFINITY;

        for (const target of targets) {
            const breakdown = BoardingSystem.getBoardingChanceBreakdown(ship, target);
            const chance = breakdown.finalChance;
            const score = (target.type * 80) + (chance * 1.5) - (target.currentHP * 2);
            if (score > bestScore) {
                bestScore = score;
                bestTarget = target;
            }
        }

        return bestTarget;
    }

    async tryAttackAction(ship, token) {
        if (!ship.canAttack()) return false;
        if (!(await this.selectShipForAction(ship, token))) return false;
        if (!this.game.enterAttackMode()) return false;

        const targets = [...this.game.validTargets];
        if (targets.length === 0) {
            this.game.cancelActionMode();
            this.safeUpdateUI();
            return false;
        }

        const target = this.chooseAttackTarget(ship, targets);
        if (!target) {
            this.game.cancelActionMode();
            this.safeUpdateUI();
            return false;
        }

        if (!(await this.wait(AI_PACING.ACTION_DELAY_MS, token))) return false;
        const success = this.game.attackShip(target);
        this.safeUpdateUI();
        return success;
    }

    chooseAttackTarget(ship, targets) {
        let bestTarget = null;
        let bestScore = Number.NEGATIVE_INFINITY;

        for (const target of targets) {
            const attackerCenter = ship.getCenterPoint();
            const defenderCenter = target.getCenterPoint();
            const distance = this.game.map.getDistance(
                attackerCenter.x,
                attackerCenter.y,
                defenderCenter.x,
                defenderCenter.y
            );
            const hitChance = CombatResolver.getHitChanceBreakdown(ship, target, distance).finalHitChance;
            const expectedDamage = ship.cannons * (hitChance / 100);
            const killBonus = expectedDamage >= target.currentHP ? 20 : 0;
            const score = expectedDamage * 10 + (target.type * 7) + killBonus - target.currentHP;

            if (score > bestScore) {
                bestScore = score;
                bestTarget = target;
            }
        }

        return bestTarget;
    }

    async tryMoveAction(ship, token) {
        if (!ship.canMove()) return false;
        if (!(await this.selectShipForAction(ship, token))) return false;
        if (!this.game.enterMoveMode()) return false;

        const positions = [...this.game.validMovePositions];
        if (positions.length === 0) {
            this.game.cancelActionMode();
            this.safeUpdateUI();
            return false;
        }

        const targetPos = this.chooseMovePosition(ship, positions);
        if (!targetPos) {
            this.game.cancelActionMode();
            this.safeUpdateUI();
            return false;
        }

        if (!(await this.wait(AI_PACING.ACTION_DELAY_MS, token))) return false;
        const moved = this.game.moveShip(targetPos.x, targetPos.y);
        this.safeUpdateUI();
        return moved;
    }

    chooseMovePosition(ship, positions) {
        const objectives = this.getStrategicEnemyPositions();
        if (objectives.length === 0) {
            return positions[Math.floor(Math.random() * positions.length)] || null;
        }

        let bestPos = null;
        let bestScore = Number.NEGATIVE_INFINITY;

        for (const pos of positions) {
            const center = ship.getCenterPoint(pos.x, pos.y, pos.orientation || ship.orientation);
            let nearestDistance = Number.POSITIVE_INFINITY;
            let objectivePriority = 0;

            for (const objective of objectives) {
                const distance = this.game.map.getDistance(center.x, center.y, objective.x, objective.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    objectivePriority = objective.priority || 0;
                }
            }

            const score = (objectivePriority * 4) - nearestDistance;
            if (score > bestScore) {
                bestScore = score;
                bestPos = pos;
            }
        }

        return bestPos;
    }

    async selectShipForAction(ship, token) {
        if (!ship || ship.isDestroyed) return false;
        if (!this.isTokenActive(token) || !this.isActiveAIPlayerTurn()) return false;

        const selected = this.game.selectShip(ship);
        if (!selected) return false;
        this.safeUpdateUI();
        return this.wait(AI_PACING.SELECT_DELAY_MS, token);
    }

    safeUpdateUI() {
        if (this.onUpdateUI) {
            this.onUpdateUI();
        }
    }

    isTokenActive(token) {
        return this.runToken === token;
    }

    wait(ms, token) {
        if (!this.isTokenActive(token)) return Promise.resolve(false);
        return new Promise((resolve) => {
            setTimeout(() => resolve(this.isTokenActive(token)), ms);
        });
    }
}
