import { PLAYERS, GAME_STATES, ACTION_MODES } from '../utils/Constants.js';
import { GameMap } from '../map/GameMap.js';
import { Fleet } from '../entities/Fleet.js';
import { Wind } from '../map/Wind.js';
import { TurnManager } from './TurnManager.js';
import { CombatResolver } from '../combat/CombatResolver.js';
import { BoardingSystem } from '../combat/BoardingSystem.js';
import { HUD } from '../ui/HUD.js';
import { FogOfWar } from '../fog/FogOfWar.js';

export class Game {
    constructor() {
        this.gameState = GAME_STATES.SETUP;
        this.map = null;
        this.fleets = {};
        this.currentPlayer = PLAYERS.PLAYER1;
        this.turnNumber = 1;
        this.wind = null;
        this.turnManager = null;
        this.hud = new HUD();
        this.fogOfWar = null;
        this.fogEnabled = true; // Default to enabled

        // UI state
        this.selectedShip = null;
        this.actionMode = ACTION_MODES.NONE;
        this.validMovePositions = [];
        this.validTargets = [];
    }

    initialize() {
        console.log('Initializing game...');

        // Create map
        this.map = new GameMap();

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

    selectShip(ship) {
        // Can only select own ships that aren't destroyed
        if (ship.owner !== this.currentPlayer || ship.isDestroyed) {
            return false;
        }

        this.selectedShip = ship;
        this.actionMode = ACTION_MODES.NONE;
        this.validMovePositions = [];
        this.validTargets = [];

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
    }

    enterMoveMode() {
        if (!this.selectedShip || !this.selectedShip.canMove()) {
            return false;
        }

        this.actionMode = ACTION_MODES.MOVE;
        this.validMovePositions = this.selectedShip.getValidMovePositions(this.map, this);
        console.log(`Move mode: ${this.validMovePositions.length} valid positions`);
        return true;
    }

    enterAttackMode() {
        if (!this.selectedShip || !this.selectedShip.canAttack()) {
            return false;
        }

        const enemyShips = this.getEnemyFleet().getActiveShips();
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
            return false;
        }

        const enemyShips = this.getEnemyFleet().getActiveShips();
        this.actionMode = ACTION_MODES.BOARD;
        this.validTargets = this.selectedShip.getBoardableTargets(
            this.map,
            enemyShips,
            this.fogOfWar,
            this.currentPlayer
        );
        console.log(`Board mode: ${this.validTargets.length} valid targets`);
        return true;
    }

    moveShip(x, y) {
        if (this.actionMode !== ACTION_MODES.MOVE || !this.selectedShip) {
            return false;
        }

        // Check if position is valid
        const isValid = this.validMovePositions.some(pos => pos.x === x && pos.y === y);
        if (!isValid) {
            return false;
        }

        // Check for unseen enemy ship collision
        const shipAtDestination = this.map.getShipAt(x, y);
        if (shipAtDestination && shipAtDestination.owner !== this.selectedShip.owner) {
            // There's an enemy ship at destination - check if it's visible
            const isVisible = this.fogOfWar
                ? this.fogOfWar.isShipVisible(shipAtDestination, this.currentPlayer)
                : true;

            if (!isVisible) {
                // Collision with unseen enemy ship!
                console.log(`⚠️ COLLISION! ${this.selectedShip.name} ran into unseen ${shipAtDestination.name}!`);

                // Both ships take 1 damage
                this.selectedShip.takeDamage(1);
                shipAtDestination.takeDamage(1);
                console.log(`Both ships take 1 damage from collision`);

                // Find an adjacent empty tile for the moving ship
                const adjacentTile = this.findAdjacentEmptyTile(x, y, this.selectedShip);

                if (adjacentTile) {
                    // Move to adjacent tile
                    const distance = Math.abs(this.selectedShip.x - adjacentTile.x) + Math.abs(this.selectedShip.y - adjacentTile.y);
                    this.selectedShip.moveTo(adjacentTile.x, adjacentTile.y);
                    console.log(`Ship deflected to adjacent tile (${adjacentTile.x}, ${adjacentTile.y})`);
                } else {
                    // No adjacent tile available - ship doesn't move
                    console.log(`No adjacent tile available - ship stays at (${this.selectedShip.x}, ${this.selectedShip.y})`);
                }

                // Exit move mode
                this.actionMode = ACTION_MODES.NONE;
                this.validMovePositions = [];

                return true;
            }
        }

        // Normal move (no collision)
        const distance = Math.abs(this.selectedShip.x - x) + Math.abs(this.selectedShip.y - y);
        this.selectedShip.moveTo(x, y);

        console.log(`Ship moved ${distance} spaces to (${x}, ${y})`);

        // Exit move mode
        this.actionMode = ACTION_MODES.NONE;
        this.validMovePositions = [];

        return true;
    }

