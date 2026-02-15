import { PLAYERS, GAME_STATES, ACTION_MODES } from '../../../shared/constants.js';
import { GameMap } from '../map/GameMap.js';
import { Fleet } from '../entities/Fleet.js';
import { Wind } from '../map/Wind.js';
import { TurnManager } from './TurnManager.js';
import { CombatResolver } from '../combat/CombatResolver.js';
import { BoardingSystem } from '../combat/BoardingSystem.js';
import { HUD } from '../ui/HUD.js';
import { FogOfWar } from '../fog/FogOfWar.js';

export class Game {
    constructor(boardLayout = 'landscape') {
        this.gameState = GAME_STATES.SETUP;
        this.map = null;
        this.boardLayout = boardLayout;
        this.fleets = {};
        this.currentPlayer = PLAYERS.PLAYER1;
        this.turnNumber = 1;
        this.wind = null;
        this.turnManager = null;
        this.hud = new HUD();
        this.fogOfWar = null;
        this.fogEnabled = true; // Default to enabled
        this.combatEventHandler = null;
        this.audioManager = null;
        this.endTurnTransitionHandler = null;

        // UI state
        this.selectedShip = null;
        this.actionMode = ACTION_MODES.NONE;
        this.validMovePositions = [];
        this.validTargets = [];
        this.movementPreview = null;
    }

    setCombatEventHandler(handler) {
        this.combatEventHandler = handler;
    }

    setAudioManager(audioManager) {
        this.audioManager = audioManager;
        if (this.hud && typeof this.hud.setAudioManager === 'function') {
            this.hud.setAudioManager(audioManager);
        }
    }

    setEndTurnTransitionHandler(handler) {
        this.endTurnTransitionHandler = handler;
    }

    notifyEndTurnTransition(nextPlayer) {
        if (typeof this.endTurnTransitionHandler !== 'function') return;

        this.endTurnTransitionHandler({
            currentPlayer: this.currentPlayer,
            nextPlayer,
            turnNumber: this.turnNumber
        });
    }

    initialize() {
        console.log('Initializing game...');

        // Create map
        this.map = new GameMap(this.boardLayout);

        // Create wind system
        this.wind = new Wind();
        console.log(`Wind: ${this.wind.getDirectionName()} (${this.wind.strength})`);

        // Create fleets for both players
        this.fleets[PLAYERS.PLAYER1] = new Fleet(PLAYERS.PLAYER1, this.map);
        this.fleets[PLAYERS.PLAYER2] = new Fleet(PLAYERS.PLAYER2, this.map);

        console.log(`Player 1 fleet: ${this.fleets[PLAYERS.PLAYER1].ships.length} ships`);
        console.log(`Player 2 fleet: ${this.fleets[PLAYERS.PLAYER2].ships.length} ships`);

        // Create turn manager
        this.turnManager = new TurnManager(this);

        // Create fog of war system if enabled
        if (this.fogEnabled) {
            this.fogOfWar = new FogOfWar(this);
            console.log('Fog of War: Enabled');
        } else {
            console.log('Fog of War: Disabled');
        }

        this.gameState = GAME_STATES.PLAYING;
        console.log('Game initialized!');

        // Start first turn
        this.turnManager.startTurn();
    }

    getCurrentFleet() {
        return this.fleets[this.currentPlayer];
    }

    getEnemyFleet() {
        return this.currentPlayer === PLAYERS.PLAYER1
            ? this.fleets[PLAYERS.PLAYER2]
            : this.fleets[PLAYERS.PLAYER1];
    }

    getAllShips() {
        return this.map ? this.map.ships : [];
    }

    getShipsByOwner(owner, includeDestroyed = false) {
        return this.getAllShips().filter(ship => {
            if (!includeDestroyed && ship.isDestroyed) return false;
            return ship.owner === owner;
        });
    }

    getEnemyShipsFor(owner, includeDestroyed = false) {
        return this.getAllShips().filter(ship => {
            if (!includeDestroyed && ship.isDestroyed) return false;
            return ship.owner !== owner;
        });
    }

    resetShipsForOwner(owner) {
        const ships = this.getShipsByOwner(owner, false);
        for (const ship of ships) {
            ship.resetTurn();
        }
    }

