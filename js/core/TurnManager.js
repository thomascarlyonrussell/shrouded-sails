import { PLAYERS } from '../utils/Constants.js?v=20260214e';

export class TurnManager {
    constructor(game) {
        this.game = game;
    }

    startTurn() {
        console.log(`\n=== Turn ${this.game.turnNumber} - Player ${this.game.currentPlayer === PLAYERS.PLAYER1 ? '1' : '2'} ===`);

        // Phase 1: Wind Phase (only apply at start of Player 1's turn, after Player 2 has finished)
        // Skip on turn 1 entirely to avoid blowing ships off map at start
        const isFirstTurn = this.game.turnNumber === 1;
        const isPlayer1Turn = this.game.currentPlayer === PLAYERS.PLAYER1;

        if (!isFirstTurn && isPlayer1Turn) {
            // Wind only applies when starting Player 1's turn (after both players have moved)
            this.executeWindPhase();
        } else if (isFirstTurn) {
            console.log('--- Wind Phase (Skipped - First turn) ---');
        } else {
            console.log('--- Wind Phase (Skipped - Wind applies after both players move) ---');
        }

        // Phase 2: Movement Phase (handled by player actions)
        // Phase 3: Combat Phase (handled by player actions)
        // Phase 4: End Phase (handled by endTurn)
    }

    executeWindPhase() {
        console.log('--- Wind Phase ---');

        // Update wind (check if it changes)
        this.game.wind.update();

        // Apply wind to all ships
        const results = this.game.wind.applyWindToShips(this.game.map.ships, this.game.map);

        // Log results
        if (results.length > 0) {
            console.log(`Wind affected ${results.length} ships`);
        }

        // Check for destroyed ships
        const destroyed = results.filter(r => r.type === 'off-map' || (r.type === 'island-collision' && r.ship.isDestroyed));
        if (destroyed.length > 0) {
            console.log(`${destroyed.length} ships destroyed by wind!`);
        }
    }

    endTurn() {
        console.log('--- End Phase ---');

        // Check win condition
        const winner = this.game.checkWinCondition();
        if (winner) {
            this.game.gameState = 'gameOver';
            const winnerNum = winner === PLAYERS.PLAYER1 ? '1' : '2';
            const winnerColor = winner === PLAYERS.PLAYER1 ? 'Red' : 'Blue';
            console.log(`\n*** GAME OVER - Player ${winnerNum} WINS! ***`);

            // Show game over modal
            this.showGameOver(winnerNum, winnerColor);
            return;
        }

        // If fog of war is enabled, show turn transition screen
        if (this.game.fogOfWar) {
            this.showTurnTransition();
        } else {
            // No fog of war, immediately switch turns
            this.switchToNextPlayer();
        }
    }

    showTurnTransition() {
        // Determine next player
        const nextPlayer = this.game.currentPlayer === PLAYERS.PLAYER1
            ? PLAYERS.PLAYER2
            : PLAYERS.PLAYER1;
        const nextPlayerNum = nextPlayer === PLAYERS.PLAYER1 ? '1' : '2';
        const nextPlayerColor = nextPlayer === PLAYERS.PLAYER1 ? 'Red' : 'Blue';

        // Update modal text
        const modal = document.getElementById('turnTransitionModal');
        const title = document.getElementById('turnTransitionTitle');
        const message = document.getElementById('turnTransitionMessage');

        title.textContent = `Player ${nextPlayerNum}'s Turn`;
        message.textContent = `Pass the device to the ${nextPlayerColor} player`;

        // Show modal
        modal.classList.remove('hidden');

        // Set up start turn button (remove old listeners first)
        const startTurnBtn = document.getElementById('startTurnBtn');
        const newBtn = startTurnBtn.cloneNode(true);
        startTurnBtn.parentNode.replaceChild(newBtn, startTurnBtn);

        // Add new listener
        newBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            this.switchToNextPlayer();
        });
    }

    switchToNextPlayer() {
        // Switch players
        this.game.currentPlayer = this.game.currentPlayer === PLAYERS.PLAYER1
            ? PLAYERS.PLAYER2
            : PLAYERS.PLAYER1;

        // Reset ships currently controlled by the active player
        this.game.resetShipsForOwner(this.game.currentPlayer);

        // Deselect ship
        this.game.deselectShip();

        // Increment turn if player 2 finished
        if (this.game.currentPlayer === PLAYERS.PLAYER1) {
            this.game.turnNumber++;
        }

        // Start next turn
        this.startTurn();
    }

    showGameOver(winnerNum, winnerColor) {
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');

        title.textContent = `Player ${winnerNum} Wins!`;
        message.textContent = `The ${winnerColor} fleet has achieved victory!`;

        modal.classList.remove('hidden');
    }
}