    findAdjacentEmptyTile(x, y, movingShip) {
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
            // Check if position is valid
            if (!this.map.isValidPosition(pos.x, pos.y)) continue;

            // Check if it's water
            const tile = this.map.getTile(pos.x, pos.y);
            if (tile.isIsland()) continue;

            // Check if it's not occupied (or occupied by the moving ship's original position)
            const occupyingShip = this.map.getShipAt(pos.x, pos.y);
            if (occupyingShip && occupyingShip !== movingShip) continue;

            // This tile is valid
            return pos;
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
            }
        } else if (this.actionMode === ACTION_MODES.BOARD) {
            // Board mode - check if clicking on valid target
            if (clickedShip && this.validTargets.includes(clickedShip)) {
                this.boardShip(clickedShip);
            } else {
                // Cancel board mode
                this.cancelActionMode();
            }
        }
    }

    attackShip(target) {
        if (!this.selectedShip || !this.selectedShip.canAttack()) {
            return false;
        }

        // Safety check: verify target is visible if fog of war is enabled
        if (this.fogOfWar && !this.fogOfWar.isShipVisible(target, this.currentPlayer)) {
            console.log('Cannot attack target outside vision range');
            return false;
        }

        const distance = this.map.getDistance(
            this.selectedShip.x,
            this.selectedShip.y,
            target.x,
            target.y
        );

        // Resolve combat
        const result = CombatResolver.resolveAttack(this.selectedShip, target, distance);

        // Show result
        this.hud.showCombatResult(result);

        // Exit attack mode
        this.cancelActionMode();

        return true;
    }

    boardShip(target) {
        if (!this.selectedShip || !this.selectedShip.canBoard()) {
            return false;
        }

        // Safety check: verify target is visible if fog of war is enabled
        if (this.fogOfWar && !this.fogOfWar.isShipVisible(target, this.currentPlayer)) {
            console.log('Cannot board target outside vision range');
            return false;
        }

        // Resolve boarding
        const result = BoardingSystem.attemptBoarding(this.selectedShip, target);

        // Show result
        this.hud.showBoardingResult(result);

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
        const player1Fleet = this.fleets[PLAYERS.PLAYER1];
        const player2Fleet = this.fleets[PLAYERS.PLAYER2];

        // Check if all ships destroyed
        if (!player1Fleet.hasShipsRemaining()) {
            return PLAYERS.PLAYER2;
        }
        if (!player2Fleet.hasShipsRemaining()) {
            return PLAYERS.PLAYER1;
        }

        // Check if flagship captured
        const player1Flagship = player1Fleet.getFlagship();
        const player2Flagship = player2Fleet.getFlagship();

        if (player1Flagship && player1Flagship.isCaptured) {
            return PLAYERS.PLAYER2;
        }
        if (player2Flagship && player2Flagship.isCaptured) {
            return PLAYERS.PLAYER1;
        }

        return null; // No winner yet
    }
}