    selectShip(ship) {
        // Can only select own ships that aren't destroyed
        if (ship.owner !== this.currentPlayer || ship.isDestroyed) {
            return false;
        }

        this.selectedShip = ship;
        this.actionMode = ACTION_MODES.NONE;
        this.validMovePositions = [];
        this.validTargets = [];
        this.clearMovementPreview();
        if (this.audioManager) {
            this.audioManager.play('ship_select');
        }

        console.log(`Selected: ${ship.getStatusText()}`);
        return true;
    }

    deselectShip() {
        this.selectedShip = null;
        this.cancelActionMode();
    }

    cancelActionMode() {
        this.actionMode = ACTION_MODES.NONE;
        this.validMovePositions = [];
        this.validTargets = [];
        this.clearMovementPreview();
    }

    enterMoveMode() {
        if (!this.selectedShip || !this.selectedShip.canMove()) {
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        this.actionMode = ACTION_MODES.MOVE;
        this.validMovePositions = this.selectedShip.getValidMovePositions(this.map, this);
        this.clearMovementPreview();
        console.log(`Move mode: ${this.validMovePositions.length} valid positions`);
        return true;
    }

    clearMovementPreview() {
        this.movementPreview = null;
    }

    getMovePositionAt(x, y) {
        return this.validMovePositions.find(pos => pos.x === x && pos.y === y) || null;
    }

    getPreviewOrientationFor(x, y, targetPos = null) {
        if (!this.selectedShip) return 'horizontal';
        if (this.selectedShip.type !== 2) {
            return this.selectedShip.orientation;
        }
        if (targetPos?.orientation) {
            return targetPos.orientation;
        }

        return this.getFrigateOrientationForStep(
            this.selectedShip.x,
            this.selectedShip.y,
            x,
            y,
            this.selectedShip.orientation
        );
    }

    updateMovementPreview(x, y, source = 'hover') {
        if (this.actionMode !== ACTION_MODES.MOVE || !this.selectedShip) {
            this.clearMovementPreview();
            return null;
        }

        if (!this.map.isValidPosition(x, y)) {
            this.clearMovementPreview();
            return null;
        }

        const targetPos = this.getMovePositionAt(x, y);
        const orientation = this.getPreviewOrientationFor(x, y, targetPos);
        const occupiedTiles = this.selectedShip.getOccupiedTiles(x, y, orientation);
        const isValid = Boolean(targetPos);

        this.movementPreview = {
            x,
            y,
            orientation,
            occupiedTiles,
            isValid,
            source,
            ship: this.selectedShip
        };

        return this.movementPreview;
    }

    enterAttackMode() {
        if (!this.selectedShip || !this.selectedShip.canAttack()) {
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        const enemyShips = this.getEnemyShipsFor(this.currentPlayer, false);
        this.actionMode = ACTION_MODES.ATTACK;
        this.validTargets = this.selectedShip.getAttackableTargets(
            this.map,
            enemyShips,
            this.fogOfWar,
            this.currentPlayer
        );
        console.log(`Attack mode: ${this.validTargets.length} valid targets`);
        return true;
    }

    enterBoardMode() {
        if (!this.selectedShip || !this.selectedShip.canBoard()) {
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        const enemyShips = this.getEnemyShipsFor(this.currentPlayer, false);
        this.actionMode = ACTION_MODES.BOARD;
        this.validTargets = this.selectedShip.getBoardableTargets(
            this.map,
            enemyShips,
            this.fogOfWar,
            this.currentPlayer
        );

        // Surface boarding constraints when enemies are adjacent but ineligible by level.
        if (this.validTargets.length === 0) {
            const adjacentVisibleEnemies = enemyShips.filter(enemy => {
                if (enemy.isDestroyed) return false;
                if (this.fogOfWar && !this.fogOfWar.isShipVisible(enemy, this.currentPlayer)) return false;
                return this.selectedShip.getBoardableTargets(this.map, [enemy]).length > 0;
            });

            if (adjacentVisibleEnemies.length > 0) {
                const blockedByLevel = adjacentVisibleEnemies.every(enemy => this.selectedShip.type <= enemy.type);
                if (blockedByLevel) {
                    const attacker = this.selectedShip;
                    this.hud.addCombatLogEntry({
                        type: 'info',
                        attackerOwner: attacker.owner,
                        outcome: 'failed',
                        summary: `Boarding blocked: ${attacker.name} cannot capture equal/higher-level ships`,
                        details: [
                            `${attacker.name} (Lvl ${attacker.type}) can only board ships below its level`,
                            `Adjacent targets are level ${adjacentVisibleEnemies.map(enemy => enemy.type).join(', ')}`
                        ],
                        signal: {
                            icon: '🛡️',
                            text: 'Boarding unavailable',
                            tone: 'warn'
                        }
                    });
                    if (this.audioManager) {
                        this.audioManager.play('invalid_action');
                    }
                }
            }
        }

        console.log(`Board mode: ${this.validTargets.length} valid targets`);
        return true;
    }

    isBoardingBlockedByLevel(attacker, target) {
        if (!attacker || !target) return false;
        if (target.owner === attacker.owner) return false;
        const isAdjacent = attacker.getBoardableTargets(this.map, [target]).length > 0;
        return isAdjacent && attacker.type <= target.type;
    }

    logBoardingBlockedByLevel(attacker, target) {
        this.hud.addCombatLogEntry({
            type: 'info',
            attackerOwner: attacker.owner,
            outcome: 'failed',
            summary: `Boarding blocked: ${attacker.name} (Lvl ${attacker.type}) cannot board ${target.name} (Lvl ${target.type})`,
            details: [
                'Boarding is only allowed against lower-level ships',
                `${attacker.name} must target a ship below level ${attacker.type}`
            ],
            signal: {
                icon: '🛡️',
                text: 'Boarding blocked by level',
                tone: 'warn'
            }
        });

        if (this.audioManager) {
            this.audioManager.play('invalid_action');
        }
    }

    moveShip(x, y) {
        if (this.actionMode !== ACTION_MODES.MOVE || !this.selectedShip) {
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        // Check if position is valid
        const isValid = this.validMovePositions.some(pos => pos.x === x && pos.y === y);
        if (!isValid) {
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        const targetPos = this.validMovePositions.find(pos => pos.x === x && pos.y === y);
        const targetOrientation = targetPos?.orientation || this.selectedShip.orientation;

        const destinationConflicts = this.map.getFootprintConflicts(
            x,
            y,
            this.selectedShip.footprint,
            targetOrientation,
            this.selectedShip
        );
        const hiddenEnemyConflicts = destinationConflicts.filter(ship => (
            ship.owner !== this.selectedShip.owner
            && this.fogOfWar
            && !this.fogOfWar.isShipVisible(ship, this.currentPlayer)
        ));

        if (hiddenEnemyConflicts.length > 0) {
            const hiddenNames = hiddenEnemyConflicts.map(ship => ship.name).join(', ');
            console.log(`⚠️ COLLISION! ${this.selectedShip.name} ran into unseen ship(s): ${hiddenNames}!`);

            // The moving ship takes one collision hit, and each collided hidden enemy takes one.
            this.selectedShip.takeDamage(1);
            hiddenEnemyConflicts.forEach(ship => ship.takeDamage(1));
            console.log(`Collision damage applied to moving ship and ${hiddenEnemyConflicts.length} hidden ship(s).`);
            [this.selectedShip, ...hiddenEnemyConflicts].forEach(ship => this.map.refreshShipRegistration(ship));

            const anyDestroyed = this.selectedShip.isDestroyed || hiddenEnemyConflicts.some(ship => ship.isDestroyed);
            if (anyDestroyed && this.audioManager) {
                this.audioManager.play('ship_sunk');
            }

            // Find an adjacent empty tile for the moving ship.
            const adjacentTile = this.findAdjacentEmptyTile(x, y, this.selectedShip, targetOrientation);
            if (adjacentTile) {
                if (this.selectedShip.type === 2) {
                    this.selectedShip.orientation = adjacentTile.orientation;
                }
                const moved = this.selectedShip.moveTo(adjacentTile.x, adjacentTile.y);
                if (moved) {
                    this.map.refreshShipRegistration(this.selectedShip);
                    console.log(`Ship deflected to adjacent tile (${adjacentTile.x}, ${adjacentTile.y})`);
                } else {
                    console.log('No valid deflection within remaining movement range.');
                }
            } else {
                // No adjacent tile available - ship doesn't move.
                console.log(`No adjacent tile available - ship stays at (${this.selectedShip.x}, ${this.selectedShip.y})`);
            }

            // Exit move mode
            this.actionMode = ACTION_MODES.NONE;
            this.validMovePositions = [];
            this.clearMovementPreview();
            if (this.audioManager) {
                this.audioManager.play('ship_move');
            }

            return true;
        }

        const blockingVisibleConflict = destinationConflicts.some(ship => (
            ship.owner === this.selectedShip.owner
            || !this.fogOfWar
            || this.fogOfWar.isShipVisible(ship, this.currentPlayer)
        ));
        if (blockingVisibleConflict) {
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        // Normal move (no collision)
        const distance = Math.abs(this.selectedShip.x - x) + Math.abs(this.selectedShip.y - y);
        if (this.selectedShip.type === 2 && targetPos?.orientation) {
            this.selectedShip.orientation = targetPos.orientation;
        }
        this.selectedShip.moveTo(x, y);
        this.map.refreshShipRegistration(this.selectedShip);

        console.log(`Ship moved ${distance} spaces to (${x}, ${y})`);

        // Exit move mode
        this.actionMode = ACTION_MODES.NONE;
        this.validMovePositions = [];
        this.clearMovementPreview();
        if (this.audioManager) {
            this.audioManager.play('ship_move');
        }

        return true;
    }

    getFrigateOrientationForStep(fromX, fromY, toX, toY, fallbackOrientation = 'horizontal') {
        const dx = toX - fromX;
        const dy = toY - fromY;
        if (Math.abs(dx) > Math.abs(dy)) return 'horizontal';
        if (Math.abs(dy) > Math.abs(dx)) return 'vertical';
        return fallbackOrientation;
    }

    findAdjacentEmptyTile(x, y, movingShip, baseOrientation = movingShip.orientation) {
        // Check all 4 adjacent positions (N, E, S, W)
        const adjacents = [
            { x: x, y: y - 1 },  // North
            { x: x + 1, y: y },  // East
            { x: x, y: y + 1 },  // South
            { x: x - 1, y: y }   // West
        ];

        // Shuffle to randomize which direction is chosen
        adjacents.sort(() => Math.random() - 0.5);

        for (const pos of adjacents) {
            const candidateOrientation = movingShip.type === 2
                ? this.getFrigateOrientationForStep(x, y, pos.x, pos.y, baseOrientation)
                : movingShip.orientation;
            const orientedFootprint = this.map.getOrientedFootprint(movingShip.footprint, candidateOrientation);

            // Check if position is valid
            if (!this.map.isValidPosition(pos.x, pos.y, orientedFootprint)) continue;

            const footprintTiles = this.map.getFootprintTiles(
                pos.x,
                pos.y,
                movingShip.footprint,
                candidateOrientation
            );
            const blockedByIsland = footprintTiles.some(tilePos => {
                const tile = this.map.getTile(tilePos.x, tilePos.y);
                return !tile || tile.isIsland();
            });
            if (blockedByIsland) continue;

            const conflicts = this.map.getFootprintConflicts(
                pos.x,
                pos.y,
                movingShip.footprint,
                candidateOrientation,
                movingShip
            );
            if (conflicts.length > 0) continue;

            return { ...pos, orientation: candidateOrientation };
        }

        // No valid adjacent tile found
        return null;
    }

    handleGridClick(x, y) {
        // Check if clicking on a ship
        const clickedShip = this.map.getShipAt(x, y);

        if (this.actionMode === ACTION_MODES.NONE) {
            // No action mode - select ship
            if (clickedShip) {
                this.selectShip(clickedShip);
            } else {
                this.deselectShip();
            }
        } else if (this.actionMode === ACTION_MODES.MOVE) {
            // Move mode - try to move to clicked position
            if (this.moveShip(x, y)) {
                // Move successful
            } else {
                // Invalid move, cancel
                this.cancelActionMode();
            }
        } else if (this.actionMode === ACTION_MODES.ATTACK) {
            // Attack mode - check if clicking on valid target
            if (clickedShip && this.validTargets.includes(clickedShip)) {
                this.attackShip(clickedShip);
            } else {
                // Cancel attack mode
                this.cancelActionMode();
                if (this.audioManager) {
                    this.audioManager.play('invalid_action');
                }
            }
        } else if (this.actionMode === ACTION_MODES.BOARD) {
            // Board mode - check if clicking on valid target
            if (clickedShip && this.validTargets.includes(clickedShip)) {
                this.boardShip(clickedShip);
            } else if (clickedShip && this.selectedShip && this.isBoardingBlockedByLevel(this.selectedShip, clickedShip)) {
                this.logBoardingBlockedByLevel(this.selectedShip, clickedShip);
            } else {
                // Cancel board mode
                this.cancelActionMode();
                if (this.audioManager) {
                    this.audioManager.play('invalid_action');
                }
            }
        }
    }

    attackShip(target) {
        if (!this.selectedShip || !this.selectedShip.canAttack()) {
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        // Safety check: verify target is visible if fog of war is enabled
        if (this.fogOfWar && !this.fogOfWar.isShipVisible(target, this.currentPlayer)) {
            console.log('Cannot attack target outside vision range');
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        const attackerCenter = this.selectedShip.getCenterPoint();
        const targetCenter = target.getCenterPoint();
        const distance = this.map.getDistance(
            attackerCenter.x,
            attackerCenter.y,
            targetCenter.x,
            targetCenter.y
        );

        // Resolve combat
        const result = CombatResolver.resolveAttack(this.selectedShip, target, distance);
        this.map.refreshShipRegistration(this.selectedShip);
        this.map.refreshShipRegistration(target);
        if (this.audioManager) {
            this.audioManager.play('cannon_fire');
            const cannonResults = result.cannonResults || result.rolls || [];
            cannonResults.forEach((roll, index) => {
                this.audioManager.playDelayed(roll.hit ? 'cannon_hit' : 'cannon_miss', index * 90);
            });
            if (result.defenderDestroyed) {
                this.audioManager.playDelayed('ship_sunk', cannonResults.length * 90 + 120);
            }
        }

        // Show result
        this.hud.showCombatResult(result);
        if (this.combatEventHandler) {
            this.combatEventHandler({
                type: 'attack',
                result: result
            });
        }

        // Exit attack mode
        this.cancelActionMode();

        return true;
    }

    boardShip(target) {
        if (!this.selectedShip || !this.selectedShip.canBoard()) {
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        // Safety check: verify target is visible if fog of war is enabled
        if (this.fogOfWar && !this.fogOfWar.isShipVisible(target, this.currentPlayer)) {
            console.log('Cannot board target outside vision range');
            if (this.audioManager) {
                this.audioManager.play('invalid_action');
            }
            return false;
        }

        // Resolve boarding
        if (this.audioManager) {
            this.audioManager.play('boarding_attempt');
        }
        const result = BoardingSystem.attemptBoarding(this.selectedShip, target, this.map);
        this.map.refreshShipRegistration(this.selectedShip);
        this.map.refreshShipRegistration(target);
        if (this.audioManager) {
            this.audioManager.play(result.success ? 'boarding_success' : 'boarding_failure');
            if (result.attackerDestroyed || result.defenderDestroyed) {
                this.audioManager.playDelayed('ship_sunk', 120);
            }
        }

        // Show result
        this.hud.showBoardingResult(result);
        if (this.combatEventHandler) {
            this.combatEventHandler({
                type: 'board',
                result: result
            });
        }

        // If ship was captured, it changes ownership
        if (result.success) {
            // The captured ship is now part of the capturing player's fleet
            console.log(`${target.name} now belongs to ${target.owner}`);
        }

        // Exit board mode
        this.cancelActionMode();

        return true;
    }

    endTurn() {
        if (this.turnManager) {
            this.turnManager.endTurn();
        }
    }

    checkWinCondition() {
        const player1ActiveShips = this.getShipsByOwner(PLAYERS.PLAYER1, false);
        const player2ActiveShips = this.getShipsByOwner(PLAYERS.PLAYER2, false);

        // Check if all ships under a player's control are gone
        if (player1ActiveShips.length === 0) {
            return PLAYERS.PLAYER2;
        }
        if (player2ActiveShips.length === 0) {
            return PLAYERS.PLAYER1;
        }

        // Check if an original flagship is currently captured (controlled by enemy)
        const allShips = this.getAllShips();
        const player1Flagship = allShips.find(ship => ship.isFlagship && ship.originalOwner === PLAYERS.PLAYER1 && !ship.isDestroyed);
        const player2Flagship = allShips.find(ship => ship.isFlagship && ship.originalOwner === PLAYERS.PLAYER2 && !ship.isDestroyed);

        if (player1Flagship && player1Flagship.isCaptured) {
            return PLAYERS.PLAYER2;
        }
        if (player2Flagship && player2Flagship.isCaptured) {
            return PLAYERS.PLAYER1;
        }

        return null; // No winner yet
    }
}
